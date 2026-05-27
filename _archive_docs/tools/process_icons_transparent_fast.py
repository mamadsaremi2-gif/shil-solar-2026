from pathlib import Path
from PIL import Image
import numpy as np
import cv2

ROOT = Path(__file__).resolve().parents[1]
ICON_DIRS = [ROOT/'public/assets/shil/icon/dashboard', ROOT/'public/assets/shil/icon/project']

def process(path: Path):
    im = Image.open(path).convert('RGBA')
    arr = np.array(im)
    rgb = arr[..., :3].astype(np.int16)
    alpha = arr[..., 3]
    mx = rgb.max(axis=2)
    mn = rgb.min(axis=2)
    sat = mx - mn
    avg = rgb.mean(axis=2)
    bg_candidate = (((mx >= 185) & (sat <= 75)) | ((avg >= 205) & (sat <= 100)) | (alpha < 10)).astype(np.uint8)
    h,w = bg_candidate.shape
    mask = np.zeros((h+2,w+2), np.uint8)
    flood = bg_candidate.copy()
    # flood from border candidates
    for x in range(w):
        if flood[0,x]: cv2.floodFill(flood, mask, (x,0), 2)
        if flood[h-1,x]: cv2.floodFill(flood, mask, (x,h-1), 2)
    for y in range(h):
        if flood[y,0]: cv2.floodFill(flood, mask, (0,y), 2)
        if flood[y,w-1]: cv2.floodFill(flood, mask, (w-1,y), 2)
    remove = flood == 2
    arr[...,3] = np.where(remove, 0, alpha)
    im = Image.fromarray(arr, 'RGBA')
    bbox = im.getbbox()
    if not bbox:
        return
    cropped = im.crop(bbox)
    cw,ch = cropped.size
    canvas_size = 512
    max_icon = 390
    scale = min(max_icon/cw, max_icon/ch)
    nw,nh = max(1,int(cw*scale)), max(1,int(ch*scale))
    cropped = cropped.resize((nw,nh), Image.Resampling.LANCZOS)
    out = Image.new('RGBA', (canvas_size, canvas_size), (0,0,0,0))
    out.alpha_composite(cropped, ((canvas_size-nw)//2, (canvas_size-nh)//2))
    out.save(path, optimize=True)
    print('processed', path.relative_to(ROOT), 'from', (w,h), 'to', out.size)

for d in ICON_DIRS:
    for p in sorted(d.glob('*.png')):
        try:
            process(p)
        except Exception as e:
            print('ERR', p, e)
