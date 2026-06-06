# Chrome Web Store listing — copy/paste

## Name
Cat Mode — Keyboard Guard

## Category
Productivity

## Short description (132 char max)
Block your keyboard & trackpad with one shortcut so pets walking across them can't mess up your video or page. Unlock instantly.

## Detailed description
Ever had your cat, rabbit, or toddler walk across the keyboard while a video is
playing — pausing it, skipping ahead, or triggering random shortcuts? Cat Mode
fixes that.

Flip Cat Mode on and it blocks all keyboard keys, mouse clicks, trackpad taps,
scrolling, and touch on the current web page, so a stray paw can't do anything.
A clear "🐾 Cat Mode ON" banner reminds you it's active.

To get back to normal, press your own unlock shortcut — a combo only a human
would press (default Ctrl+Shift+K, fully customizable). You can also toggle it
from a browser-level shortcut or the toolbar button at any time.

FEATURES
• One-click on/off from the toolbar
• Blocks keyboard, mouse, trackpad, scroll, and touch input
• Custom unlock shortcut you set yourself
• Browser-wide toggle shortcut (works even while input is blocked)
• On-screen banner so you always know when it's active
• No accounts, no tracking — everything stays on your device

Note: Like all extensions, Cat Mode can only guard input inside web pages, not
the browser's address bar or other apps.

## Privacy practices tab (THIS is what blocks "Submit for review")

### Single purpose (paste)
Cat Mode has one purpose: to block keyboard and trackpad/mouse input on the
current web page so accidental presses — such as a pet walking across the
keyboard — cannot disrupt the page or video. The user turns it on and off and
unlocks it with a shortcut they define.

### Remote code
No — all code is contained in the extension package; nothing is fetched or
executed from a remote source.

### Data usage / certification
- What user data does this item collect? → Select NONE of the categories.
- Then tick all three required certification checkboxes:
  • I do not sell or transfer user data to third parties (outside approved uses)
  • I do not use or transfer user data for purposes unrelated to the single purpose
  • I do not use or transfer user data to determine creditworthiness / for lending

### Privacy policy (only if the dashboard demands a URL)
Cat Mode does not collect, store, or transmit any personal data. All settings
(on/off state and your unlock shortcut) are stored locally in your browser via
chrome.storage and never leave your device.
(Host this one paragraph on any public URL — a GitHub Gist, a Notion page, a
GitHub Pages file — and paste that URL.)

## Permission justifications (paste into the dashboard when asked)

storage:
Used to save the on/off state and the user's chosen unlock shortcut locally so
they persist across tabs and sessions. No data is transmitted anywhere.

Host permissions (<all_urls> / "Read and change all your data on websites"):
The extension's purpose is to block stray keyboard and trackpad input on
whatever page the user is watching or reading. Because that can be any website,
the content script must be able to run on all sites. It only listens for and
blocks input events while the user has explicitly turned Cat Mode on — it does
not read page content, collect data, or contact any server.

## Privacy / data use answers
• Does your extension collect user data? — No
• Remote code? — No (all code is in the package)
• Sells/transfers data? — No
A privacy policy URL is generally not required when no data is collected, but
if the dashboard demands one, a single sentence hosted anywhere works:
"Cat Mode does not collect, store, or transmit any personal data. All settings
are stored locally in your browser."

## Screenshots to capture (1280×800 recommended)
1. A video page with the "🐾 Cat Mode ON" banner visible.
2. The popup open, showing the toggle and the unlock-shortcut UI.
3. (Optional) The chrome://extensions/shortcuts page showing the global toggle.
