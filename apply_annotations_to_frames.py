# apply_annotations_to_frames.py

import cv2
import json
import numpy as np
import argparse
import os
import copy

DEFAULT_VIDEO_PATH = "../../test_video/test_rat10.MOV"
DEFAULT_MASK_PATH  = "line_mask.png"
DEFAULT_ANNOT_PATH = "mask_annotations.json"

def load_annotations(json_path: str) -> dict:
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def preprocess_edges(img: np.ndarray) -> np.ndarray:
    gray    = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5,5), 0)
    edges   = cv2.Canny(blurred, 50, 150)
    kernel  = np.ones((3,3), np.uint8)
    closed  = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
    return closed

def align_mask_to_roi(mask: np.ndarray, roi_frame: np.ndarray) -> np.ndarray:
    """
    ECC-выравнивание маски по ROI-кадру.
    Если не сходится — возвращаем единичную матрицу.
    """
    mask_e  = preprocess_edges(mask)
    roi_e   = preprocess_edges(roi_frame)
    h, w    = roi_e.shape

    # приводим маску к размеру ROI
    mask_e = cv2.resize(mask_e, (w, h))

    warp_mode = cv2.MOTION_AFFINE
    warp_mat  = np.eye(2, 3, dtype=np.float32)
    criteria  = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 5000, 1e-6)

    try:
        _, warp_mat = cv2.findTransformECC(mask_e, roi_e, warp_mat, warp_mode, criteria)
    except cv2.error as e:
        print(f"[WARN] ECC не сошелся ({e}); используем единичную матрицу.")
        warp_mat = np.eye(2, 3, dtype=np.float32)

    return warp_mat

def transform_annotations(elements: dict, warp_mat: np.ndarray) -> dict:
    """
    Применяет warp_mat ко всем координатам аннотаций.
    Радиус масштабируется по среднему коэффициенту.
    """
    M = warp_mat
    a, b, tx = M[0]
    c, d, ty = M[1]
    sx = np.sqrt(a*a + c*c)
    sy = np.sqrt(b*b + d*d)
    scale = (sx + sy) / 2.0

    out = copy.deepcopy(elements)

    # Круги зон
    for name in ("periphery_circle", "middle_circle", "center_circle"):
        c0 = elements.get(name)
        if c0:
            x, y, r = c0["x"], c0["y"], c0["r"]
            x2 = a*x + b*y + tx
            y2 = c*x + d*y + ty
            out[name] = {"x": float(x2), "y": float(y2), "r": float(r * scale)}

    # Отверстия
    hol = []
    for h0 in elements.get("holes", []):
        x, y, r = h0["x"], h0["y"], h0["r"]
        x2 = a*x + b*y + tx
        y2 = c*x + d*y + ty
        hol.append({"x": float(x2), "y": float(y2), "r": float(r * scale)})
    out["holes"] = hol

    # Линии
    for kind in ("horizontal", "vertical"):
        transformed = []
        for L in elements.get("lines", {}).get(kind, []):
            x1, y1, x2, y2 = L["x1"], L["y1"], L["x2"], L["y2"]
            X1 = a*x1 + b*y1 + tx; Y1 = c*x1 + d*y1 + ty
            X2 = a*x2 + b*y2 + tx; Y2 = c*x2 + d*y2 + ty
            transformed.append({
                "x1": float(X1), "y1": float(Y1),
                "x2": float(X2), "y2": float(Y2)
            })
        out["lines"][kind] = transformed

    return out

