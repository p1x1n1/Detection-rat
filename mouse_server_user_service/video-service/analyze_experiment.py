import os
import cv2
import json
import copy
import numpy as np
import torch
from ultralytics import YOLO
from typing import Dict, Any, Callable
import math
import imageio_ffmpeg
import subprocess

# === Настройка модели и цветов для классов ===
model_main = YOLO("models/best24.pt", verbose=False)
COLOR_MAP_MAIN = {
    "mouse": (128, 0, 128),
    "hole_peek": (255, 165, 0),
    "rearing": (0, 255, 255),
    "grooming": (255, 0, 255),
}
# модель для дефекаций (и, по желанию, ROI-классов)
model_def = YOLO("models/best24.pt", verbose=False)
COLOR_MAP_DEF = {
    "defecation": (0, 128, 0),
}

DEFAULT_MASK_PATH = "mask.png"
DEFAULT_ANNOT_PATH = "mask_annotations.json"

METRIC_MAP = {
    "Количество пересеченных линий за заданный промежуток времени": "line_count_time",
    "Количество пересечений горизонтальных линий": "line_count_horizontal",
    "Количество заглядывай в отверстия": "hole_peek",
    "Количество стоек": "rearing",
    "Время нахождения животного в центральном отсеке лабиринта": "centr_time",
    "Время нахождения животного в периферическом отсеке лабиринта": "perf_time",
    "Количество дефекаций": "defecation_count",
    "Количество груминга": "grooming_count"
}

HOLE_EPSILON = 5.0
mouse_last_position = None
mouse_moved_threshold = 15

# пороговое расстояние до линии (можно подстроить под разрешение видео)
LINE_EPSILON = 5.0

# кулдаун для метрик grooming, rearing, hole_peek - может стоит также сохранять координаты предудщего такого случая
COULDOWN = 30

# минимальный сдвиг мыши (в пикселях) с последнего события, чтобы засчитать новое
SHIFT_THRESHOLD = 30.0

# порог (в пикселях) для новой дефекации
DEFECATION_EPSILON = 30.0


def analyze_experiment(exp: Dict[str, Any]) -> Dict[str, Any]:
    active = {}
    for me in exp.get("metricExperiments", []):
        nm = me["metric"]["metricName"]
        if nm in METRIC_MAP:
            key = METRIC_MAP[nm]
            active[key] = {
                "metricId": me["metricId"],
                "value": 0,
                "comment": me.get("comment"),
                "startTime": me.get("startTime"),
                "endTime": me.get("endTime")
            }
    return active


def get_video_paths(exp: Dict[str, Any],
                    base_path: str = "../lab-service/static/videos") -> list:
    paths = []
    for ve in exp.get("videoExperiments", []):
        fn = ve["video"]["filename"]
        p = os.path.join(base_path, os.path.basename(fn))
        if not os.path.isfile(p):
            raise FileNotFoundError(f"Video not found: {p}")
        paths.append(p)
    return paths


def get_roi_auto(frame: np.ndarray,
                 conf_thresh: float = 0.5,
                 min_area: float = 1000.0
                 ) -> tuple[int, int, int, int] | None:
    rd = model_def.predict(frame, conf=conf_thresh, verbose=False)[0]
    candidates = []
    for i, cls in enumerate(rd.boxes.cls):
        name = rd.names[int(cls)].lower()
        if name == "roi":
            x1, y1, x2, y2 = map(float, rd.boxes.xyxy[i])
            area = (x2 - x1) * (y2 - y1)
            if area >= min_area:
                candidates.append({
                    "bbox": (int(x1), int(y1), int(x2 - x1), int(y2 - y1)),
                    "area": area,
                    "conf": float(rd.boxes.conf[i])
                })
    if not candidates:
        return None
    best = max(candidates, key=lambda c: c["conf"])
    return best["bbox"]


def load_annotations(path: str) -> Dict[str, Any]:
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def preprocess_edges(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 50, 150)
    return cv2.morphologyEx(edges, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))

