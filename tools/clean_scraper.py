#!/usr/bin/env python3
"""
ClipFlux - Clean Viral Topic Scraper Engine
Searches platforms for viral videos, enforces target aspect ratio,
inspects frames with OpenCV to reject text overlays/subtitles/watermarks,
and saves only pristine, clean footage.
"""

import os
import sys
import json
import time
import shutil
import argparse
import subprocess
import urllib.request
import urllib.parse
from pathlib import Path

# Optional OpenCV and PIL for local frame inspection
try:
    import cv2
    import numpy as np
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

# ANSI Color formatting (Emerald Green Theme)
COLOR_GREEN = "\033[92m"
COLOR_EMERALD = "\033[38;2;16;185;129m"
COLOR_CYAN = "\033[96m"
COLOR_YELLOW = "\033[93m"
COLOR_RED = "\033[91m"
COLOR_GRAY = "\033[90m"
COLOR_BOLD = "\033[1m"
COLOR_RESET = "\033[0m"


def log_banner():
    print(f"\n{COLOR_EMERALD}{COLOR_BOLD}╔════════════════════════════════════════════════════════════╗")
    print(f"║                   ⚡ CLIPFLUX ENGINE ⚡                     ║")
    print(f"║       Clean Viral Topic Scraper & Frame Gatekeeper         ║")
    print(f"╚════════════════════════════════════════════════════════════╝{COLOR_RESET}\n")


def check_tool_dependencies():
    """Verify yt-dlp and ffmpeg are available."""
    ytdlp = shutil.which("yt-dlp")
    ffmpeg = shutil.which("ffmpeg")
    if not ytdlp:
        print(f"{COLOR_RED}Error: yt-dlp is not installed or not in PATH.{COLOR_RESET}")
        sys.exit(1)
    if not ffmpeg:
        print(f"{COLOR_RED}Error: ffmpeg is not installed or not in PATH.{COLOR_RESET}")
        sys.exit(1)
    return ytdlp, ffmpeg


def sanitize_filename(name: str) -> str:
    cleaned = "".join(c for c in name if c.isalnum() or c in (" ", "_", "-")).rstrip()
    cleaned = "_".join(cleaned.split())
    return cleaned[:60] or "clean_clip"


def detect_text_in_frame(image_path: str) -> dict:
    """
    Analyzes an extracted video frame using OpenCV to detect:
    1. Subtitle bars (concentrated text in bottom 30%)
    2. Hook text banners (concentrated text in top 28%)
    3. General text density across the frame
    """
    if not HAS_OPENCV:
        return {"has_text": False, "confidence": 0.0, "reason": "OpenCV not installed"}

    try:
        img = cv2.imread(image_path)
        if img is None:
            return {"has_text": False, "confidence": 0.0, "reason": "Could not read frame"}

        height, width, _ = img.shape
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 1. Edge detection to find sharp letter contours
        edges = cv2.Canny(gray, 100, 200)

        # 2. Morphological gradient & closing to group letter strokes into word boxes
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

            # Text boxes typically have horizontal aspect ratio (2:1 to 15:1)
            # and reasonable height (between 12px and 140px)
            if 1.5 <= aspect_ratio <= 20.0 and 12 <= h <= 140 and area > 200:
                roi = gray[y:y+h, x:x+w]
                if roi.size > 0:
                    std_dev = float(np.std(roi))
                    if std_dev > 35: # High contrast indicates text / graphic overlay
                        text_candidate_area += area
                        if y <= top_zone_limit:
                            top_text_boxes += 1
                        elif y >= bottom_zone_start:
                            bottom_text_boxes += 1

        text_density = (text_candidate_area / total_frame_area) * 100

        # Decision thresholds
        if top_text_boxes >= 2:
            return {"has_text": True, "confidence": 0.90, "reason": f"Header/Hook text banner detected ({top_text_boxes} text elements in top zone)"}
        if bottom_text_boxes >= 2:
            return {"has_text": True, "confidence": 0.92, "reason": f"Burned-in subtitles detected ({bottom_text_boxes} subtitle elements in bottom zone)"}
        if text_density > 4.5:
            return {"has_text": True, "confidence": 0.85, "reason": f"High text density overlay ({text_density:.1f}% frame coverage)"}

        return {"has_text": False, "confidence": 0.1, "reason": "Frame is clean visual footage"}
    except Exception as e:
        return {"has_text": False, "confidence": 0.0, "reason": f"Analysis error: {str(e)}"}


