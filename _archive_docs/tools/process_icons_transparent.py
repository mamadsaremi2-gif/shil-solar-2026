from pathlib import Path
from PIL import Image
from collections import deque

ROOT = Path(__file__).resolve().parents[1]
ICON_DIRS = [ROOT/'public/assets/shil/icon/dashboard', ROOT/'public/assets/shil/icon/project']

def is_bg(r,g,b,a):
    if a < 10:
        return True
    mx=max(r,g,b); mn=min(r,g,b)
    sat=mx-mn
    # white / off-white / grey checkerboard backgrounds
    if mx >= 185 and sat <= 70:
        return True
    # very light bluish/grey edge background
    if (r+g+b)/3 >= 205 and sat <= 95:
        return True
    return False

def process(path: Path):
    im = Image.open(path).convert('RGBA')
    w,h = im.size
    pix = im.load()
    visited = [[False]*h for _ in range(w)]
    q = deque()
    for x in range(w):
        q.append((x,0)); q.append((x,h-1))
    for y in range(h):
        q.append((0,y)); q.append((w-1,y))
    while q:
        x,y=q.popleft()
        if x<0 or y<0 or x>=w or y>=h or visited[x][y]:
            continue
        visited[x][y]=True
        r,g,b,a=pix[x,y]
        if is_bg(r,g,b,a):
            pix[x,y]=(r,g,b,0)
            q.extend(((x+1,y),(x-1,y),(x,y+1),(x,y-1)))
    # remove any isolated near-white transparent checker pixels anywhere, but keep highlights less aggressively
    for y in range(h):
        for x in range(w):
            r,g,b,a=pix[x,y]
            if a and is_bg(r,g,b,a) and (x < 12 or y < 12 or x >= w-12 or y >= h-12):
                pix[x,y]=(r,g,b,0)
    # crop to content and center on 512 canvas for mobile retina
    bbox = im.getbbox()
    if not bbox:
        return
    cropped = im.crop(bbox)
    cw,ch = cropped.size
    canvas_size=512
    max_icon = 390
    scale = min(max_icon/cw, max_icon/ch, 1.0 if max(cw,ch) >= max_icon else max_icon/max(cw,ch))
    nw,nh = max(1,int(cw*scale)), max(1,int(ch*scale))
    cropped = cropped.resize((nw,nh), Image.Resampling.LANCZOS)
    out = Image.new('RGBA',(canvas_size,canvas_size),(0,0,0,0))
    out.alpha_composite(cropped, ((canvas_size-nw)//2, (canvas_size-nh)//2))
    path.parent.joinpath(path.stem + '.png').write_bytes(b'')
    out.save(path, optimize=True)

for d in ICON_DIRS:
    for p in d.glob('*.png'):
        process(p)
        print('processed', p.relative_to(ROOT))
