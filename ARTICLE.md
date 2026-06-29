# I built a Chrome extension so my cat can watch YouTube

*She loves the "cat games" videos. She also loves attacking the keyboard while
she watches — which kept breaking the video. So I taught the browser to ignore
her paws.*

---

## The setup

There's a whole genre of YouTube videos made for cats: birds pecking at seed, a
mouse scurrying across the frame, fish drifting in a tank. You put one on, set
the laptop down, and your cat goes into full hunting mode.

Mine *loves* it. The problem is she doesn't watch politely from a distance — she
pounces. Paws on the screen, paws skidding across the keyboard, trying to
physically catch the bird. And every time she lands on the keyboard, something
breaks: the video pauses, jumps ahead, mutes, or some app pops open. I'd spend
the whole session leaning over to un-pause it.

So I gave her a better experience. **Cat Mode** is a Chrome extension with one
switch: flip it on, and the keyboard and trackpad stop affecting the page. Now
she can smack the laptop all she likes and the birds keep flying. When *I* want
control back, I press a shortcut only a human would press.

- 🔗 Live: https://saif-09.github.io/cat-mode/
- 💻 Source: https://github.com/Saif-09/cat-mode

It's a silly use case. The engineering underneath turned out to be a genuinely
nice lesson in how the browser works.

---

## The key realization

An extension can't switch off your physical keyboard — that lives at the
operating-system level, outside the browser's sandbox. But it doesn't need to.
It can do something subtler: **intercept every input event inside the web page
before the page ever sees it, and throw it away.**

A YouTube player can't pause on a spacebar press it never receives. A paw on the
trackpad can't click "skip" if the click never reaches the page.

That one idea is the whole product.

---

## How it actually works

Browser events don't just "happen" on an element — they *travel*. When a paw
hits the keyboard, the event flows top-down from `window` to the element (the
**capture** phase), then back up (the **bubble** phase):

```
   CAPTURE (top → down)                    BUBBLE (down → up)
window → document → … → <video>   →   <video> → … → document → window
   ▲ Cat Mode listens HERE, first
```

Cat Mode attaches a listener on `window` in the **capture phase**, so it's first
in line — before the page's own handlers. While Cat Mode is on, every keydown,
click, scroll, and touch hits this:

```js
e.preventDefault();           // cancel the default action (pause, scroll, type)
e.stopImmediatePropagation(); // stop the event reaching anything else
```

`preventDefault()` kills the built-in behavior; `stopImmediatePropagation()`
stops the event's journey entirely. The page learns nothing happened. The bird
keeps flying.

A couple of details that make it robust:

- It runs at `document_start` and in **all frames**, so it's active before the
  page's scripts load and works inside the embedded YouTube player iframe.
- Scroll and touch events are *passive* by default for performance, so the
  browser ignores `preventDefault()` on them unless you opt out explicitly
  (`{ passive: false }`). Easy to miss — and important here, because a cat does
  a lot of "scrolling" with her paws.

### The escape hatch

If you block *everything*, how do you get back to normal? With one allowed
exception. On each keydown, before blocking, Cat Mode checks whether the press
matches your chosen unlock combo (default `Ctrl+Shift+K`). If it matches, it
lets it through and turns Cat Mode off. A modifier is required — so a paw can't
trigger it by accident, but a human can do it in a second.

### State without messaging

Chrome extensions are made of isolated parts — a popup, a background worker, and
a content script in every tab — that can't call each other's functions directly.
The usual answer is message-passing, which gets fiddly fast.

Instead, Cat Mode keeps **two values in `chrome.storage.local`**: whether it's
on, and the unlock shortcut. Every part subscribes to `storage.onChanged`. So
flipping the toggle is just *one write*, and every open tab, the toolbar badge,
and the global shortcut react automatically. Storage becomes the message bus —
no coordination code, no races.

That's also why there are three ways to toggle it — the toolbar button, a
browser-wide keyboard shortcut, and the in-page unlock combo — and they all just
write the same value.

---

## The detour: drawing icons with no image library

The Chrome Web Store wants an icon and promo art. My machine had no image
tooling installed — no Pillow, no ImageMagick, nothing. Rather than install a
stack for four PNGs, I wrote a **PNG encoder in pure Python** using only the
standard library (`zlib` + `struct`).

It draws a paw with simple ellipse math, supersamples and averages the pixels
for smooth edges, then hand-assembles the PNG byte structure: signature →
`IHDR` → compressed pixel data (`IDAT`) → `IEND`.

One real gotcha: the store rejected my first upload because the PNG had an alpha
channel (it wants 24-bit RGB, no transparency). One flag in the encoder fixed
it. Even the text on the promo tile is a tiny hand-built 5×7 bitmap font — every
letter is a grid of 1s and 0s.

A cat made me learn the PNG file format. Worth it.

---

## Shipping it

The build was an afternoon. Distribution was its own little journey:

- **Chrome Web Store** — zip the extension, write the listing, and (the part
  that actually blocks submission) fill out the *Privacy practices* tab: justify
  every permission, declare what data you collect (none), and host a privacy
  policy. Because the extension runs on all sites, a privacy policy is mandatory
  and it triggers a deeper review.
- **GitHub** — public repo so anyone can read the ~200 lines or install it
  manually.
- **GitHub Pages** — a small landing page so I can share one link and people
  land on an "Add to Chrome" button.

---

## What I took away

- **The browser is more hackable than it looks.** Understanding event phases
  turned a vague "can I block the keyboard?" into a five-line answer.
- **Shared state beats message-passing** for small extensions. One storage value
  kept everything in sync with almost no code.
- **Honor the constraints.** This only works inside web pages — not the address
  bar or other apps — and that's perfect, because that's exactly where the cat
  and the video both live.
- **The best side projects have an audience of one.** Mine has four paws and
  zero patience.

Small problems are underrated. They're the perfect size to actually finish — and
sometimes the user just wants to catch a digital bird in peace.

*Cat Mode is open source — code and demo linked above.*
