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

- Click the toolbar icon → flip **Block keyboard & trackpad** on.
- A `🐾 Cat Mode ON` banner appears on the page. Keypresses, clicks, scroll,
  and trackpad input are now swallowed before they reach the page.
- To unlock, press your shortcut (default **Ctrl + Shift + K**). You can also
  just flip the toggle off from the popup — the toolbar isn't blocked.
- Change the unlock shortcut from the popup → **Change** → press the new combo.

### Global shortcut

There's also a browser-level toggle (default **⌘/Ctrl + Shift + 9**) that turns
Cat Mode on or off even when a page is focused and blocking input. Edit or
re-bind it at `chrome://extensions/shortcuts`. This is the most reliable
on/off switch because Chrome dispatches it above the page.

## Regenerating icons

Icons are committed as PNGs. To re-generate them, run `python3 gen_icons.py`
(pure standard library, no dependencies).

## How it works

`content.js` runs in every frame at `document_start` and adds capture-phase
listeners for keyboard, pointer, mouse, wheel, and touch events. While Cat Mode
is on it calls `preventDefault()` + `stopImmediatePropagation()` on each one, so
nothing reaches the page or the video player. The single exception is the
unlock shortcut, which it watches for on `keydown` and uses to switch Cat Mode
off. State lives in `chrome.storage.local` and syncs across every tab and frame.

## Limitations

Chrome extensions can only intercept input **inside web pages**. They can't
block keystrokes in the browser's own UI (address bar, tab strip) or in other
apps — that needs an OS-level tool. For the "pet on keyboard while a video
plays in the tab" case, page-level blocking covers it. Also note: it doesn't
run on `chrome://` pages or the Chrome Web Store, and tabs already open before
install need a reload to pick up the content script.