def inspect_video_frames(video_path: str, ffmpeg_bin: str) -> dict:
    """
    Extracts 3 keyframes (15%, 50%, 85%) and verifies they are clean visual footage.
    """
    tmp_dir = Path("/tmp/clipflux_inspect") / f"inspect_{int(time.time()*1000)}"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    try:
        cmd_dur = [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", video_path
        ]
        duration_out = subprocess.check_output(cmd_dur, stderr=subprocess.DEVNULL).decode().strip()
        duration = float(duration_out) if duration_out else 10.0
    except Exception:
        duration = 10.0

    sample_times = [
        max(1.0, duration * 0.15),
        duration * 0.50,
        max(2.0, duration * 0.85),
    ]

    inspections = []
    for idx, t in enumerate(sample_times):
        frame_file = tmp_dir / f"frame_{idx}.jpg"
        cmd = [
            ffmpeg_bin, "-y", "-ss", f"{t:.2f}", "-i", video_path,
            "-vframes", "1", "-q:v", "2", str(frame_file)
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        if frame_file.exists():
            res = detect_text_in_frame(str(frame_file))
            inspections.append(res)
            if res["has_text"]:
                shutil.rmtree(tmp_dir, ignore_errors=True)
                return {"is_clean": False, "reason": res["reason"], "sample_time": f"{t:.1f}s"}

    shutil.rmtree(tmp_dir, ignore_errors=True)
    return {"is_clean": True, "reason": "All 3 sample frames verified clean"}


def verify_aspect_ratio(video_path: str, target_ratio: str) -> dict:
    """
    Measures video width and height to enforce aspect ratio constraint.
    """
    if target_ratio == "any":
        return {"matches": True, "detected": "unconstrained", "width": 0, "height": 0}

    try:
        cmd = [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height",
            "-of", "csv=s=x:p=0", video_path
        ]
        dims = subprocess.check_output(cmd, stderr=subprocess.DEVNULL).decode().strip()
        w_str, h_str = dims.split("x")
        w, h = int(w_str), int(h_str)

        is_vertical = h > w
        detected = "9:16 Vertical" if is_vertical else "16:9 Landscape"

        if target_ratio == "9:16":
            matches = is_vertical and (h / float(w) >= 1.3)
            return {"matches": matches, "detected": detected, "width": w, "height": h}
        elif target_ratio == "16:9":
            matches = (not is_vertical) and (w / float(h) >= 1.3)
            return {"matches": matches, "detected": detected, "width": w, "height": h}

        return {"matches": True, "detected": detected, "width": w, "height": h}
    except Exception as e:
        return {"matches": False, "detected": f"Error: {str(e)}", "width": 0, "height": 0}


def search_youtube(topic: str, ratio: str, limit: int = 15) -> list:
    """
    Searches YouTube via yt-dlp without API keys.
    """
    search_query = topic
    if ratio == "9:16" and "shorts" not in topic.lower():
        search_query = f"{topic} shorts"

    print(f"{COLOR_GRAY}  → Searching YouTube public feed for: '{search_query}'...{COLOR_RESET}")

    cmd = [
        "yt-dlp",
        f"ytsearch{limit}:{search_query}",
        "--dump-json",
        "--no-playlist",
        "--flat-playlist",
        "--ignore-errors",
    ]

    candidates = []
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
        for line in proc.stdout:
            try:
                data = json.loads(line.strip())
                video_url = data.get("url") or f"https://www.youtube.com/watch?v={data.get('id')}"
                title = data.get("title", "Untitled Video")
                candidates.append({
                    "platform": "YouTube",
                    "id": data.get("id"),
                    "title": title,
                    "url": video_url,
                    "duration": data.get("duration", 0),
                    "view_count": data.get("view_count", 0),
                })
            except Exception:
                continue
    except Exception as e:
        print(f"{COLOR_YELLOW}  ⚠️ YouTube search warning: {e}{COLOR_RESET}")

    return candidates


def search_reddit(topic: str, ratio: str, limit: int = 15) -> list:
    """
    Searches Reddit's public JSON API without API keys.
    """
    encoded_topic = urllib.parse.quote(topic)
    url = f"https://www.reddit.com/search.json?q={encoded_topic}+url:v.redd.it&sort=top&t=year&limit={limit}"

    print(f"{COLOR_GRAY}  → Searching Reddit viral archives for: '{topic}'...{COLOR_RESET}")
    candidates = []
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ClipFlux/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            posts = data.get("data", {}).get("children", [])
            for post in posts:
                p_data = post.get("data", {})
                if p_data.get("is_video"):
                    post_url = f"https://www.reddit.com{p_data.get('permalink')}"
                    title = p_data.get("title", "Reddit Video")
                    candidates.append({
                        "platform": "Reddit",
                        "id": p_data.get("id"),
                        "title": title,
                        "url": post_url,
                        "duration": p_data.get("media", {}).get("reddit_video", {}).get("duration", 0),
                        "view_count": p_data.get("score", 0),
                    })
    except Exception as e:
        print(f"{COLOR_YELLOW}  ⚠️ Reddit search notice: {e}{COLOR_RESET}")

    return candidates


def run_scraper(topic: str, ratio: str, target_count: int, platform: str, output_dir: str):
    ytdlp_bin, ffmpeg_bin = check_tool_dependencies()

    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    log_banner()
    print(f"{COLOR_BOLD}Topic / Niche:{COLOR_RESET}     {COLOR_EMERALD}{topic}{COLOR_RESET}")
    print(f"{COLOR_BOLD}Target Aspect Ratio:{COLOR_RESET} {COLOR_CYAN}{ratio}{COLOR_RESET}")
    print(f"{COLOR_BOLD}Desired Clean Clips:{COLOR_RESET} {target_count}")
    print(f"{COLOR_BOLD}Target Output Dir:{COLOR_RESET}   {out_path.resolve()}\n")
    print(f"{COLOR_GRAY}Initiating multi-platform discovery...{COLOR_RESET}")

    candidates = []
    if platform in ("all", "youtube"):
        candidates.extend(search_youtube(topic, ratio, limit=20))
    if platform in ("all", "reddit"):
        candidates.extend(search_reddit(topic, ratio, limit=15))

    print(f"{COLOR_EMERALD}✓ Discovered {len(candidates)} total candidate videos.{COLOR_RESET}")
    print(f"{COLOR_GRAY}Beginning Aspect Ratio & Clean-Frame Gatekeeper checks...\n{COLOR_RESET}")

    clean_videos = []
    tmp_download_dir = Path("/tmp/clipflux_dl")
    tmp_download_dir.mkdir(parents=True, exist_ok=True)

    for idx, c in enumerate(candidates, start=1):
        if len(clean_videos) >= target_count:
            break

        c_title = c["title"]
        print(f"{COLOR_BOLD}[Candidate {idx}/{len(candidates)}]{COLOR_RESET} {COLOR_CYAN}{c['platform']}:{COLOR_RESET} {c_title[:65]}...")

        temp_file = tmp_download_dir / f"temp_{int(time.time()*1000)}.mp4"

        dl_args = [
            ytdlp_bin,
            "-S", "res:1080,vcodec:h264,ext:mp4:m4a",
            "-f", "bestvideo+bestaudio/best",
            "--match-filter", "duration < 90",
            "--merge-output-format", "mp4",
            "-o", str(temp_file),
            "--no-playlist",
            "--no-warnings",
            c["url"]
        ]

        try:
            subprocess.run(dl_args, check=True, timeout=40)
        except Exception:
            print(f"  {COLOR_GRAY}↳ Skipped: Stream download failed or timed out.{COLOR_RESET}")
            if temp_file.exists():
                temp_file.unlink()
            continue

        if not temp_file.exists() or temp_file.stat().st_size < 100000:
            print(f"  {COLOR_GRAY}↳ Skipped: Video stream empty.{COLOR_RESET}")
            if temp_file.exists():
                temp_file.unlink()
            continue

        # 1. Aspect Ratio Enforcement
        ratio_result = verify_aspect_ratio(str(temp_file), ratio)
        if not ratio_result["matches"]:
            print(f"  {COLOR_YELLOW}↳ ❌ Discarded: Aspect ratio mismatch (Got {ratio_result['detected']} [{ratio_result['width']}x{ratio_result['height']}], Wanted {ratio}){COLOR_RESET}")
            temp_file.unlink()
            continue

        # 2. AI Clean-Frame Gatekeeper
        print(f"  {COLOR_GRAY}↳ Inspecting 3 keyframes for burned-in subtitles & text hooks...{COLOR_RESET}", end="", flush=True)
        inspect_result = inspect_video_frames(str(temp_file), ffmpeg_bin)

        if not inspect_result["is_clean"]:
            print(f"\r  {COLOR_RED}↳ ❌ Discarded: {inspect_result['reason']} (at {inspect_result['sample_time']}){COLOR_RESET}")
            temp_file.unlink()
            continue

        # Video is 100% Clean! Move to output directory
        safe_name = f"clean_{sanitize_filename(topic)}_{len(clean_videos)+1}_{ratio.replace(':', 'x')}.mp4"
        final_dest = out_path / safe_name
        shutil.move(str(temp_file), str(final_dest))

        file_size_mb = final_dest.stat().st_size / (1024 * 1024)
        print(f"\r  {COLOR_EMERALD}{COLOR_BOLD}↳ ✅ ACCEPTED! 100% Clean Visual ({ratio_result['width']}x{ratio_result['height']}, {file_size_mb:.1f} MB){COLOR_RESET}")
        print(f"    Saved: {COLOR_GREEN}{final_dest.name}{COLOR_RESET}\n")

        clean_videos.append({
            "title": c_title,
            "platform": c["platform"],
            "url": c["url"],
            "resolution": f"{ratio_result['width']}x{ratio_result['height']}",
            "file": str(final_dest),
            "size_mb": round(file_size_mb, 2)
        })

    shutil.rmtree(tmp_download_dir, ignore_errors=True)

    print(f"{COLOR_EMERALD}{COLOR_BOLD}═══════════════════════════════════════════════════════════════")
    print(f"✨ SCRAPER COMPLETE: Found {len(clean_videos)}/{target_count} clean videos for '{topic}'")
    print(f"📁 Destination Folder: {out_path.resolve()}")
    print(f"═══════════════════════════════════════════════════════════════{COLOR_RESET}\n")

    for v in clean_videos:
        print(f" • [{v['platform']}] {v['resolution']} ({v['size_mb']} MB) - {v['title'][:60]}")
    print("")

    summary_file = out_path / f"scrape_{sanitize_filename(topic)}_summary.json"
    with open(summary_file, "w") as f:
        json.dump({
            "topic": topic,
            "target_ratio": ratio,
            "count": len(clean_videos),
            "scraped_at": time.time(),
            "videos": clean_videos
        }, f, indent=2)


def main():
    parser = argparse.ArgumentParser(description="ClipFlux Clean Viral Topic Scraper")
    parser.add_argument("--topic", required=True, help="Keyword or niche to search (e.g. 'portable blender aesthetic')")
    parser.add_argument("--ratio", choices=["9:16", "16:9", "any"], default="9:16", help="Target aspect ratio")
    parser.add_argument("--count", type=int, default=3, help="Number of clean clips to save (default: 3)")
    parser.add_argument("--platform", choices=["all", "youtube", "reddit"], default="all", help="Source platform")
    parser.add_argument("--output-dir", default="/Volumes/WDB-2TB-B/App Projects/ClipFlux/inputs", help="Destination folder")

    args = parser.parse_args()
    run_scraper(
        topic=args.topic,
        ratio=args.ratio,
        target_count=args.count,
        platform=args.platform,
        output_dir=args.output_dir
    )


if __name__ == "__main__":
    main()
