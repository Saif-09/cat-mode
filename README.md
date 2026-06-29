# Cat Mode — Keyboard Guard 🐾

A Chrome extension that blocks keyboard and trackpad input on the current web
page so a cat (or rabbit, or toddler) walking across your keyboard can't pause
the video, skip around, or trigger random shortcuts. Turn it back off with a
keyboard combo only a human would press.

## Install (load unpacked)

1. Open `chrome://extensions`
2. Toggle **Developer mode** on (top-right)
3. Click **Load unpacked** and select this `cat-mode` folder
4. Pin the extension so the toolbar icon is visible

## Use

- Click the toolbar icon → flip **Block keyboard & trackpad** on. The toolbar
  icon turns red while Cat Mode is active.
- A `🐾 Cat Mode ON` banner appears on the page (with a running count of paws
  blocked). Keypresses, clicks, scroll, and trackpad input are now swallowed
  before they reach the page.
- To unlock, press your shortcut (default **Ctrl + Shift + K**). You can also
  just flip the toggle off from the popup — the toolbar isn't blocked.
- Change the unlock shortcut from the popup → **Change** → press the new combo.
  Combos the browser reserves (e.g. `Ctrl+W`, `Ctrl+Shift+I`) are rejected.

### Options (in the popup)

- **Keep videos playing** — if something pauses a `<video>`/`<audio>` while Cat
  Mode is on (an OS media key, a stray gesture), it's resumed automatically.
- **Auto-disable after** — a safety timer (5 min – 1 hour) so you can never get
  stuck with input blocked if you walk away.

Your unlock shortcut and these preferences are stored in `chrome.storage.sync`,
so they follow you to every device you're signed into Chrome on. The on/off
state and the blocked counter are per-device (`chrome.storage.local`).

On first install a short **welcome page** opens to walk you through pinning the
icon and setting the global shortcut.

### Global shortcut

There's also a browser-level toggle (suggested **⌘/Ctrl + Shift + 9**) that turns
Cat Mode on or off even when a page is focused and blocking input, because
Chrome dispatches it above the page.

> **Heads up:** the combo in `manifest.json` is only a *suggestion*. Chrome
> won't always bind it on a fresh install — if the combo conflicts with another
> extension or browser shortcut it's silently left **unassigned**, and there is
> no way for an extension to set its own shortcut from code. If the popup shows
> the global shortcut as **"Not set"**, click **Set up** (or open
> `chrome://extensions/shortcuts`) and assign a combo yourself. The toolbar
> toggle in the popup always works regardless.

## Regenerating icons

Icons are committed as PNGs. To re-generate them, run `python3 gen_icons.py`
(pure standard library, no dependencies). It emits both the idle coral icons
(`icon*.png`) and the red active-state icons (`icon*-active.png`) shown while
Cat Mode is on.

## How it works

`content.js` runs in every frame at `document_start` and adds capture-phase
listeners for keyboard, pointer, mouse, wheel, and touch events. While Cat Mode
is on it calls `preventDefault()` + `stopImmediatePropagation()` on each one, so
nothing reaches the page or the video player. The single exception is the
unlock shortcut, which it watches for on `keydown` and uses to switch Cat Mode
off. It also watches media `pause` events to keep videos playing, and tallies
blocked gestures for the on-screen counter. The on/off state lives in
`chrome.storage.local`; the unlock combo and preferences live in
`chrome.storage.sync`. `background.js` mirrors that state to the toolbar badge
and icon and runs the auto-disable alarm.

## Limitations

Chrome extensions can only intercept input **inside web pages**. They can't
block keystrokes in the browser's own UI (address bar, tab strip) or in other
apps — that needs an OS-level tool. For the "pet on keyboard while a video
plays in the tab" case, page-level blocking covers it. Also note: it doesn't
run on `chrome://` pages or the Chrome Web Store, and tabs already open before
install need a reload to pick up the content script.
