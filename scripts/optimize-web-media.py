"""Create lightweight WebP derivatives for the fictional demo images.

This script only writes sibling .webp files under public/demo-afterglow.
It never edits or deletes source PNGs and never reads private-instance folders.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "instances" / "demo-afterglow" / "public" / "demo-afterglow"
MAX_EDGE = 1920


def optimize(source: Path) -> dict[str, object]:
    target = source.with_suffix(".webp")
    before = source.stat().st_size
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
        image.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
        image.save(target, "WEBP", quality=84, method=6)
        dimensions = [image.width, image.height]
    return {
        "source": source.relative_to(ROOT).as_posix(),
        "target": target.relative_to(ROOT).as_posix(),
        "before": before,
        "after": target.stat().st_size,
        "dimensions": dimensions,
    }


def main() -> None:
    if not ASSET_DIR.is_dir():
        raise FileNotFoundError(f"Missing fictional asset directory: {ASSET_DIR}")
    sources = sorted(ASSET_DIR.glob("*.png"))
    if not sources:
        print("No PNG demo sources found; existing WebP assets are already optimized.")
        return
    results = [optimize(source) for source in sources]
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