def apply_annotations_to_frame(frame: np.ndarray, elements: dict,
                               mask_w: int, mask_h: int,
                               roi: tuple) -> np.ndarray:
    """
    Рисует аннотации на кадре в заданном ROI.
    """
    x_off, y_off, rw, rh = roi
    annotated = frame.copy()
    cv2.rectangle(annotated, (x_off, y_off), (x_off+rw, y_off+rh), (200,200,200), 1)

    sx = rw / mask_w
    sy = rh / mask_h

    def draw_circle(elem, color, label=None):
        x = int(elem['x'] * sx) + x_off
        y = int(elem['y'] * sy) + y_off
        r = int(elem['r'] * ((sx + sy) / 2))
        cv2.circle(annotated, (x, y), r, color, 2)
        if label:
            cv2.putText(annotated, label,
                        (x - r, y - r - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    # Зоны
    for name, col, lab in [
        ("periphery_circle", (255,0,0), "Periphery"),
        ("middle_circle",   (0,165,255), "Middle"),
        ("center_circle",   (0,255,0), "Center")
    ]:
        c = elements.get(name)
        if c: draw_circle(c, col, lab)

    # Отверстия
    for i, hole in enumerate(elements.get("holes", []), 1):
        draw_circle(hole, (0,255,255), f"Hole {i}")

    # Линии
    for kind, col, tag in [
        ("horizontal", (255,0,0), "H"),
        ("vertical",   (0,0,255), "V")
    ]:
        for L in elements["lines"].get(kind, []):
            x1 = int(L["x1"] * sx) + x_off; y1 = int(L["y1"] * sy) + y_off
            x2 = int(L["x2"] * sx) + x_off; y2 = int(L["y2"] * sy) + y_off
            cv2.line(annotated, (x1,y1), (x2,y2), col, 2)
            cv2.putText(annotated, tag, (x1, y1 - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, col, 1)

    return annotated

def main(video_path: str, mask_path: str, annot_path: str):
    # Проверка
    if not os.path.isfile(video_path): raise FileNotFoundError(f"Видео не найдено: {video_path}")
    if not os.path.isfile(mask_path):  raise FileNotFoundError(f"Маска не найдена: {mask_path}")
    if not os.path.isfile(annot_path):raise FileNotFoundError(f"Аннотации не найдены: {annot_path}")

    # Загрузка
    mask     = cv2.imread(mask_path)
    elements = load_annotations(annot_path)
    mask_h, mask_w = mask.shape[:2]

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened(): raise RuntimeError(f"Не удалось открыть видео: {video_path}")

    # 1) Первый кадр
    ret, first = cap.read()
    if not ret: raise RuntimeError("Не удалось прочитать первый кадр")

    # 2) Выбор ROI
    roi = cv2.selectROI("Select ROI", first, showCrosshair=True, fromCenter=False)
    cv2.destroyWindow("Select ROI")

    # 3) ECC-выравнивание маски по ROI
    x, y, w_roi, h_roi = roi
    roi_frame = first[y:y+h_roi, x:x+w_roi]
    warp_mat = align_mask_to_roi(mask, roi_frame)

    # 4) Преобразуем аннотации
    elements_aligned = transform_annotations(elements, warp_mat)

    # Вернуться к началу
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

    # 5) Проигрываем видео с аннотациями в ROI
    window = "Annotated Video"
    cv2.namedWindow(window, cv2.WINDOW_NORMAL)
    print("Нажми ESC, чтобы выйти из просмотра.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        out = apply_annotations_to_frame(frame, elements_aligned, mask_w, mask_h, roi)
        cv2.imshow(window, out)
        if cv2.waitKey(1) & 0xFF == 27:
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Наносит размеченную маску на видео — выбор ROI + частичное ECC"
    )
    parser.add_argument("-v","--video", default=DEFAULT_VIDEO_PATH,
        help=f"Видео (по умолчанию {DEFAULT_VIDEO_PATH})")
    parser.add_argument("-m","--mask",  default=DEFAULT_MASK_PATH,
        help=f"Маска (по умолчанию {DEFAULT_MASK_PATH})")
    parser.add_argument("-a","--annot", default=DEFAULT_ANNOT_PATH,
        help=f"Аннотации (по умолчанию {DEFAULT_ANNOT_PATH})")
    args = parser.parse_args()

    main(args.video, args.mask, args.annot)
