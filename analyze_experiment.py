import os
import cv2
import json
import copy
import numpy as np
import torch
from ultralytics import YOLO
from typing import Dict, Any, Callable

# === Настройка модели и цветов для классов ===
model = YOLO("models/best.pt")
color_list = [
    (128, 0, 128),   # mouse — пурпурный
    (255, 165, 0),   # hole_peek — оранжевый
    (0, 255, 255),   # rearing — циан
    (255, 0, 255)    # grooming — маджента
]

DEFAULT_MASK_PATH  = "mask.png"
DEFAULT_ANNOT_PATH = "mask_annotations.json"

METRIC_MAP = {
    "Количество пересеченных линий за заданный промежуток времени": "line_count_time",
    "Количество пересечений горизонтальных линий":       "line_count_horizontal",
    "Количество заглядывай в отверстия":                  "hole_peek",
    "Количество стоек":                                   "rearing",
    "Время нахождения животного в центральном отсеке лабиринта": "centr_time",
    "Время нахождения животного в периферическом отсеке лабиринта":"perf_time",
    "Количество дефекаций":                               "sret_time",
    "Груминг (количество и выраженность)":                "grooming_count"
}

HOLE_EPSILON = 5.0
mouse_last_position = None
mouse_moved_threshold = 15

def analyze_experiment(exp: Dict[str, Any]) -> Dict[str, Any]:
    active = {}
    for me in exp.get("metricExperiments", []):
        nm = me["metric"]["metricName"]
        if nm in METRIC_MAP:
            key = METRIC_MAP[nm]
            active[key] = {
                "metricId": me["metricId"],
                "value": 0,
                "comment": me.get("comment")
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

def track_mouse_movement(ctx: Dict[str, Any], res) -> bool:
    global mouse_last_position
    pos = None
    for i, cls in enumerate(res.boxes.cls):
        if model.names[int(cls)].lower() == "mouse":
            x1, y1, x2, y2 = map(float, res.boxes.xyxy[i])
            pos = ((x1 + x2)/2, (y1 + y2)/2)
            break
    ctx["mouse_position"] = pos
    if pos is None:
        return False
    if mouse_last_position is None:
        mouse_last_position = pos
        return False
    moved = np.linalg.norm(np.array(pos) - np.array(mouse_last_position)) > mouse_moved_threshold
    if moved:
        mouse_last_position = pos
    return moved

# === Анализаторы (все с одинаковой сигнатурой) ===

def analyze_rearing(frame, res, ctx):
    if ctx.get("mouse_moved", False):
        for cls in res.boxes.cls:
            if model.names[int(cls)].lower() == "rearing":
                ctx["rearing"] = ctx.get("rearing", 0) + 1
                break

def analyze_grooming_count(frame, res, ctx):
    if ctx.get("mouse_moved", False):
        for cls in res.boxes.cls:
            if model.names[int(cls)].lower() == "grooming":
                ctx["grooming_count"] = ctx.get("grooming_count", 0) + 1
                break

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

def analyze_line_count_time(frame, res, ctx):           pass
def analyze_line_count_horizontal(frame, res, ctx):    pass
def analyze_centr_time(frame, res, ctx):               pass
def analyze_perf_time(frame, res, ctx):                pass
def analyze_sret_time(frame, res, ctx):                pass

METRIC_FUNCS: Dict[str, Callable] = {
    "rearing":                analyze_rearing,
    "grooming_count":         analyze_grooming_count,
    "hole_peek":              analyze_hole_peek,
    "line_count_time":        analyze_line_count_time,
    "line_count_horizontal":  analyze_line_count_horizontal,
    "centr_time":             analyze_centr_time,
    "perf_time":              analyze_perf_time,
    "sret_time":              analyze_sret_time
}

def plot_boxes_with_multiple_labels(image, boxes, class_probs, result, names):
    box_offset = 30
    for i, box in enumerate(boxes):
        x1,y1,x2,y2 = map(int, box)
        off = i * box_offset
        if class_probs is not None:
            probs = class_probs[i]
            top = torch.topk(probs, k=3)
            main = int(top.indices[0])
            clr = color_list[main]
            cv2.rectangle(image, (x1, y1+off), (x2, y2+off), clr, 2)
            y_text = y1 - 5 + off
            for cls_idx, conf in zip(top.indices, top.values):
                nm = names[int(cls_idx)]
                txt = f"{nm}: {conf:.2f}"
                y_text -= 20
                cv2.putText(image, txt, (x1, y_text),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 1)
        else:
            cls_idx = int(result.boxes.cls[i])
            conf   = float(result.boxes.conf[i])
            clr     = color_list[cls_idx]
            cv2.rectangle(image, (x1, y1+off), (x2, y2+off), clr, 2)
            txt = f"{names[cls_idx]}: {conf:.2f}"
            cv2.putText(image, txt, (x1, y1-10+off),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 1)
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
    cv2.putText(out, f"Frame {frame_idx}", (base_x, base_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)
    for i, (m, val) in enumerate(ctx.items(), start=1):
        y = int(base_y - 30*i)
        cv2.putText(out, f"{m}: {val}", (base_x, y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)
    return out

def predict_on_roi(frame: np.ndarray, roi: tuple):
    x_off, y_off, w_roi, h_roi = roi
    roi_img = frame[y_off:y_off+h_roi, x_off:x_off+w_roi]
    res = model.predict(roi_img, conf=0.5)[0]
    # клонируем и отделяем от графа, чтобы можно было править
    boxes = res.boxes.xyxy.clone().detach()
    boxes[:, [0, 2]] += x_off
    boxes[:, [1, 3]] += y_off
    return res, boxes

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

    ret, first = cap.read()
    if not ret:
        raise IOError("Empty video")
    roi = cv2.selectROI("Select ROI", first, showCrosshair=True, fromCenter=False)
    cv2.destroyWindow("Select ROI")
    x, y, w_roi, h_roi = roi

    warp   = align_mask_to_roi(mask, first[y:y+h_roi, x:x+w_roi])
    elems2 = transform_annotations(elems, warp)
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

    # контекст с нужными полями
    ctx = {
        "holes_list":          elems2["holes"],
        "prev_hole_peek":      False,
        "line_list":           elems2["lines"]["horizontal"] + elems2["lines"]["vertical"],
        "horizontal_line_list": elems2["lines"]["horizontal"],
        "periphery_circle":    elems2.get("periphery_circle"),
        "middle_circle":       elems2.get("middle_circle"),
        "center_circle":       elems2.get("center_circle")
    }

    base, ext = os.path.splitext(os.path.basename(video_path))
    out_fn     = f"{base}_result{ext}"
    out_path   = os.path.join(os.path.dirname(video_path), out_fn)
    fourcc     = cv2.VideoWriter_fourcc(*'mp4v')
    width      = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height     = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    writer     = cv2.VideoWriter(out_path, fourcc, fps, (width, height))

    frame_idx = 1
    cv2.namedWindow("Analysis", cv2.WINDOW_NORMAL)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # 1) один вызов — предсказание и сразу готовые global-коробки
        res, boxes = predict_on_roi(frame, roi)

        # 2) трекинг мыши (он смотрит в res.boxes.xyxy — это ROI-координаты, ок)
        moved = track_mouse_movement(ctx, res)
        ctx["mouse_moved"] = moved

        # 3) подсчет активных метрик
        for key in active_metrics:
            fn = METRIC_FUNCS.get(key)
            if fn:
                fn(frame, res, ctx)

        # 4) отрисовка: передаем в plot_boxes уже наш локальный tensor `boxes`
        viz = plot_boxes_with_multiple_labels(
            frame.copy(),
            boxes,
            res.probs.data if res.probs is not None else None,
            res,
            model.names
        )
        annotated = draw_annotations(viz, elems2, roi, mask_w, mask_h, ctx, frame_idx)

        writer.write(annotated)
        cv2.imshow("Analysis", annotated)
        if cv2.waitKey(delay) & 0xFF == 27:
            break

        frame_idx += 1

    cap.release()
    writer.release()
    cv2.destroyAllWindows()

    # сохраняем результаты
    for k in active_metrics:
        if k in ctx:
            active_metrics[k]["value"] = ctx[k]
    return active_metrics
