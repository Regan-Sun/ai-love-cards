#!/usr/bin/env python3
"""
把 assets/*.png 转成 WebP 多尺寸，供网页按需加载。

产物:
  assets/webp/thumb/<name>.webp   宽 360  ——网格缩略图 / 列表
  assets/webp/large/<name>.webp   宽 1080 ——查看器主卡 / 阶段说明

原 PNG 保留不动，作为 <picture> 的兜底源。
用法: python3 tools/build_webp.py [质量]
"""
import os
import sys
import glob
from concurrent.futures import ProcessPoolExecutor

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets")
OUT = os.path.join(ROOT, "assets", "webp")

# 缩略图尺寸按网格实际显示宽度(桌面三列约 300px)取 2倍余量
THUMB_W = 360
LARGE_W = 1080

# 阶段说明图是宽幅信息图，需要更大的主图
GUIDE_W = 1400


def sizes_for(name: str):
    if "阶段说明" in name:
        return [(THUMB_W, "thumb"), (GUIDE_W, "large")]
    return [(THUMB_W, "thumb"), (LARGE_W, "large")]


def convert(job):
    src_path, name, quality = job
    dst_dir = os.path.join(OUT, name[1])
    os.makedirs(dst_dir, exist_ok=True)
    dst_path = os.path.join(dst_dir, name[0] + ".webp")
    if os.path.exists(dst_path):
        return name[0], os.path.getsize(dst_path), "skip"
    with Image.open(src_path) as im:
        im = im.convert("RGB")
        w, h = im.size
        if w > name[2]:
            nh = round(h * name[2] / w)
            im = im.resize((name[2], nh), Image.LANCZOS)
        im.save(dst_path, "WEBP", quality=quality, method=6)
    return name[0], os.path.getsize(dst_path), "ok"


def main():
    quality = int(sys.argv[1]) if len(sys.argv) > 1 else 82
    files = sorted(glob.glob(os.path.join(SRC, "*.png")))
    jobs = []
    for f in files:
        base = os.path.splitext(os.path.basename(f))[0]
        for w, folder in sizes_for(base):
            jobs.append((f, (base, folder, w), quality))

    print(f"共 {len(files)} 张 PNG，生成 {len(jobs)} 个 WebP（q={quality}）")
    total = 0
    with ProcessPoolExecutor() as ex:
        for i, (_, size, status) in enumerate(ex.map(convert, jobs), 1):
            total += size
            if i % 40 == 0:
                print(f"  {i}/{len(jobs)}")
    print(f"WebP 总体积: {total/1024/1024:.2f} MB")


if __name__ == "__main__":
    main()