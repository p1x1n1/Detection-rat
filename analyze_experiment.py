import os
import cv2
import json
import copy
import numpy as np
import torch
from ultralytics import YOLO
from typing import Dict, Any, Callable

# === Загрузка модели YOLO и определение цветовой палитры ===
model = YOLO("models/best.pt")
# Палитра для классов: mouse, hole_peek, rearing, grooming
color_list = [
    (128, 0, 128),   # класс 0 (mouse) – пурпурный
    (255, 165, 0),   # класс 1 (hole_peek) – оранжевый
    (0, 255, 255),   # класс 2 (rearing) – циан
    (255, 0, 255)    # класс 3 (grooming) – маджента
]

# === Пути к маске и аннотациям ===
DEFAULT_MASK_PATH  = "mask.png"
DEFAULT_ANNOT_PATH = "mask_annotations.json"

# === Сопоставление русских названий метрик к ключам ===
METRIC_MAP = {
    "Количество пересеченных линий за заданный промежуток времени": "line_count_time",
    "Количество пересечений горизонтальных линий":       "line_count_horizontal",
    "Количество заглядывай в отверстия":                  "hole_peek",
    "Количество стоек":                                   "rearing",
    "Время нахождения животного в центральном отсеке лабиринта":    "centr_time",
    "Время нахождения животного в периферическом отсеке лабиринта":"perf_time",
    "Количество дефекаций":                               "sret_time",
    "Груминг (количество и выраженность)":                "grooming_count"
}

# === Отбор метрик из JSON эксперимента ===

def analyze_experiment(exp: Dict[str, Any]) -> Dict[str, Any]:
    active = {}
    for me in exp.get("metricExperiments", []):
        nm = me["metric"]["metricName"]
        if nm in METRIC_MAP:
            key = METRIC_MAP[nm]
            active[key] = {"metricId": me["metricId"], "value": 0, "comment": me.get("comment")}
    return active

def get_video_paths(exp: Dict[str, Any], base_path: str = "../lab-service/static/videos") -> list:
    paths = []
    for ve in exp.get("videoExperiments", []):
        fn = ve["video"]["filename"]
        p = os.path.join(base_path, os.path.basename(fn))
        if not os.path.isfile(p):
            raise FileNotFoundError(f"Video not found: {p}")
        paths.append(p)
    return paths

# === YOLO + отслеживание движения мыши для rearing/grooming ===

mouse_last_position = None
mouse_moved_threshold = 15

def track_mouse_movement(ctx: Dict[str, Any], res) -> bool:
    pos = None
    for i, cls in enumerate(res.boxes.cls):
        if model.names[int(cls)].lower() == "mouse":
            x1, y1, x2, y2 = res.boxes.xyxy[i]
            pos = ((x1 + x2)/2, (y1 + y2)/2)
            break
    ctx["mouse_position"] = pos
    if pos is None:
        return False
    global mouse_last_position
    if mouse_last_position is None:
        mouse_last_position = pos
        return False
    dist = np.linalg.norm(np.array(pos) - np.array(mouse_last_position))
    moved = dist > mouse_moved_threshold
    if moved:
        mouse_last_position = pos
    return moved

def analyze_rearing(frame, ctx):
    res = model.predict(frame, conf=0.5)[0]
    if track_mouse_movement(ctx, res):
        for cls in res.boxes.cls:
            if model.names[int(cls)].lower() == "rearing":
                ctx["rearing"] = ctx.get("rearing", 0) + 1
                break

def analyze_grooming_count(frame, ctx):
    res = model.predict(frame, conf=0.5)[0]
    if track_mouse_movement(ctx, res):
        for cls in res.boxes.cls:
            if model.names[int(cls)].lower() == "grooming":
                ctx["grooming_count"] = ctx.get("grooming_count", 0) + 1
                break

