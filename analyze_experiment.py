import os
import cv2
import json
import copy
import numpy as np
import torch
from ultralytics import YOLO
from typing import Dict, Any, Callable
import math

# === Настройка модели и цветов для классов ===
model_main = YOLO("models/best17.pt")
COLOR_MAP_MAIN = {
    "mouse":     (128,   0, 128),
    "hole_peek": (255, 165,   0),
    "rearing":   (  0, 255, 255),
    "grooming":  (255,   0, 255),
}
# модель для дефекаций (и, по желанию, ROI-классов)
model_def = YOLO("models/best18.pt")
COLOR_MAP_DEF = {
    "defecation": (0, 128, 0),
    # сюда же можно добавить класс "roi", если он есть в best18
}

DEFAULT_MASK_PATH  = "mask.png"
DEFAULT_ANNOT_PATH = "mask_annotations.json"

METRIC_MAP = {
    "Количество пересеченных линий за заданный промежуток времени": "line_count_time",
    "Количество пересечений горизонтальных линий":       "line_count_horizontal",
    "Количество заглядывай в отверстия":                  "hole_peek",
    "Количество стоек":                                   "rearing",
    "Время нахождения животного в центральном отсеке лабиринта": "centr_time",
    "Время нахождения животного в периферическом отсеке лабиринта":"perf_time",
    "Количество дефекаций":                               "defecation_count",
    "Количество груминга":                "grooming_count"
}

HOLE_EPSILON = 5.0
mouse_last_position = None
mouse_moved_threshold = 15

# пороговое расстояние до линии (можно подстроить под разрешение видео)
LINE_EPSILON = 5.0

#кулдаун для метрик grooming, rearing, hole_peek - может стоит также сохранять координаты предудщего такого случая
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
                ) -> tuple[int,int,int,int] | None:
    """
    Предсказывает на кадре боксы моделью model_def,
    фильтрует по классу 'roi', выбирает самый большой по площади.
    Возвращает (x, y, w, h) или None.
    """
    rd = model_def.predict(frame, conf=conf_thresh)[0]
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
    # выбираем по максимальной площади (можно заменить на max по "conf")
    best = max(candidates, key=lambda c: c["area"])
    return best["bbox"]

def load_annotations(path: str) -> Dict[str, Any]:
    with open(path, encoding='utf-8') as f:
        return json.load(f)

def preprocess_edges(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5,5), 0)
    edges = cv2.Canny(blur, 50, 150)
    return cv2.morphologyEx(edges, cv2.MORPH_CLOSE, np.ones((3,3), np.uint8))

def align_mask_to_roi(mask: np.ndarray, roi_img: np.ndarray) -> np.ndarray:
    me = preprocess_edges(mask)
    re = preprocess_edges(roi_img)
    h, w = re.shape
    me = cv2.resize(me, (w, h))
    warp = np.eye(2,3, dtype=np.float32)
    try:
        _, warp = cv2.findTransformECC(
            me, re, warp, cv2.MOTION_AFFINE,
            (cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT, 5000, 1e-6)
        )
    except cv2.error:
        pass
    return warp

def transform_annotations(elems: Dict[str, Any], M: np.ndarray) -> Dict[str, Any]:
    a, b, tx = M[0]; c, d, ty = M[1]
    sx = np.hypot(a, c); sy = np.hypot(b, d)
    scale = (sx + sy) / 2
    out = copy.deepcopy(elems)

    def _transform_circle(name):
        c0 = elems.get(name)
        if c0:
            x, y, r = c0["x"], c0["y"], c0["r"]
            X = a*x + b*y + tx
            Y = c*x + d*y + ty
            out[name] = {"x": float(X), "y": float(Y), "r": float(r*scale)}

    for name in ("periphery_circle","middle_circle","center_circle"):
        _transform_circle(name)

    holes = []
    for h0 in elems.get("holes", []):
        x, y, r = h0["x"], h0["y"], h0["r"]
        X = a*x + b*y + tx
        Y = c*x + d*y + ty
        holes.append({"x": float(X), "y": float(Y), "r": float(r*scale)})
    out["holes"] = holes

    for kind in ("horizontal","vertical"):
        lines = []
        for L in elems["lines"].get(kind, []):
            x1, y1, x2, y2 = L["x1"], L["y1"], L["x2"], L["y2"]
            X1 = a*x1 + b*y1 + tx; Y1 = c*x1 + d*y1 + ty
            X2 = a*x2 + b*y2 + tx; Y2 = c*x2 + d*y2 + ty
            lines.append({"x1": float(X1),"y1": float(Y1),
                          "x2": float(X2),"y2": float(Y2)})
        out["lines"][kind] = lines

    return out