def align_mask_to_roi(mask: np.ndarray, roi_img: np.ndarray) -> np.ndarray:
    me = preprocess_edges(mask)
    re = preprocess_edges(roi_img)
    h, w = re.shape
    me = cv2.resize(me, (w, h))
    warp = np.eye(2, 3, dtype=np.float32)
    try:
        _, warp = cv2.findTransformECC(
            me, re, warp, cv2.MOTION_AFFINE,
            (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 5000, 1e-6)
        )
    except cv2.error:
        pass
    return warp


def transform_annotations(elems: Dict[str, Any], M: np.ndarray) -> Dict[str, Any]:
    a, b, tx = M[0]
    c, d, ty = M[1]
    sx = np.hypot(a, c)
    sy = np.hypot(b, d)
    scale = (sx + sy) / 2
    out = copy.deepcopy(elems)

    def _transform_circle(name):
        c0 = elems.get(name)
        if c0:
            x, y, r = c0["x"], c0["y"], c0["r"]
            X = a * x + b * y + tx
            Y = c * x + d * y + ty
            out[name] = {"x": float(X), "y": float(Y), "r": float(r * scale)}

    for name in ("periphery_circle", "middle_circle", "center_circle"):
        _transform_circle(name)

    holes = []
    for h0 in elems.get("holes", []):
        x, y, r = h0["x"], h0["y"], h0["r"]
        X = a * x + b * y + tx
        Y = c * x + d * y + ty
        holes.append({"x": float(X), "y": float(Y), "r": float(r * scale)})
    out["holes"] = holes

    for kind in ("horizontal", "vertical"):
        lines = []
        for L in elems["lines"].get(kind, []):
            x1, y1, x2, y2 = L["x1"], L["y1"], L["x2"], L["y2"]
            X1 = a * x1 + b * y1 + tx
            Y1 = c * x1 + d * y1 + ty
            X2 = a * x2 + b * y2 + tx
            Y2 = c * x2 + d * y2 + ty
            lines.append({"x1": float(X1), "y1": float(Y1),
                          "x2": float(X2), "y2": float(Y2)})
        out["lines"][kind] = lines

    return out


def track_mouse_movement(ctx: Dict[str, Any], res, roi) -> bool:
    """
    Теперь содержит все координаты бокса [x1, y1, x2, y2]
    (относительно ROI), а не только центр. Для вычислений центра
    используем эти четыре числа в анализаторах.
    """
    """
    Запоминаем:
      - roi: (x_off, y_off, w, h)
      - mouse_position: [x1_rel,y1_rel,x2_rel,y2_rel]
      - mouse_position_absolute: [x1_abs,y1_abs,x2_abs,y2_abs]
      - mouse_delta: (dx,dy) смещение центра бокса относительно ROI
    """
    global mouse_last_position
    x_off, y_off, _, _ = roi
    bbox_rel = None
    bbox_abs = None

    for i, cls in enumerate(res.boxes.cls):
        if model_main.names[int(cls)].lower() == "mouse":
            x1, y1, x2, y2 = map(float, res.boxes.xyxy[i])
            bbox_abs = [x1, y1, x2, y2]
            bbox_rel = [x1 - x_off, y1 - y_off, x2 - x_off, y2 - y_off]
            break

    ctx["roi"] = {"x_off": x_off, "y_off": y_off, "w": roi[2], "h": roi[3]}
    ctx["mouse_position"] = bbox_rel
    ctx["mouse_position_absolute"] = bbox_abs

    if bbox_rel is None:
        ctx["mouse_delta"] = None
        return False

    # Центр бокса
    cx = (bbox_abs[0] + bbox_abs[2]) / 2
    cy = (bbox_abs[1] + bbox_abs[3]) / 2

    # смещение центра относительно ROI
    dx = cx - (x_off + ctx["roi"]["w"] / 2)
    dy = cy - (y_off + ctx["roi"]["h"] / 2)
    ctx["mouse_delta"] = {"dx": dx, "dy": dy}

    # трекинг перемещения
    if mouse_last_position is None:
        mouse_last_position = (cx, cy)
        return False

    prev_cx, prev_cy = mouse_last_position
    moved = math.hypot(cx - prev_cx, cy - prev_cy) > mouse_moved_threshold
    if moved:
        mouse_last_position = (cx, cy)
    return moved

