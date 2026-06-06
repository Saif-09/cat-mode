#!/usr/bin/env python3
"""Generate Chrome Web Store assets as 24-bit PNG (RGB, NO alpha), no deps.

Outputs:
  promo-440x280.png      small promo tile
  marquee-1400x560.png   marquee promo tile
  screenshot-1280x800.png a product screenshot (browser mock w/ Cat Mode banner)

All are color-type-2 (RGB) PNGs — the store rejects alpha channels.
"""
import os, zlib, struct

OUT = os.path.dirname(os.path.abspath(__file__))
BG_TOP = (255, 122, 69)
BG_BOT = (255, 92, 99)
WHITE = (255, 255, 255)
RED = (226, 59, 59)
DARK = (28, 28, 31)
VIDEO = (52, 52, 60)

# Paw geometry normalized inside its box.
PAD = (0.50, 0.68, 0.23, 0.185)
TOES = [(0.275, 0.44, 0.090, 0.105), (0.425, 0.315, 0.098, 0.115),
        (0.575, 0.315, 0.098, 0.115), (0.725, 0.44, 0.090, 0.105)]

F = {
    "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    "C": ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
    "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
    "G": ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
    "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
    "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
    "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
    " ": ["00000"] * 7,
}


def in_ell(x, y, cx, cy, rx, ry):
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0


def in_paw(nx, ny):
    return in_ell(nx, ny, *PAD) or any(in_ell(nx, ny, *t) for t in TOES)


class Canvas:
    def __init__(self, w, h, ss):
        self.w, self.h, self.ss = w, h, ss
        self.sw, self.sh = w * ss, h * ss
        self.buf = bytearray(self.sw * self.sh * 3)

    def _set(self, x, y, c):
        if 0 <= x < self.sw and 0 <= y < self.sh:
            o = (y * self.sw + x) * 3
            self.buf[o], self.buf[o + 1], self.buf[o + 2] = c

    def gradient(self):
        for j in range(self.sh):
            v = j / (self.sh - 1)
            c = tuple(int(BG_TOP[k] + (BG_BOT[k] - BG_TOP[k]) * v) for k in range(3))
            row = bytes(c) * self.sw
            self.buf[j * self.sw * 3:(j + 1) * self.sw * 3] = row

    def rect(self, x, y, w, h, c):
        s = self.ss
        for j in range(int(y * s), int((y + h) * s)):
            for i in range(int(x * s), int((x + w) * s)):
                self._set(i, j, c)

    def round_rect(self, x, y, w, h, r, c):
        s = self.ss
        x0, y0, x1, y1 = x * s, y * s, (x + w) * s, (y + h) * s
        rs = r * s
        for j in range(int(y0), int(y1)):
            for i in range(int(x0), int(x1)):
                # corner check
                cx = cy = None
                if i < x0 + rs and j < y0 + rs: cx, cy = x0 + rs, y0 + rs
                elif i > x1 - rs and j < y0 + rs: cx, cy = x1 - rs, y0 + rs
                elif i < x0 + rs and j > y1 - rs: cx, cy = x0 + rs, y1 - rs
                elif i > x1 - rs and j > y1 - rs: cx, cy = x1 - rs, y1 - rs
                if cx is not None and (i - cx) ** 2 + (j - cy) ** 2 > rs * rs:
                    continue
                self._set(i, j, c)

    def ellipse(self, cx, cy, rx, ry, c):
        s = self.ss
        for j in range(int((cy - ry) * s), int((cy + ry) * s) + 1):
            for i in range(int((cx - rx) * s), int((cx + rx) * s) + 1):
                if ((i - cx * s) / (rx * s)) ** 2 + ((j - cy * s) / (ry * s)) ** 2 <= 1:
                    self._set(i, j, c)

    def tri_down(self, cx, cy, size, c):
        # right-pointing play triangle centered at cx,cy
        s = self.ss
        for j in range(int((cy - size) * s), int((cy + size) * s)):
            ny = abs(j - cy * s) / (size * s)
            xw = (1 - ny) * size * s
            for i in range(int(cx * s - size * s * 0.5), int(cx * s - size * s * 0.5 + xw)):
                self._set(i, j, c)

    def paw(self, x, y, w, h, c):
        s = self.ss
        for j in range(int(y * s), int((y + h) * s)):
            for i in range(int(x * s), int((x + w) * s)):
                if in_paw((i - x * s) / (w * s), (j - y * s) / (h * s)):
                    self._set(i, j, c)

    def text_w(self, text, cell):
        return len(text) * 5 * cell + (len(text) - 1) * cell

    def text(self, text, x, y, cell, c):
        s = self.ss
        cx = x
        for ch in text:
            g = F.get(ch, F[" "])
            for ry, row in enumerate(g):
                for rx, on in enumerate(row):
                    if on == "1":
                        self.rect(cx + rx * cell, y + ry * cell, cell, cell, c)
            cx += 5 * cell + cell

    def text_center(self, text, cw_x0, cw_w, y, cell, c):
        w = self.text_w(text, cell)
        self.text(text, cw_x0 + (cw_w - w) / 2, y, cell, c)

    def save(self, name):
        # downsample SSxSS box filter to RGB
        out = bytearray(self.w * self.h * 3)
        n = self.ss * self.ss
        for j in range(self.h):
            for i in range(self.w):
                r = g = b = 0
                for dj in range(self.ss):
                    base = ((j * self.ss + dj) * self.sw + i * self.ss) * 3
                    for di in range(self.ss):
                        s = base + di * 3
                        r += self.buf[s]; g += self.buf[s + 1]; b += self.buf[s + 2]
                o = (j * self.w + i) * 3
                out[o] = r // n; out[o + 1] = g // n; out[o + 2] = b // n
        write_png_rgb(os.path.join(OUT, name), self.w, self.h, out)
        print("wrote", name)


