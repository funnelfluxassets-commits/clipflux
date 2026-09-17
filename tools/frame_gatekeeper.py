#!/usr/bin/env python3
"""
ClipFlux - Zero-API Local Frame Gatekeeper
Uses local OpenCV (Canny edge detection + morphology + contrast analysis)
and local Tesseract OCR (if available) to detect text overlays, burned-in
subtitles, rankings, and banners in video frames and thumbnails.
Zero external APIs, 100% offline.
"""

import sys
import json
import shutil
import subprocess
from pathlib import Path

try:
    import cv2
    import numpy as np
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

TESSERACT_BIN = shutil.which("tesseract") or ("/opt/homebrew/bin/tesseract" if Path("/opt/homebrew/bin/tesseract").exists() else None)


def check_ocr_text(image_path: str) -> dict:
    """Quick OCR scan to check if readable text words exist in the frame."""
    if not TESSERACT_BIN:
        return {"has_text": False, "text": ""}
    try:
        cmd = [TESSERACT_BIN, image_path, "stdout", "--oem", "1", "-l", "eng", "--psm", "11"]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, timeout=3)
        raw_text = res.stdout.strip()
        # Filter out noise characters and keep genuine words
        words = [w for w in raw_text.split() if len(w) >= 2 and any(c.isalnum() for c in w)]
        # Ignore common UI elements from screenshot apps if any, check for substantial text
        filtered_words = [w for w in words if w.lower() not in ("clean", "visual", "download", "mp4", "reddit", "youtube")]
        if len(filtered_words) >= 2:
            return {"has_text": True, "text": " ".join(filtered_words[:6])}
        return {"has_text": False, "text": ""}
    except Exception:
        return {"has_text": False, "text": ""}


def detect_text_in_frame(image_path: str) -> dict:
    # 1. First check via quick local OCR if available
    ocr_result = check_ocr_text(image_path)
    if ocr_result["has_text"]:
        return {
            "has_text": True,
            "confidence": 0.98,
            "reason": f"Text detected in visual frame (words: \"{ocr_result['text']}\")",
            "method": "ocr"
        }

    # 2. OpenCV edge, contour and zone inspection
    if not HAS_OPENCV:
        return {"has_text": False, "confidence": 0.0, "reason": "OpenCV not installed", "method": "none"}

    try:
        img = cv2.imread(image_path)
        if img is None:
            return {"has_text": False, "confidence": 0.0, "reason": "Could not read image", "method": "none"}

        height, width, _ = img.shape
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Edge detection for sharp letter contours
        edges = cv2.Canny(gray, 100, 200)

        # Morphological closing to group letter strokes into word boxes
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 3))
        dilated = cv2.dilate(edges, kernel, iterations=1)
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        total_frame_area = height * width
        top_zone_limit = int(height * 0.28)    # Top 28% (Hook banners)
        bottom_zone_start = int(height * 0.68) # Bottom 32% (Subtitles & captions)

        top_text_boxes = 0
        bottom_text_boxes = 0
        text_candidate_area = 0

        for c in contours:
            x, y, w, h = cv2.boundingRect(c)
            aspect_ratio = w / float(h)
            area = w * h

            if 1.5 <= aspect_ratio <= 20.0 and 12 <= h <= 140 and area > 200:
                roi = gray[y:y+h, x:x+w]
                if roi.size > 0:
                    std_dev = float(np.std(roi))
                    if std_dev > 35:
                        text_candidate_area += area
                        if y <= top_zone_limit:
                            top_text_boxes += 1
                        elif y >= bottom_zone_start:
                            bottom_text_boxes += 1

        text_density = (text_candidate_area / total_frame_area) * 100

        # Calibrated rejection thresholds
        if top_text_boxes >= 2:
            return {
                "has_text": True,
                "confidence": 0.90,
                "reason": f"Header/Hook text banner detected ({top_text_boxes} elements in top zone)",
                "method": "opencv_top"
            }
        if bottom_text_boxes >= 2:
            return {
                "has_text": True,
                "confidence": 0.92,
                "reason": f"Burned-in subtitles detected ({bottom_text_boxes} elements in bottom zone)",
                "method": "opencv_bottom"
            }
        if text_density > 4.8:
            return {
                "has_text": True,
                "confidence": 0.85,
                "reason": f"High text density overlay ({text_density:.1f}% frame coverage)",
                "method": "opencv_density"
            }

        return {
            "has_text": False,
            "confidence": 0.10,
            "reason": "Frame is clean visual footage",
            "method": "verified"
        }
    except Exception as e:
        return {"has_text": False, "confidence": 0.0, "reason": f"Analysis error: {str(e)}", "method": "error"}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"has_text": False, "reason": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]
    res = detect_text_in_frame(image_path)
    print(json.dumps(res))


if __name__ == "__main__":
    main()