# === Анализаторы ===
# В каждом анализаторе, где использовался ctx["mouse_position"] как (x, y),
# теперь вычисляем центр из bbox = [x1,y1,x2,y2].

def analyze_rearing(frame, res, ctx):
    bbox = ctx.get("mouse_position_absolute")
    cd = ctx.get("rearing_cooldown", COULDOWN)
    if cd < COULDOWN:
        ctx["rearing_cooldown"] = cd + 1
    found = any(model_main.names[int(cls)].lower() == "rearing" for cls in res.boxes.cls)
    if not found or ctx["rearing_cooldown"] < COULDOWN or bbox is None:
        return

    cx = (bbox[0] + bbox[2]) / 2
    cy = (bbox[1] + bbox[3]) / 2
    last = ctx.get("last_rearing_pos")
    if last is None or math.hypot(cx - last[0], cy - last[1]) >= SHIFT_THRESHOLD:
        ctx["rearing"] = ctx.get("rearing", 0) + 1
        ctx["rearing_cooldown"] = 0
        ctx["last_rearing_pos"] = (cx, cy)


def analyze_grooming_count(frame, res, ctx):
    bbox = ctx.get("mouse_position_absolute")
    cd = ctx.get("grooming_cooldown", COULDOWN)
    if cd < COULDOWN:
        ctx["grooming_cooldown"] = cd + 1
    found = any(model_main.names[int(cls)].lower() == "grooming" for cls in res.boxes.cls)
    if not found or ctx["grooming_cooldown"] < COULDOWN or bbox is None:
        return

    cx = (bbox[0] + bbox[2]) / 2
    cy = (bbox[1] + bbox[3]) / 2
    last = ctx.get("last_grooming_pos")
    if last is None or math.hypot(cx - last[0], cy - last[1]) >= SHIFT_THRESHOLD:
        ctx["grooming_count"] = ctx.get("grooming_count", 0) + 1
        ctx["grooming_cooldown"] = 0
        ctx["last_grooming_pos"] = (cx, cy)


def analyze_hole_peek(frame, res, ctx):
    bbox = ctx.get("mouse_position_absolute")
    if bbox is None:
        ctx["prev_hole_peek"] = False
        return
    cx = (bbox[0] + bbox[2]) / 2
    cy = (bbox[1] + bbox[3]) / 2
    inside = any(
        (cx - h["x"]) ** 2 + (cy - h["y"]) ** 2 <= (h["r"] + HOLE_EPSILON) ** 2
        for h in ctx["holes_list"]
    )
    if inside and not ctx.get("prev_hole_peek", False):
        ctx["hole_peek"] = ctx.get("hole_peek", 0) + 1
        ctx["prev_hole_peek"] = True
    elif not inside:
        ctx["prev_hole_peek"] = False


from typing import Dict, Any
import math


