// Sets sane defaults on install and keeps the toolbar badge in sync so you can
// tell at a glance whether Cat Mode is active.

const DEFAULTS = {
  catModeEnabled: false,
  unlockCombo: { ctrl: true, shift: true, alt: false, meta: false, key: "k" },
};

function updateBadge(enabled) {
  chrome.action.setBadgeText({ text: enabled ? "ON" : "" });
  chrome.action.setBadgeBackgroundColor({ color: "#e23b3b" });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(DEFAULTS, (state) => {
    chrome.storage.local.set({ ...DEFAULTS, ...state });
    updateBadge(state.catModeEnabled);
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(DEFAULTS, (state) => updateBadge(state.catModeEnabled));
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && "catModeEnabled" in changes) {
    updateBadge(!!changes.catModeEnabled.newValue);
  }
});

// Browser-level global shortcut (default Ctrl/⌘ + Shift + 9, editable at
// chrome://extensions/shortcuts). Works even when the page has focus and is
// blocking input, since command dispatch happens above the page.
chrome.commands.onCommand.addListener((command) => {
  if (command !== "toggle-cat-mode") return;
  chrome.storage.local.get(DEFAULTS, (state) => {
    chrome.storage.local.set({ catModeEnabled: !state.catModeEnabled });
  });
});