def write_png_rgb(path, w, h, rgb):
    def chunk(typ, data):
        return struct.pack(">I", len(data)) + typ + data + \
            struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)
    raw = bytearray()
    stride = w * 3
    for j in range(h):
        raw.append(0)
        raw.extend(rgb[j * stride:(j + 1) * stride])
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))  # type 2 = RGB
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


def brand_tile(w, h, paw_box, title_cell, title_y, ss):
    c = Canvas(w, h, ss)
    c.gradient()
    c.paw(*paw_box, WHITE)
    px, py, pw, ph = paw_box
    text_x0 = px + pw
    c.text_center("CAT", text_x0, w - text_x0, title_y, title_cell, WHITE)
    c.text_center("MODE", text_x0, w - text_x0, title_y + 7 * title_cell + title_cell, title_cell, WHITE)
    return c


def make_promo():
    brand_tile(440, 280, (28, 30, 220, 220), 9, 70, 3).save("promo-440x280.png")


def make_marquee():
    brand_tile(1400, 560, (120, 80, 400, 400), 16, 150, 2).save("marquee-1400x560.png")


def make_screenshot():
    c = Canvas(1280, 800, 2)
    c.gradient()
    # Title
    c.text_center("CAT MODE", 0, 1280, 70, 14, WHITE)
    # Browser card
    c.round_rect(240, 190, 800, 420, 18, WHITE)
    c.rect(240, 236, 800, 374 - 0, VIDEO)  # body
    c.rect(240, 236, 800, 0, VIDEO)
    # re-draw rounded bottom corners of body over video: simpler, keep square body inside card
    # title bar dots
    for k, col in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        c.ellipse(272 + k * 26, 213, 8, 8, col)
    # play button
    c.ellipse(640, 430, 58, 58, (255, 255, 255))
    c.tri_down(648, 430, 30, DARK)
    # ON banner pill
    bw = 360
    bx = 640 - bw / 2
    c.round_rect(bx, 262, bw, 56, 28, RED)
    c.paw(bx + 22, 274, 32, 32, WHITE)
    c.text(" CAT MODE ON", bx + 56, 282, 4, WHITE)
    # tagline
    c.text_center("PETS CANT RUIN YOUR VIDEO", 0, 1280, 656, 5, WHITE)
    c.save("screenshot-1280x800.png")


make_promo()
make_marquee()
make_screenshot()