# --- Заменяем старую функцию ---
def track_mouse_movement(ctx: Dict[str, Any], res, roi) -> bool:
    """
    Теперь возвращаем позицию мыши в координатах ROI:
    roi = (x_off, y_off, w_roi, h_roi).
    """
    global mouse_last_position
    x_off, y_off, _, _ = roi
    pos = None
    # res.boxes.xyxy — глобальные координаты боксов
    for i, cls in enumerate(res.boxes.cls):
        if model_main.names[int(cls)].lower() == "mouse":
            x1, y1, x2, y2 = map(float, res.boxes.xyxy[i])
            # центр бокса переводим в ROI-координаты
            cx = (x1 + x2) / 2 - x_off
            cy = (y1 + y2) / 2 - y_off
            pos = (cx, cy)
            break

    ctx["mouse_position"] = pos
    if pos is None:
        return False

    # дальше логика как была, только сравниваем ROI-координаты
    if mouse_last_position is None:
        mouse_last_position = pos
        return False

    moved = np.linalg.norm(np.array(pos) - np.array(mouse_last_position)) > mouse_moved_threshold
    if moved:
        mouse_last_position = pos
    return moved

# === Анализаторы (все с одинаковой сигнатурой) ===
def analyze_rearing(frame, res, ctx):
    """
    Считаем rearing, только если:
     - класс «rearing» найден,
     - прошло >= COULDOWN кадров с последнего rearing,
     - мышь сильно сместилась (>= SHIFT_THRESHOLD) с той позиции, где это считалось в прошлый раз.
    """
    pos = ctx.get("mouse_position")
    # наращиваем кулдаун (лишь до COULDOWN)
    cd = ctx.get("rearing_cooldown", COULDOWN)
    if cd < COULDOWN:
        ctx["rearing_cooldown"] = cd + 1

    # проверяем, есть ли «rearing» в текущем кадре
    found = any(model_main.names[int(cls)].lower() == "rearing" for cls in res.boxes.cls)
    if not found:
        return

    # достаточный кулдаун?
    if ctx["rearing_cooldown"] < COULDOWN:
        return

    # проверяем, что мышь есть и был большой сдвиг
    if pos is not None:
        last = ctx.get("last_rearing_pos")
        if last is None or math.hypot(pos[0] - last[0], pos[1] - last[1]) >= SHIFT_THRESHOLD:
            # считаем событие
            ctx["rearing"] = ctx.get("rearing", 0) + 1
            # сбрасываем кулдаун и обновляем позицию
            ctx["rearing_cooldown"] = 0
            ctx["last_rearing_pos"] = pos


def analyze_grooming_count(frame, res, ctx):
    """
    Аналогично для grooming:
     - найден «grooming»,
     - прошло >= COULDOWN кадров,
     - сдвиг >= SHIFT_THRESHOLD.
    """
    pos = ctx.get("mouse_position")
    # кулдаун
    cd = ctx.get("grooming_cooldown", COULDOWN)
    if cd < COULDOWN:
        ctx["grooming_cooldown"] = cd + 1

    # ищем «grooming»
    found = any(model_main.names[int(cls)].lower() == "grooming" for cls in res.boxes.cls)
    if not found:
        return

    if ctx["grooming_cooldown"] < COULDOWN:
        return

    if pos is not None:
        last = ctx.get("last_grooming_pos")
        if last is None or math.hypot(pos[0] - last[0], pos[1] - last[1]) >= SHIFT_THRESHOLD:
            ctx["grooming_count"] = ctx.get("grooming_count", 0) + 1
            ctx["grooming_cooldown"] = 0
            ctx["last_grooming_pos"] = pos


