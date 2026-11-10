"""Measure each recorded kernel's length/breadth (L/B) ratio from its crop images.

Crops are the analyzer's own kernel images, padded to a square without
stretching, so the ratio of the kernel's minimum-area rectangle is a true L/B.
A view whose kernel touches the crop edge may be cut off and is not measured.
Adds "lb" (mean of the measured views, or null) to every kernel in
public/demos/grain/samples/*.json, in place.

Needs numpy and opencv-python. Usage: python scripts/measure_lb.py
"""
import base64
import json
from pathlib import Path

import cv2
import numpy as np

SAMPLES = Path(__file__).resolve().parent.parent / "public" / "demos" / "grain" / "samples"
EDGE_PX = 1


def view_lb(data_uri: str | None) -> float | None:
    """L/B of the largest blob in one crop, or None if absent or cut by the edge."""
    if data_uri is None:
        return None
    raw = np.frombuffer(base64.b64decode(data_uri.split(",", 1)[1]), np.uint8)
    gray = cv2.cvtColor(cv2.imdecode(raw, cv2.IMREAD_COLOR), cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not contours:
        return None
    blob = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(blob)
    rows, cols = mask.shape
    if x < EDGE_PX or y < EDGE_PX or x + w > cols - EDGE_PX or y + h > rows - EDGE_PX:
        return None
    side_a, side_b = cv2.minAreaRect(blob)[1]
    return max(side_a, side_b) / min(side_a, side_b) if min(side_a, side_b) > 0 else None


def main() -> None:
    for path in sorted(SAMPLES.glob("*.json")):
        sample = json.loads(path.read_text())
        measured = 0
        for k in sample["kernels"]:
            views = [r for r in (view_lb(k["up_url"]), view_lb(k["down_url"])) if r is not None]
            k["lb"] = round(sum(views) / len(views), 2) if views else None
            measured += k["lb"] is not None
        path.write_text(json.dumps(sample, separators=(",", ":")))
        print(f"{path.stem}: L/B measured on {measured}/{len(sample['kernels'])} kernels")


if __name__ == "__main__":
    main()