def _analyze_line_crossing(ctx: Dict[str, Any],
                           lines: list[dict],
                           prev_flag_key: str,
                           metric_key: str):
    """
    Проверяет, пересекает ли любая из линий в `lines` AABB мышиного бокса
    ctx['mouse_position'] = [xmin, ymin, xmax, ymax], и только
    если длина пересечения внутри AABB ≥ (max(width,height)/3), то
    считаем пересечение и увеличиваем ctx[metric_key] при переходе
    флага ctx[prev_flag_key] from False→True.
    """
    bbox = ctx.get("mouse_position_absolute")  # [xmin, ymin, xmax, ymax]
    if bbox is None:
        ctx[prev_flag_key] = False
        return

    xmin, ymin, xmax, ymax = bbox
    width = xmax - xmin
    height = ymax - ymin
    # порог: треть от большей стороны
    threshold = max(width, height) / 3.0

    # вспомогательные функции
    def point_in_rect(x, y):
        return xmin <= x <= xmax and ymin <= y <= ymax

    def orient(a, b, c):
        return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

    def on_segment(a, b, c):
        return (min(a[0], b[0]) <= c[0] <= max(a[0], b[0]) and
                min(a[1], b[1]) <= c[1] <= max(a[1], b[1]))

    def segs_intersect(p1, p2, q1, q2):
        o1 = orient(p1, p2, q1)
        o2 = orient(p1, p2, q2)
        o3 = orient(q1, q2, p1)
        o4 = orient(q1, q2, p2)
        if o1 * o2 < 0 and o3 * o4 < 0:
            return True
        # коллинеарные граничные
        if o1 == 0 and on_segment(p1, p2, q1): return True
        if o2 == 0 and on_segment(p1, p2, q2): return True
        if o3 == 0 and on_segment(q1, q2, p1): return True
        if o4 == 0 and on_segment(q1, q2, p2): return True
        return False

    def line_intersection(p1, p2, q1, q2):
        # возвращает точку пересечения бесконечных прямых, либо None
        x1, y1 = p1;
        x2, y2 = p2
        x3, y3 = q1;
        x4, y4 = q2
        denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
        if abs(denom) < 1e-6:
            return None
        px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom
        py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom
        return (px, py)

    # грани AABB
    rect_edges = [
        ((xmin, ymin), (xmax, ymin)),
        ((xmax, ymin), (xmax, ymax)),
        ((xmax, ymax), (xmin, ymax)),
        ((xmin, ymax), (xmin, ymin)),
    ]

    crossed = False
    for L in lines:
        p1 = (L["x1"], L["y1"])
        p2 = (L["x2"], L["y2"])

        # собираем все точки пересечения с AABB
        ips = []
        # концы внутри?
        if point_in_rect(*p1): ips.append(p1)
        if point_in_rect(*p2): ips.append(p2)
        # пересечение с гранями
        for q1, q2 in rect_edges:
            if segs_intersect(p1, p2, q1, q2):
                ip = line_intersection(p1, p2, q1, q2)
                if ip is not None:
                    ips.append(ip)

        # оставляем уникальные
        # (округляем до миллиметра, чтобы не было дублей по плавающей точке)
        uniq = {}
        for x, y in ips:
            key = (round(x, 3), round(y, 3))
            uniq[key] = (x, y)
        pts = list(uniq.values())

        if len(pts) >= 2:
            # длина внутри AABB = наибольшее расстояние между любыми двумя точками пересечения
            max_d = 0.0
            for i in range(len(pts)):
                for j in range(i + 1, len(pts)):
                    dx = pts[i][0] - pts[j][0]
                    dy = pts[i][1] - pts[j][1]
                    d = math.hypot(dx, dy)
                    if d > max_d:
                        max_d = d
            # если длина ≥ threshold — пересекаем
            if max_d >= threshold:
                crossed = True

        if crossed:
            break

    # обновление флага/счётчика
    if crossed and not ctx.get(prev_flag_key, False):
        ctx[metric_key] = ctx.get(metric_key, 0) + 1
        ctx[prev_flag_key] = True
    elif not crossed:
        ctx[prev_flag_key] = False


def analyze_line_count_time(frame, res, ctx):
    metric = ctx.get("active_metrics", {}).get("line_count_time")
    if metric is None:
        return
    frame_idx = ctx.get("frame_idx", 1)
    current_time = (frame_idx - 1) * ctx.get("dt", 0.0)
    if (metric.get("startTime") is not None and current_time < float(metric["startTime"])) or \
            (metric.get("endTime") is not None and current_time > float(metric["endTime"])):
        return
    _analyze_line_crossing(ctx, ctx.get("line_list", []), "prev_line_cross", "line_count_time")


