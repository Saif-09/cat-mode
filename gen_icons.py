#!/usr/bin/env python3
"""Generate Cat Mode paw-print PNG icons with no third-party deps.

Draws a white paw print on a rounded coral tile, anti-aliased via 4x
supersampling, and writes 16/32/48/128 px PNGs using only zlib + struct.
"""
import os, zlib, struct, math

OUT = os.path.dirname(os.path.abspath(__file__))
SS = 4  # supersample factor

# Palettes (RGB). "idle" is the default coral tile; "active" is a deeper, more
# saturated red so the toolbar icon visibly lights up while Cat Mode is on.
PALETTES = {
    "": {"top": (255, 122, 69), "bot": (255, 92, 99)},        # warm orange -> coral
    "-active": {"top": (226, 59, 59), "bot": (150, 22, 30)},  # red -> deep red
}
PAW = (255, 255, 255)

# Paw geometry in normalized [0,1] coords: (cx, cy, rx, ry)
PAD = (0.50, 0.68, 0.23, 0.185)
TOES = [
    (0.275, 0.44, 0.090, 0.105),
    (0.425, 0.315, 0.098, 0.115),
    (0.575, 0.315, 0.098, 0.115),
    (0.725, 0.44, 0.090, 0.105),
]


def in_ellipse(x, y, cx, cy, rx, ry):
    dx = (x - cx) / rx
    dy = (y - cy) / ry
    return dx * dx + dy * dy <= 1.0


def rounded(x, y, r):
    # x,y in [0,1]; r = corner radius fraction. Returns True if inside tile.
    for (cx, cy) in ((r, r), (1 - r, r), (r, 1 - r), (1 - r, 1 - r)):
        # corner regions
        pass
    # simpler: distance-to-edge rounded rect
    qx = abs(x - 0.5) - (0.5 - r)
    qy = abs(y - 0.5) - (0.5 - r)
    qx = max(qx, 0.0)
    qy = max(qy, 0.0)
    return math.hypot(qx, qy) <= r


def render(size, top, bot):
    S = size * SS
    px = bytearray(S * S * 4)
    for j in range(S):
        v = j / (S - 1)
        # vertical gradient background color
        bg = tuple(int(top[k] + (bot[k] - top[k]) * v) for k in range(3))
        ny = j / S + 0.5 / S
        for i in range(S):
            nx = i / S + 0.5 / S
            idx = (j * S + i) * 4
            if not rounded(nx, ny, 0.22):
                px[idx + 3] = 0  # transparent outside tile
                continue
            paw = in_ellipse(nx, ny, *PAD)
            if not paw:
                for (cx, cy, rx, ry) in TOES:
                    if in_ellipse(nx, ny, cx, cy, rx, ry):
                        paw = True
                        break
            r, g, b = PAW if paw else bg
            px[idx] = r
            px[idx + 1] = g
            px[idx + 2] = b
            px[idx + 3] = 255

    # Downsample SSxSS -> size with box filter
    out = bytearray(size * size * 4)
    n = SS * SS
    for j in range(size):
        for i in range(size):
            ar = ag = ab = aa = 0
            for dj in range(SS):
                for di in range(SS):
                    s = ((j * SS + dj) * S + (i * SS + di)) * 4
                    a = px[s + 3]
                    ar += px[s] * a
                    ag += px[s + 1] * a
                    ab += px[s + 2] * a
                    aa += a
            o = (j * size + i) * 4
            if aa == 0:
                out[o + 3] = 0
            else:
                out[o] = ar // aa
                out[o + 1] = ag // aa
                out[o + 2] = ab // aa
                out[o + 3] = aa // n
    return out


def write_png(path, size, rgba):
    def chunk(typ, data):
        c = struct.pack(">I", len(data)) + typ + data
        return c + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)

    raw = bytearray()
    stride = size * 4
    for j in range(size):
        raw.append(0)  # filter type 0
        raw.extend(rgba[j * stride:(j + 1) * stride])
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", ihdr)
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


for suffix, pal in PALETTES.items():
    for sz in (16, 32, 48, 128):
        name = f"icon{sz}{suffix}.png"
        write_png(os.path.join(OUT, name), sz, render(sz, pal["top"], pal["bot"]))
        print("wrote", name)