def analyze_hole_peek(frame, res, ctx):
    pos = ctx.get("mouse_position")
    if pos is None:
        ctx["prev_hole_peek"] = False
        return
    inside = any(
        (pos[0]-h["x"])**2 + (pos[1]-h["y"])**2 <= (h["r"]+HOLE_EPSILON)**2
        for h in ctx["holes_list"]
    )
    if inside and not ctx.get("prev_hole_peek", False):
        ctx["hole_peek"] = ctx.get("hole_peek", 0) + 1
        ctx["prev_hole_peek"] = True
    elif not inside:
        ctx["prev_hole_peek"] = False

def _analyze_line_crossing(ctx: Dict[str, Any],
                           lines: list,
                           prev_flag_key: str,
                           metric_key: str):
    """
    Общая функция: если мышь пересекает любую из линий `lines` и ранее
    не находилась на линии (prev_flag_key=False), то увеличиваем счётчик
    metric_key и ставим флаг prev_flag_key=True.
    Когда мышь уходит с любой линии (расстояние > LINE_EPSILON ко всем), 
    флаг prev_flag_key сбрасывается, и следующий заход снова посчитается.
    """
    pos = ctx.get("mouse_position")
    if pos is None:
        # мышь не обнаружена — сбросим флаг, чтобы следующий захват посчитался
        ctx[prev_flag_key] = False
        return

    x, y = pos
    crossed = False
    for L in lines:
        x1, y1, x2, y2 = L["x1"], L["y1"], L["x2"], L["y2"]
        # проекция точки на отрезок:
        vx, vy = x2 - x1, y2 - y1
        wx, wy = x - x1, y - y1
        norm2 = vx*vx + vy*vy
        if norm2 > 0:
            t = max(0.0, min(1.0, (wx*vx + wy*vy) / norm2))
            px, py = x1 + t*vx, y1 + t*vy
        else:
            px, py = x1, y1
        # расстояние от точки до отрезка
        if math.hypot(x - px, y - py) <= LINE_EPSILON:
            crossed = True
            break

    if crossed and not ctx.get(prev_flag_key, False):
        ctx[metric_key] = ctx.get(metric_key, 0) + 1
        ctx[prev_flag_key] = True
    elif not crossed:
        ctx[prev_flag_key] = False


def analyze_line_count_time(frame, res, ctx):
    """
    Считает пересечения всех линий, но только если
    текущее видео-время в диапазоне [startTime, endTime] для этой метрики.
    """
    # извлечём данные по метрике из active_metrics
    metric = ctx.get("active_metrics", {}).get("line_count_time")
    if metric is None:
        return

    # вычисляем текущее время видео (в секундах)
    frame_idx = ctx.get("frame_idx", 1)
    current_time = (frame_idx - 1) * ctx.get("dt", 0.0)

    # проверяем границы
    st = metric.get("startTime")
    if st is not None and current_time < float(st):
        return
    et = metric.get("endTime")
    if et is not None and current_time > float(et):
        return

    # если в диапазоне — считаем пересечение
    _analyze_line_crossing(
        ctx,
        ctx.get("line_list", []),
        prev_flag_key="prev_line_cross",
        metric_key="line_count_time"
    )

def analyze_line_count_horizontal(frame, res, ctx):
    # только для горизонтальных
    _analyze_line_crossing(
        ctx,
        ctx.get("horizontal_line_list", []),
        prev_flag_key="prev_horizontal_cross",
        metric_key="line_count_horizontal"
    )

def analyze_centr_time(frame, res, ctx):
    """
    Считаем время (в секундах), пока мышь внутри центрального круга.
    """
    pos = ctx.get("mouse_position")
    center = ctx.get("center_circle")
    if pos is None or center is None:
        return
    dx = pos[0] - center["x"]
    dy = pos[1] - center["y"]
    if dx*dx + dy*dy <= center["r"]**2:
        ctx["centr_time"] = ctx.get("centr_time", 0.0) + ctx["dt"]

