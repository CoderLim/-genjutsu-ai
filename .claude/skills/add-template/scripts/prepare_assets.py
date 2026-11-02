#!/usr/bin/env python3
"""Download a motion-template video, probe aspect, extract frames + poster.

Usage:
  python3 prepare_assets.py --name "Closing Door Prank" --url "<video-url>"
  python3 prepare_assets.py --slug closing-door-prank --url "<video-url>" --poster-ss 1.2

Writes under public/videos/:
  <slug>-tpl.mp4
  <slug>-tpl-poster.jpg

Also writes frame stills to /tmp/add-template-<slug>/f-XX.jpg for prompt analysis.
Prints a JSON summary on stdout.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path


def slugify(name: str) -> str:
    s = name.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    if not s:
        raise SystemExit("empty slug")
    return s


def title_key(slug: str) -> str:
    return "site.templates." + slug.replace("-", "_")


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, check=check, text=True, capture_output=True)


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; genjutsu-add-template/1.0)"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp, dest.open("wb") as out:
        while True:
            chunk = resp.read(1024 * 256)
            if not chunk:
                break
            out.write(chunk)


def probe(path: Path) -> dict:
    proc = run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height,codec_name,avg_frame_rate",
            "-show_entries",
            "format=duration,size",
            "-of",
            "json",
            str(path),
        ]
    )
    data = json.loads(proc.stdout)
    stream = (data.get("streams") or [{}])[0]
    fmt = data.get("format") or {}
    w = int(stream.get("width") or 0)
    h = int(stream.get("height") or 0)
    aspect = "portrait" if h > w else "landscape"
    return {
        "width": w,
        "height": h,
        "aspect": aspect,
        "duration": float(fmt.get("duration") or 0),
        "size": int(fmt.get("size") or path.stat().st_size),
        "codec": stream.get("codec_name"),
    }


def extract_frames(video: Path, out_dir: Path, fps: float = 1.0) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("f-*.jpg"):
        old.unlink()
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(video),
            "-vf",
            f"fps={fps}",
            "-q:v",
            "2",
            str(out_dir / "f-%02d.jpg"),
        ]
    )
    return sorted(out_dir.glob("f-*.jpg"))


def extract_poster(video: Path, poster: Path, ss: float) -> None:
    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            str(ss),
            "-i",
            str(video),
            "-frames:v",
            "1",
            "-update",
            "1",
            "-q:v",
            "2",
            str(poster),
        ]
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--name", help="Display name, e.g. Closing Door Prank")
    parser.add_argument("--slug", help="Override slug, e.g. closing-door-prank")
    parser.add_argument("--url", required=True, help="Direct video URL (mp4 preferred)")
    parser.add_argument(
        "--repo-root",
        default=None,
        help="Repo root (default: cwd). Expects public/videos/",
    )
    parser.add_argument(
        "--poster-ss",
        type=float,
        default=None,
        help="Poster timestamp seconds (default: min(1.2, duration/3))",
    )
    parser.add_argument(
        "--fps",
        type=float,
        default=1.0,
        help="Frames per second for analysis stills",
    )
    args = parser.parse_args()

    if not args.slug and not args.name:
        print("provide --name or --slug", file=sys.stderr)
        return 2

    slug = args.slug or slugify(args.name)
    root = Path(args.repo_root or Path.cwd()).resolve()
    videos = root / "public" / "videos"
    if not videos.is_dir():
        print(f"missing {videos}", file=sys.stderr)
        return 2

    mp4 = videos / f"{slug}-tpl.mp4"
    poster = videos / f"{slug}-tpl-poster.jpg"
    frames_dir = Path(f"/tmp/add-template-{slug}")

    try:
        download(args.url, mp4)
    except Exception as e:
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": f"download_failed: {e}",
                    "hint": "For Instagram reels, use opencli/browser capture then pass a local file via file:// or re-run with a direct mp4 URL.",
                    "slug": slug,
                }
            )
        )
        return 1

    info = probe(mp4)
    ss = args.poster_ss
    if ss is None:
        dur = info["duration"] or 3.0
        ss = min(1.2, max(0.3, dur / 3.0))

    frames = extract_frames(mp4, frames_dir, fps=args.fps)
    extract_poster(mp4, poster, ss=ss)

    out = {
        "ok": True,
        "slug": slug,
        "id": slug,
        "title": args.name or slug.replace("-", " ").title(),
        "titleKey": title_key(slug),
        "sourceVideo": f"/videos/{slug}-tpl.mp4",
        "poster": f"/videos/{slug}-tpl-poster.jpg",
        "mp4Path": str(mp4),
        "posterPath": str(poster),
        "posterSs": ss,
        "framesDir": str(frames_dir),
        "frames": [str(p) for p in frames],
        "probe": info,
        "mode": "objects-swap",
        "resolution": "480p",
        "aspect": info["aspect"],
    }
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