def analyze_line_count_horizontal(frame, res, ctx):
    _analyze_line_crossing(ctx, ctx.get("horizontal_line_list", []),
                           "prev_horizontal_cross", "line_count_horizontal")


def analyze_centr_time(frame, res, ctx):
    """
    Считает время (в секундах), пока AABB мышиного бокса
    пересекает центральную окружность (center_circle).
    """
    bbox = ctx.get("mouse_position_absolute")  # [xmin, ymin, xmax, ymax]
    center = ctx.get("center_circle")  # {"x": cx, "y": cy, "r": r}
    dt = ctx.get("dt", 0.0)

    if bbox is None or center is None:
        return

    xmin, ymin, xmax, ymax = bbox
    cx, cy, r = center["x"], center["y"], center["r"]

    # --- debug print ---
    # print(f"analyze_centr_time: bbox=[{xmin:.1f},{ymin:.1f},{xmax:.1f},{ymax:.1f}], "
    #       f"circle_center=({cx:.1f},{cy:.1f}), r={r:.1f}")

    # Находим ближайшую к центру круга точку на AABB (clamp)
    closest_x = max(xmin, min(cx, xmax))
    closest_y = max(ymin, min(cy, ymax))

    dist_sq = (closest_x - cx) ** 2 + (closest_y - cy) ** 2
    # print(f"  closest_point=({closest_x:.1f},{closest_y:.1f}), "
    #       f"dist_sq={dist_sq:.1f}, r^2={r * r:.1f}")

    # Если эта точка внутри круга — пересечение есть
    if dist_sq <= r * r:
        old = ctx.get("centr_time", 0.0)
        ctx["centr_time"] = old + dt
        # print(f"  -> пересекает, centr_time: {old:.2f} + {dt:.2f} = {ctx['centr_time']:.2f}")
    # else:
        # print("  -> не пересекает")


def analyze_perf_time(frame, res, ctx):
    metric = ctx.get("mouse_position_absolute")
    per = ctx.get("periphery_circle")
    mid = ctx.get("middle_circle")
    if metric is None or per is None or mid is None:
        return
    cx = (metric[0] + metric[2]) / 2
    cy = (metric[1] + metric[3]) / 2
    inside_per = (cx - per["x"]) ** 2 + (cy - per["y"]) ** 2 <= per["r"] ** 2
    outside_mid = (cx - mid["x"]) ** 2 + (cy - mid["y"]) ** 2 >= mid["r"] ** 2
    if inside_per and outside_mid:
        ctx["perf_time"] = ctx.get("perf_time", 0.0) + ctx["dt"]


def analyze_defecation_count(frame, res, ctx):
    rd = model_def.predict(frame, conf=0.5, verbose=False)[0]
    pos_list = ctx.setdefault("defecation_positions", [])
    for i, cls in enumerate(rd.boxes.cls):
        if rd.names[int(cls)].lower() == "defecation":
            x1, y1, x2, y2 = map(float, rd.boxes.xyxy[i])
            cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
            if all(math.hypot(cx - px, cy - py) > DEFECATION_EPSILON for px, py in pos_list):
                ctx["defecation_count"] = ctx.get("defecation_count", 0) + 1
                pos_list.append((cx, cy))
    ctx["defecation_positions"] = pos_list


METRIC_FUNCS: Dict[str, Callable] = {
    "rearing": analyze_rearing,
    "grooming_count": analyze_grooming_count,
    "hole_peek": analyze_hole_peek,
    "line_count_time": analyze_line_count_time,
    "line_count_horizontal": analyze_line_count_horizontal,
    "centr_time": analyze_centr_time,
    "perf_time": analyze_perf_time,
    "defecation_count": analyze_defecation_count
}