def analyze_perf_time(frame, res, ctx):
    """
    Считаем время (в секундах), пока мышь между средним и внешним кругом.
    """
    pos = ctx.get("mouse_position")
    periphery = ctx.get("periphery_circle")
    middle    = ctx.get("middle_circle")
    if pos is None or periphery is None or middle is None:
        return
    dx_p = pos[0] - periphery["x"]
    dy_p = pos[1] - periphery["y"]
    dx_m = pos[0] - middle["x"]
    dy_m = pos[1] - middle["y"]
    inside_periphery = (dx_p*dx_p + dy_p*dy_p) <= periphery["r"]**2
    outside_middle   = (dx_m*dx_m + dy_m*dy_m) >= middle["r"]**2
    if inside_periphery and outside_middle:
        ctx["perf_time"] = ctx.get("perf_time", 0.0) + ctx["dt"]

def analyze_defecation_count(frame, res, ctx):
    """
    Для дефекаций используем отдельную модель model_def.
    Берём её предсказания, центр каждого бокса «defecation» и,
    если он дальше DEFECATION_EPSILON от всех ранее сохранённых,
    ++ctx['defecation_count'] и записываем эту позицию.
    """
    rd = model_def.predict(frame, conf=0.5)[0]
    positions = ctx.setdefault("defecation_positions", [])
    for i, cls in enumerate(rd.boxes.cls):
        if rd.names[int(cls)].lower() == "defecation":
            x1, y1, x2, y2 = map(float, rd.boxes.xyxy[i])
            cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
            # если новая точка далеко от всех старых
            if all(math.hypot(cx - px, cy - py) > DEFECATION_EPSILON
                   for px, py in positions):
                ctx["defecation_count"] = ctx.get("defecation_count", 0) + 1
                positions.append((cx, cy))
    # сохраняем обновлённый список позиций дефекаций
    ctx["defecation_positions"] = positions

METRIC_FUNCS: Dict[str, Callable] = {
    "rearing":                analyze_rearing,
    "grooming_count":         analyze_grooming_count,
    "hole_peek":              analyze_hole_peek,
    "line_count_time":        analyze_line_count_time,
    "line_count_horizontal":  analyze_line_count_horizontal,
    "centr_time":             analyze_centr_time,
    "perf_time":              analyze_perf_time,
    "defecation_count":       analyze_defecation_count
}

# === Функция отрисовки боксов по цветовой карте ===
def plot_boxes(image, boxes, result, names, color_map):
    """
    Рисует боксы из result.boxes на image, подписи класса и confidence,
    цвет берётся из color_map по имени класса.
    """
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