def analyze_line_count_time(frame, ctx):           pass
def analyze_line_count_horizontal(frame, ctx):    pass
def analyze_hole_peek(frame, ctx):                pass
def analyze_centr_time(frame, ctx):               pass
def analyze_perf_time(frame, ctx):                pass
def analyze_sret_time(frame, ctx):                pass

METRIC_FUNCS: Dict[str, Callable] = {
    "rearing": analyze_rearing,
    "grooming_count": analyze_grooming_count,
    "line_count_time": analyze_line_count_time,
    "line_count_horizontal": analyze_line_count_horizontal,
    "hole_peek": analyze_hole_peek,
    "centr_time": analyze_centr_time,
    "perf_time": analyze_perf_time,
    "sret_time": analyze_sret_time
}

# === Загрузка и выравнивание разметки (маска + ROI + ECC) ===

def load_annotations(path: str) -> Dict[str, Any]:
    return json.load(open(path, encoding='utf-8'))

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
    a,b,tx = M[0]; c,d,ty = M[1]
    sx = np.hypot(a, c); sy = np.hypot(b, d); scale = (sx + sy)/2
    out = copy.deepcopy(elems)
    for name in ("periphery_circle","middle_circle","center_circle"):
        c0 = elems.get(name)
        if c0:
            x,y,r = c0["x"], c0["y"], c0["r"]
            X = a*x + b*y + tx; Y = c*x + d*y + ty
            out[name] = {"x": float(X), "y": float(Y), "r": float(r*scale)}
    H=[]
    for h0 in elems.get("holes", []):
        x,y,r = h0["x"], h0["y"], h0["r"]
        X = a*x + b*y + tx; Y = c*x + d*y + ty
        H.append({"x": float(X), "y": float(Y), "r": float(r*scale)})
    out["holes"] = H
    for kind in ("horizontal","vertical"):
        L2=[]
        for L in elems["lines"].get(kind, []):
            x1,y1,x2,y2 = L["x1"], L["y1"], L["x2"], L["y2"]
            X1 = a*x1 + b*y1 + tx; Y1 = c*x1 + d*y1 + ty
            X2 = a*x2 + b*y2 + tx; Y2 = c*x2 + d*y2 + ty
            L2.append({"x1": float(X1),"y1": float(Y1),"x2": float(X2),"y2": float(Y2)})
        out["lines"][kind] = L2
    return out

# === Отрисовка боксов и меток YOLO ===

def plot_boxes_with_multiple_labels(image, boxes, class_probs, result, names):
    box_offset = 30
    for i, box in enumerate(boxes):
        x1,y1,x2,y2 = map(int, box)
        off = i * box_offset
        if class_probs is not None:
            probs = class_probs[i]
            top = torch.topk(probs, k=3)
            main = int(top.indices[0])
            color = color_list[main % len(color_list)]
            cv2.rectangle(image, (x1, y1+off), (x2, y2+off), color, 2)
            y_text = y1 - 5 + off
            for cls_idx, conf in zip(top.indices, top.values):
                nm = names[int(cls_idx)]
                txt = f"{nm}: {conf:.2f}"
                y_text -= 20
                cv2.putText(image, txt, (x1, y_text),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 1)
        else:
            cls_idx = int(result.boxes.cls[i])
            conf = float(result.boxes.conf[i])
            color = color_list[cls_idx % len(color_list)]
            cv2.rectangle(image, (x1, y1+off), (x2, y2+off), color, 2)
            txt = f"{names[cls_idx]}: {conf:.2f}"
            cv2.putText(image, txt, (x1, y1-10+off),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 1)
    return image

# === Отрисовка зон, линий и значений метрик на кадре ===