# === Функция отрисовки боксов по цветовой карте ===
def plot_boxes(image, boxes, result, names, color_map):
    for i, box in enumerate(boxes):
        x1, y1, x2, y2 = map(int, box)
        cls_idx = int(result.boxes.cls[i])
        cls_name = names[cls_idx].lower()
        clr = color_map.get(cls_name, (255, 255, 255))
        conf = float(result.boxes.conf[i])
        cv2.rectangle(image, (x1, y1), (x2, y2), clr, 2)
        cv2.putText(
            image,
            f"{cls_name}: {conf:.2f}",
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 255),
            1
        )
    return image


def transformation_annotations_coordinate(elems: Dict[str, Any],
                                          roi: tuple[int, int, int, int],
                                          mask_w: int,
                                          mask_h: int,
                                          ctx: Dict[str, Any]) -> np.ndarray:
    x_off, y_off, w_roi, h_roi = roi
    sx, sy = w_roi / mask_w, h_roi / mask_h

    # Отрисовка окружностей
    def dc(c):
        x = int(c["x"] * sx) + x_off
        y = int(c["y"] * sy) + y_off
        r = int(c["r"] * ((sx + sy) / 2))
        ctx[name] = {"x": x, "y": y, "r": r}

    for name, clr in [
        ("periphery_circle", (255, 0, 0), "Periphery"),
        ("middle_circle", (0, 165, 255), "Middle"),
        ("center_circle", (0, 255, 0), "Center")
    ]:
        if elems.get(name):
            dc(elems[name])

    # Отрисовка отверстий
    for i, hole in enumerate(elems.get("holes", []), start=1):
        dc(hole)

    # Объединяем все линии и пронумеровываем по порядку
    all_lines = elems["lines"]["horizontal"] + elems["lines"]["vertical"]
    for idx, L in enumerate(all_lines, start=1):
        x1 = int(L["x1"] * sx) + x_off
        y1 = int(L["y1"] * sy) + y_off
        x2 = int(L["x2"] * sx) + x_off
        y2 = int(L["y2"] * sy) + y_off
        
