#!/usr/bin/env python3
"""Generate the 440x280 Chrome Web Store small promo tile, no deps.

Coral gradient + white paw on the left, "CAT MODE" in a hand-built 5x7
bitmap font on the right. Anti-aliased via 3x supersampling.
"""
import os, zlib, struct

OUT = os.path.dirname(os.path.abspath(__file__))
W, H, SS = 440, 280, 3
BG_TOP = (255, 122, 69)
BG_BOT = (255, 92, 99)

# Paw geometry (normalized 0..1 inside its box): (cx, cy, rx, ry)
PAD = (0.50, 0.68, 0.23, 0.185)
TOES = [
    (0.275, 0.44, 0.090, 0.105),
    (0.425, 0.315, 0.098, 0.115),
    (0.575, 0.315, 0.098, 0.115),
    (0.725, 0.44, 0.090, 0.105),
]
# Paw box in final px (mapped into supersampled space below)
PAW_BOX = (28, 30, 250, 250)  # x0, y0, x1, y1

FONT = {
    "C": ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
    "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    " ": ["00000"] * 7,
}


def in_ell(x, y, cx, cy, rx, ry):
    dx = (x - cx) / rx
    dy = (y - cy) / ry
    return dx * dx + dy * dy <= 1.0


def in_paw(nx, ny):
    if in_ell(nx, ny, *PAD):
        return True
    for t in TOES:
        if in_ell(nx, ny, *t):
            return True
    return False


def render():
    sw, sh = W * SS, H * SS
    px = bytearray(sw * sh * 4)
    x0, y0, x1, y1 = (v * SS for v in PAW_BOX)
    pw, ph = x1 - x0, y1 - y0

    for j in range(sh):
        v = j / (sh - 1)
        bg = tuple(int(BG_TOP[k] + (BG_BOT[k] - BG_TOP[k]) * v) for k in range(3))
        for i in range(sw):
            idx = (j * sw + i) * 4
            white = False
            if x0 <= i < x1 and y0 <= j < y1:
                if in_paw((i - x0) / pw, (j - y0) / ph):
                    white = True
            r, g, b = (255, 255, 255) if white else bg
            px[idx] = r
            px[idx + 1] = g
            px[idx + 2] = b
            px[idx + 3] = 255

    # Stamp text (white blocks) directly in supersampled space.
    def draw_text(text, ox, oy, cell):
        cx = ox * SS
        for ch in text:
            glyph = FONT[ch]
            for ry, row in enumerate(glyph):
                for rx, on in enumerate(row):
                    if on != "1":
                        continue
                    bx = cx + rx * cell * SS
                    by = (oy + ry * cell) * SS
                    for dy in range(cell * SS):
                        for dx in range(cell * SS):
                            xx, yy = bx + dx, by + dy
                            if 0 <= xx < sw and 0 <= yy < sh:
                                o = (yy * sw + xx) * 4
                                px[o] = px[o + 1] = px[o + 2] = 255
            cx += (5 * cell + 2) * SS  # advance: glyph width + spacing

    draw_text("CAT", 250, 70, 9)
    draw_text("MODE", 250, 150, 9)

    # Downsample
    out = bytearray(W * H * 4)
    n = SS * SS
    for j in range(H):
        for i in range(W):
            ar = ag = ab = 0
            for dj in range(SS):
                base = ((j * SS + dj) * sw + i * SS) * 4
                for di in range(SS):
                    s = base + di * 4
                    ar += px[s]; ag += px[s + 1]; ab += px[s + 2]
            o = (j * W + i) * 4
            out[o] = ar // n; out[o + 1] = ag // n; out[o + 2] = ab // n; out[o + 3] = 255
    return out


def write_png(path, w, h, rgba):
    def chunk(typ, data):
        return struct.pack(">I", len(data)) + typ + data + \
            struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)
    raw = bytearray()
    stride = w * 4
    for j in range(h):
        raw.append(0)
        raw.extend(rgba[j * stride:(j + 1) * stride])
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


write_png(os.path.join(OUT, "promo-440x280.png"), W, H, render())
print("wrote promo-440x280.png")