def draw_annotations(frame: np.ndarray,
                     elems: Dict[str, Any],
                     roi: tuple,
                     mask_w: int,
                     mask_h: int,
                     context: Dict[str, Any],
                     frame_idx: int) -> np.ndarray:

    x_off,y_off,w_roi,h_roi = roi
    out = frame.copy()
    cv2.rectangle(out, (x_off,y_off), (x_off+w_roi, y_off+h_roi), (200,200,200), 1)
    sx, sy = w_roi / mask_w, h_roi / mask_h

    def dc(c, clr, lab):
        x = int(c["x"]*sx) + x_off
        y = int(c["y"]*sy) + y_off
        r = int(c["r"]*((sx+sy)/2))
        cv2.circle(out, (x,y), r, clr, 2)
        cv2.putText(out, lab, (x-r, y-r-5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, clr, 2)

    for name,clr,lab in [
        ("periphery_circle",(255,0,0),"Periphery"),
        ("middle_circle",  (0,165,255),"Middle"),
        ("center_circle",  (0,255,0),"Center")
    ]:
        c0 = elems.get(name)
        if c0: dc(c0, clr, lab)

    for i,hole in enumerate(elems.get("holes", []),1):
        dc(hole, (0,255,255), f"Hole {i}")

    for kind,clr,tag in [("horizontal",(255,0,0),"H"),("vertical",(0,0,255),"V")]:
        for L in elems["lines"].get(kind, []):
            x1 = int(L["x1"]*sx)+x_off; y1 = int(L["y1"]*sy)+y_off
            x2 = int(L["x2"]*sx)+x_off; y2 = int(L["y2"]*sy)+y_off
            cv2.line(out, (x1,y1), (x2,y2), clr, 2)
            cv2.putText(out, tag, (x1, y1-5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, clr, 1)

    # вывод номера кадра и значений метрик
    base_x = x_off + 10
    base_y = y_off + h_roi - 10
    cv2.putText(out, f"Frame {frame_idx}", (base_x, base_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)
    for i, (m, val) in enumerate(context.items(), start=1):
        y = int(base_y - 30 * i)
        cv2.putText(out, f"{m}: {val}", (base_x, y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)

    return out

# === Основная обработка видео ===

def process_video_for_metrics(video_path: str,
                              active_metrics: Dict[str, Any]) -> Dict[str, Any]:

    # загружаем аннотацию
    mask = cv2.imread(DEFAULT_MASK_PATH)
    mask_h, mask_w = mask.shape[:2]
    elems = load_annotations(DEFAULT_ANNOT_PATH)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise IOError(f"Cannot open video: {video_path}")

    # получаем FPS и вычисляем задержку между кадрами (мс)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    delay = max(1, int(1000.0 / fps))

    # считаем первый кадр, выбираем ROI, ECC + трансформация
    ret, first = cap.read()
    if not ret:
        raise IOError("Empty video")
    roi = cv2.selectROI("Select ROI", first, showCrosshair=True, fromCenter=False)
    cv2.destroyWindow("Select ROI")
    x,y,w_roi,h_roi = roi
    warp = align_mask_to_roi(mask, first[y:y+h_roi, x:x+w_roi])
    elems2 = transform_annotations(elems, warp)
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

    cv2.namedWindow("Analysis", cv2.WINDOW_NORMAL)
    context: Dict[str, Any] = {}
    frame_idx = 1

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # подсчёт метрик
        for key in active_metrics:
            fn = METRIC_FUNCS.get(key)
            if fn:
                fn(frame, context)

        # YOLO inference + боксы
        res = model.predict(frame, conf=0.5)[0]
        boxes   = res.boxes.xyxy
        probs   = res.probs.data if res.probs is not None else None
        viz     = frame.copy()
        viz     = plot_boxes_with_multiple_labels(viz, boxes, probs, res, model.names)

        # комбинированная визуализация
        annotated = draw_annotations(viz, elems2, roi, mask_w, mask_h, context, frame_idx)
        cv2.imshow("Analysis", annotated)
        if cv2.waitKey(delay) & 0xFF == 27:
            break

        frame_idx += 1

    cap.release()
    cv2.destroyAllWindows()

    # записываем значения метрик
    for k in active_metrics:
        if k in context:
            active_metrics[k]["value"] = context[k]

    return active_metrics