def draw_annotations(frame, elems, roi, mask_w, mask_h, ctx, frame_idx):
    x_off,y_off,w_roi,h_roi = roi
    out = frame.copy()
    cv2.rectangle(out, (x_off,y_off), (x_off+w_roi, y_off+h_roi), (200,200,200), 1)
    sx, sy = w_roi/mask_w, h_roi/mask_h

    def dc(c, clr, lab):
        x = int(c["x"]*sx)+x_off; y = int(c["y"]*sy)+y_off
        r = int(c["r"]*((sx+sy)/2))
        cv2.circle(out, (x,y), r, clr, 2)
        cv2.putText(out, lab, (x-r, y-r-5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, clr, 2)

    for name, clr, lab in [
        ("periphery_circle",(255,0,0),"Periphery"),
        ("middle_circle",  (0,165,255),"Middle"),
        ("center_circle",  (0,255,0),"Center")
    ]:
        if elems.get(name): dc(elems[name], clr, lab)

    for i,hole in enumerate(elems.get("holes", []), start=1):
        dc(hole, (0,255,255), f"Hole {i}")

    for kind, clr, tag in [("horizontal",(255,0,0),"H"),("vertical",(0,0,255),"V")]:
        for L in elems["lines"].get(kind, []):
            x1 = int(L["x1"]*sx)+x_off; y1 = int(L["y1"]*sy)+y_off
            x2 = int(L["x2"]*sx)+x_off; y2 = int(L["y2"]*sy)+y_off
            cv2.line(out, (x1,y1), (x2,y2), clr, 2)
            cv2.putText(out, tag, (x1, y1-5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, clr, 1)

    base_x = x_off + 10
    base_y = y_off + h_roi - 10
    time_sec = (frame_idx - 1) * ctx.get("dt", 0.0)
    cv2.putText(
        out,
        f"Frame {frame_idx} ({time_sec:.2f}s)",
        (base_x, base_y),
        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2
    )

    # список тех метрик, которые нужно показывать
    metrics_to_show = [
        "mouse_moved",
        "rearing",
        "grooming_count",
        "hole_peek",
        "line_count_time",
        "line_count_horizontal",
        "centr_time",
        "perf_time",
        "defecation_count"
    ]

    # перебираем только нужные и активные метрики
    line_offset = 1
    for name in metrics_to_show:
        if name in ctx:
            val = ctx[name]
            y = int(base_y - 30 * line_offset)
            cv2.putText(out, f"{name}: {val}", (base_x, y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)
            line_offset += 1

    return out

# def predict_on_roi(frame: np.ndarray, roi: tuple):
#     x_off, y_off, w_roi, h_roi = roi
#     roi_img = frame[y_off:y_off+h_roi, x_off:x_off+w_roi]
#     res = model_main.predict(roi_img, conf=0.5)[0]
#     # клонируем и отделяем от графа, чтобы можно было править
#     boxes = res.boxes.xyxy.clone().detach()
#     boxes[:, [0, 2]] += x_off
#     boxes[:, [1, 3]] += y_off
#     return res, boxes

def process_video_for_metrics(video_path: str,
                              active_metrics: Dict[str, Any]) -> Dict[str, Any]:
    mask   = cv2.imread(DEFAULT_MASK_PATH)
    mask_h, mask_w = mask.shape[:2]
    elems  = load_annotations(DEFAULT_ANNOT_PATH)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise IOError(f"Cannot open video: {video_path}")

    fps   = cap.get(cv2.CAP_PROP_FPS) or 30.0
    delay = max(1, int(1000.0 / fps))
    dt    = 1.0 / fps

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

    warp   = align_mask_to_roi(mask, first[y:y+h_roi, x:x+w_roi])
    elems2 = transform_annotations(elems, warp)
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

    # контекст с нужными полями
    ctx = {
        "dt":                  dt,  
        "active_metrics":      active_metrics,
        "holes_list":          elems2["holes"],
        "prev_hole_peek":      False,
        "line_list":           elems2["lines"]["horizontal"] + elems2["lines"]["vertical"],
        "horizontal_line_list": elems2["lines"]["horizontal"],
        "periphery_circle":    elems2.get("periphery_circle"),
        "middle_circle":       elems2.get("middle_circle"),
        "center_circle":       elems2.get("center_circle"),
        # кулдауны: не считать повторное событие, пока >0
        "rearing_cooldown":     COULDOWN,
        "grooming_cooldown":    COULDOWN,
        "last_rearing_pos":     None,
        "last_grooming_pos":    None,
        "defecation_positions": [],
    }

    base, ext = os.path.splitext(os.path.basename(video_path))
    out_fn     = f"{base}_result{ext}"
    out_path   = os.path.join(os.path.dirname(video_path), out_fn)
    fourcc     = cv2.VideoWriter_fourcc(*'H264')
    width      = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height     = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    writer     = cv2.VideoWriter(out_path, fourcc, fps, (width, height))

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
        res = model_main.predict(frame, conf=0.5)[0]
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

        writer.write(annotated)
        # cv2.imshow("Analysis", annotated)
        if cv2.waitKey(delay) & 0xFF == 27:
            break

        frame_idx += 1

    cap.release()
    writer.release()
    cv2.destroyAllWindows()

    # сохраняем результаты
    for k in active_metrics:
        if k in ctx:
            active_metrics[k]["value"] = round(ctx[k], 2)
    return active_metrics
