// Keeps the toolbar in sync (badge + icon), sets sane defaults on install,
// opens a one-time welcome page, and runs the auto-disable safety timer.

// Device-specific state lives in storage.local; user preferences that should
// follow you across devices live in storage.sync.
const LOCAL_DEFAULTS = {
  catModeEnabled: false,
  blockedCount: 0,
};
const SYNC_DEFAULTS = {
  unlockCombo: { ctrl: true, shift: true, alt: false, meta: false, key: "k" },
  keepVideoPlaying: true,
  autoOffMinutes: 0, // 0 = never auto-disable
};

const AUTO_OFF_ALARM = "cat-mode-auto-off";

function iconSet(active) {
  const s = active ? "-active" : "";
  return {
    16: `icon16${s}.png`,
    32: `icon32${s}.png`,
    48: `icon48${s}.png`,
    128: `icon128${s}.png`,
  };
}

function updateAction(enabled) {
  chrome.action.setBadgeText({ text: enabled ? "ON" : "" });
  chrome.action.setBadgeBackgroundColor({ color: "#e23b3b" });
  chrome.action.setIcon({ path: iconSet(enabled) });
}

// Arm (or clear) the safety timer that turns Cat Mode off after a while, so you
// can never get stuck with input blocked if you walk away.
function scheduleAutoOff(enabled) {
  chrome.alarms.clear(AUTO_OFF_ALARM);
  if (!enabled) return;
  chrome.storage.sync.get(SYNC_DEFAULTS, ({ autoOffMinutes }) => {
    const mins = Number(autoOffMinutes) || 0;
    if (mins > 0) chrome.alarms.create(AUTO_OFF_ALARM, { delayInMinutes: mins });
  });
}

chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.local.get(LOCAL_DEFAULTS, (state) => {
    chrome.storage.local.set({ ...LOCAL_DEFAULTS, ...state });
    updateAction(state.catModeEnabled);
  });
  // Pre-sync versions stored unlockCombo in local; carry it over so an updating
  // user doesn't silently lose a custom unlock shortcut. Resolve everything in
  // one write so the defaults pass can't clobber the migrated value.
  chrome.storage.local.get(["unlockCombo"], (legacy) => {
    chrome.storage.sync.get(SYNC_DEFAULTS, (state) => {
      const merged = { ...SYNC_DEFAULTS, ...state };
      if (legacy.unlockCombo) {
        merged.unlockCombo = legacy.unlockCombo;
        chrome.storage.local.remove("unlockCombo");
      }
      chrome.storage.sync.set(merged);
    });
  });
  // Walk first-time users through pinning + setting the global shortcut.
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
  }
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(LOCAL_DEFAULTS, (state) => {
    updateAction(state.catModeEnabled);
    scheduleAutoOff(state.catModeEnabled);
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && "catModeEnabled" in changes) {
    const enabled = !!changes.catModeEnabled.newValue;
    updateAction(enabled);
    scheduleAutoOff(enabled);
  }
  // Re-arm with the new duration if it changes while Cat Mode is on.
  if (area === "sync" && "autoOffMinutes" in changes) {
    chrome.storage.local.get(LOCAL_DEFAULTS, (s) => scheduleAutoOff(s.catModeEnabled));
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === AUTO_OFF_ALARM) {
    chrome.storage.local.set({ catModeEnabled: false });
  }
});

// Browser-level global shortcut (default Ctrl/⌘ + Shift + 9, editable at
// chrome://extensions/shortcuts). Works even when the page has focus and is
// blocking input, since command dispatch happens above the page.
chrome.commands.onCommand.addListener((command) => {
  if (command !== "toggle-cat-mode") return;
  chrome.storage.local.get(LOCAL_DEFAULTS, (state) => {
    chrome.storage.local.set({ catModeEnabled: !state.catModeEnabled });
  });
});