def draw_annotations(frame: np.ndarray,
                     elems: Dict[str, Any],
                     roi: tuple[int, int, int, int],
                     mask_w: int,
                     mask_h: int,
                     ctx: Dict[str, Any],
                     frame_idx: int) -> np.ndarray:
    x_off, y_off, w_roi, h_roi = roi
    out = frame.copy()
    cv2.rectangle(out, (x_off, y_off), (x_off + w_roi, y_off + h_roi), (200, 200, 200), 1)
    sx, sy = w_roi / mask_w, h_roi / mask_h

    # Отрисовка окружностей
    def dc(c, clr, lab):
        x = int(c["x"] * sx) + x_off
        y = int(c["y"] * sy) + y_off
        r = int(c["r"] * ((sx + sy) / 2))
        cv2.circle(out, (x, y), r, clr, 2)
        cv2.putText(out, lab, (x - r, y - r - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, clr, 2)

    for name, clr, lab in [
        ("periphery_circle", (255, 0, 0), "Periphery"),
        ("middle_circle", (0, 165, 255), "Middle"),
        ("center_circle", (0, 255, 0), "Center")
    ]:
        if elems.get(name):
            dc(elems[name], clr, lab)

    # Отрисовка отверстий
    for i, hole in enumerate(elems.get("holes", []), start=1):
        dc(hole, (0, 255, 255), f"Hole {i}")

    # Объединяем все линии и пронумеровываем по порядку
    all_lines = elems["lines"]["horizontal"] + elems["lines"]["vertical"]
    for idx, L in enumerate(all_lines, start=1):
        x1 = int(L["x1"] * sx) + x_off
        y1 = int(L["y1"] * sy) + y_off
        x2 = int(L["x2"] * sx) + x_off
        y2 = int(L["y2"] * sy) + y_off
        # цвет: красный для horizontal, синий для vertical
        if L in elems["lines"]["horizontal"]:
            clr = (255, 0, 0)
        else:
            clr = (0, 0, 255)
        cv2.line(out, (x1, y1), (x2, y2), clr, 2)
        cv2.putText(out, str(idx), (x1, y1 - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, clr, 1)

    # Выводим номер кадра и время
    time_sec = (frame_idx - 1) * ctx["dt"]
    cv2.putText(out, f"Frame {frame_idx} ({time_sec:.2f}s)",
                (x_off + 10, y_off + h_roi - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # Значения активных метрик
    line_offset = 1
    for name in ctx["active_metrics"].keys():
        if name in ctx:
            y = int(y_off + h_roi - 10 - 30 * line_offset)
            cv2.putText(out, f"{name}: {ctx[name]}",
                        (x_off + 10, y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            line_offset += 1

    return out

def transform_annotations_coordinate(
    ctx: Dict[str, Any],
    roi: tuple[int, int, int, int],
    mask_w: int,
    mask_h: int
) -> None:
    """
    Преобразует в ctx:
      - center_circle, middle_circle, periphery_circle
      - holes_list
      - line_list, horizontal_line_list
    из системы координат маски/ROI в абсолютные координаты кадра.

    Параметры:
      ctx     – словарь контекста с уже загруженными в него аннотациями
      roi     – кортеж (x_off, y_off, w_roi, h_roi)
      mask_w  – ширина исходного mask.png
      mask_h  – высота исходного mask.png
    """
    x_off, y_off, w_roi, h_roi = roi
    sx = w_roi / mask_w
    sy = h_roi / mask_h
    s_radius = (sx + sy) / 2

    # 1) Круги
    for name in ("periphery_circle", "middle_circle", "center_circle"):
        c = ctx.get(name)
        if c is not None:
            X = c["x"] * sx + x_off
            Y = c["y"] * sy + y_off
            R = c["r"] * s_radius
            ctx[name] = {"x": X, "y": Y, "r": R}

    # 2) Отверстия
    holes = []
    for h in ctx.get("holes_list", []):
        X = h["x"] * sx + x_off
        Y = h["y"] * sy + y_off
        R = h["r"] * s_radius
        holes.append({"x": X, "y": Y, "r": R})
    ctx["holes_list"] = holes

    # 3) Линии
    def _convert_lines(key: str):
        new = []
        for L in ctx.get(key, []):
            X1 = L["x1"] * sx + x_off
            Y1 = L["y1"] * sy + y_off
            X2 = L["x2"] * sx + x_off
            Y2 = L["y2"] * sy + y_off
            new.append({"x1": X1, "y1": Y1, "x2": X2, "y2": Y2})
        ctx[key] = new

    _convert_lines("line_list")
    _convert_lines("horizontal_line_list")

# def predict_on_roi(frame: np.ndarray, roi: tuple):
#     x_off, y_off, w_roi, h_roi = roi
#     roi_img = frame[y_off:y_off+h_roi, x_off:x_off+w_roi]
#     res = model_main.predict(roi_img, conf=0.5)[0]
#     # клонируем и отделяем от графа, чтобы можно было править
#     boxes = res.boxes.xyxy.clone().detach()
#     boxes[:, [0, 2]] += x_off
#     boxes[:, [1, 3]] += y_off
#     return res, boxes

def process_video_for_metrics(expId,
                              video_path: str,
                              active_metrics: Dict[str, Any]) -> Dict[str, Any]:
    mask = cv2.imread(DEFAULT_MASK_PATH)
    mask_h, mask_w = mask.shape[:2]
    elems = load_annotations(DEFAULT_ANNOT_PATH)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise IOError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    delay = max(1, int(1000.0 / fps))
    dt = 1.0 / fps

    # --- читаем первый кадр и определяем ROI ---
    ret, first = cap.read()
    if not ret:
        raise IOError("Empty video")

    auto_roi = get_roi_auto(first, conf_thresh=0.5, min_area=5000.0)
    if auto_roi:
        x, y, w_roi, h_roi = auto_roi
        print(f"Автоматически выбран ROI: x={x}, y={y}, w={w_roi}, h={h_roi}")
        roi = (x, y, w_roi, h_roi)
    else:
        x, y, w_roi, h_roi = cv2.selectROI("Select ROI", first,
                                           showCrosshair=True, fromCenter=False)
        roi = (x, y, w_roi, h_roi)
    cv2.destroyAllWindows()

    warp = align_mask_to_roi(mask, first[y:y + h_roi, x:x + w_roi])
    elems2 = transform_annotations(elems, warp)
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

    # контекст с нужными полями
    ctx = {
        "dt": dt,
        "active_metrics": active_metrics,
        "holes_list": elems2["holes"],
        "prev_hole_peek": False,
        "line_list": elems2["lines"]["horizontal"] + elems2["lines"]["vertical"],
        "horizontal_line_list": elems2["lines"]["horizontal"],
        "periphery_circle": elems2.get("periphery_circle"),
        "middle_circle": elems2.get("middle_circle"),
        "center_circle": elems2.get("center_circle"),
        "rearing_cooldown": COULDOWN,
        "grooming_cooldown": COULDOWN,
        "last_rearing_pos": None,
        "last_grooming_pos": None,
        "defecation_positions": [],
    }
    
    transform_annotations_coordinate(ctx, roi, mask_w, mask_h)

    # собираем параметры
    base    = os.path.splitext(os.path.basename(video_path))[0]
    out_fn  = f"{base}_{expId}_result.mp4"
    out_path= os.path.join(os.path.dirname(video_path), out_fn)
    width   = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height  = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # путь до бинарника ffmpeg, скачанного imageio-ffmpeg
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

    # собираем команду и запускаем процесс
    cmd = [
        ffmpeg_exe,
        '-loglevel', 'error',
        '-y',
        '-f', 'rawvideo',
        '-pix_fmt', 'bgr24',
        '-s', f'{width}x{height}',
        '-r', str(fps),
        '-i', 'pipe:0',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'fast',
        '-movflags', '+faststart',
        '-f', 'mp4',
        out_path
    ]
    process = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    frame_idx = 1
    # cv2.namedWindow("Analysis", cv2.WINDOW_NORMAL)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        ctx["frame_idx"] = frame_idx

        # ► вместо
        # res, boxes = predict_on_roi(frame, roi)
        # ▼ делаем предсказание на полном кадре:
        res = model_main.predict(frame, conf=0.5, verbose=False)[0]
        # получаем локальную копию боксов
        boxes = res.boxes.xyxy.clone().detach()

        # 2) трекинг мыши (он смотрит в res.boxes.xyxy — это ROI-координаты, ок)
        # старый вариант:
        # moved = track_mouse_movement(ctx, res)
        # теперь:
        moved = track_mouse_movement(ctx, res, roi)
        ctx["mouse_moved"] = moved

        # 3) подсчет активных метрик
        for key in active_metrics:
            fn = METRIC_FUNCS.get(key)
            if fn:
                fn(frame, res, ctx)

        #  9) визуализация main-модели
        viz = plot_boxes(frame.copy(),
                         boxes,
                         res,
                         model_main.names,
                         COLOR_MAP_MAIN)
        annotated = draw_annotations(viz, elems2, roi, mask_w, mask_h, ctx, frame_idx)

        # 10) поверх результирующего кадра рисуем дефекации из ctx
        for cx, cy in ctx.get("defecation_positions", []):
            cv2.circle(annotated, (int(cx), int(cy)), 10, COLOR_MAP_DEF["defecation"], 2)

        # writer.write(annotated)
        process.stdin.write(annotated.astype(np.uint8).tobytes())
        # cv2.imshow("Analysis", annotated)
        if cv2.waitKey(delay) & 0xFF == 27:
            break

        frame_idx += 1

    cap.release()
    # writer.release()
    process.stdin.close()
    process.wait()
    cv2.destroyAllWindows()

    # сохраняем результаты
    for k in active_metrics:
        if k in ctx:
            active_metrics[k]["value"] = round(ctx[k], 2)
    return active_metrics
