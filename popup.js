const LOCAL_DEFAULTS = { catModeEnabled: false, blockedCount: 0 };
const SYNC_DEFAULTS = {
  unlockCombo: { ctrl: true, shift: true, alt: false, meta: false, key: "k" },
  keepVideoPlaying: true,
  autoOffMinutes: 0,
};

const toggle = document.getElementById("toggle");
const statusSub = document.getElementById("status-sub");
const comboDisplay = document.getElementById("combo-display");
const recordBtn = document.getElementById("record-btn");
const recordHint = document.getElementById("record-hint");
const globalDisplay = document.getElementById("global-display");
const globalBtn = document.getElementById("global-btn");
const globalWarn = document.getElementById("global-warn");
const keepVideo = document.getElementById("keep-video");
const autoOff = document.getElementById("auto-off");
const blockedCount = document.getElementById("blocked-count");

const MODIFIER_KEYS = new Set(["Control", "Shift", "Alt", "Meta"]);

function comboLabel(c) {
  if (!c || !c.key) return "(not set)";
  const parts = [];
  if (c.ctrl) parts.push("Ctrl");
  if (c.meta) parts.push("⌘");
  if (c.alt) parts.push("Alt");
  if (c.shift) parts.push("Shift");
  parts.push(c.key.length === 1 ? c.key.toUpperCase() : c.key);
  return parts.join(" + ");
}

// --- A1: reject unlock combos the browser grabs before the page can ---------
function riskyReason(c) {
  const k = (c.key || "").toLowerCase();
  const cmd = c.ctrl || c.meta;
  if (["escape", "tab", "enter", " ", "backspace"].includes(k)) {
    return "Pick a letter, number, or symbol key.";
  }
  if (cmd && !c.shift && !c.alt && ["w", "t", "n", "q", "l", "r", "d"].includes(k)) {
    return `Ctrl/⌘ + ${k.toUpperCase()} is a browser shortcut — add Shift or pick another key.`;
  }
  if (cmd && c.shift && ["i", "j", "c"].includes(k)) {
    return "That combo opens DevTools. Pick another key.";
  }
  return null;
}

function renderState(local, sync) {
  toggle.checked = !!local.catModeEnabled;
  statusSub.textContent = local.catModeEnabled ? "On — input is blocked" : "Off";
  comboDisplay.textContent = comboLabel(sync.unlockCombo);
  keepVideo.checked = sync.keepVideoPlaying !== false;
  autoOff.value = String(sync.autoOffMinutes || 0);
  renderBlocked(local.blockedCount || 0);
}

function renderBlocked(n) {
  blockedCount.textContent = n > 0
    ? `🐾 ${n} ${n === 1 ? "paw" : "paws"} blocked so far`
    : "🐾 No paws blocked yet";
}

chrome.storage.local.get(LOCAL_DEFAULTS, (local) => {
  chrome.storage.sync.get(SYNC_DEFAULTS, (sync) => renderState(local, sync));
});

// Keep the blocked counter live while the popup is open.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && "blockedCount" in changes) {
    renderBlocked(changes.blockedCount.newValue || 0);
  }
});

// --- Global toggle shortcut status -----------------------------------------
// The manifest only *suggests* a key; Chrome won't always bind it (conflicts,
// fresh installs). Detect the real state and, if it's unassigned, point the
// user at chrome://extensions/shortcuts — the only place it can be set.

function refreshGlobalShortcut() {
  if (!chrome.commands || !chrome.commands.getAll) return;
  chrome.commands.getAll((commands) => {
    const cmd = (commands || []).find((c) => c.name === "toggle-cat-mode");
    const shortcut = cmd && cmd.shortcut;
    if (shortcut) {
      globalDisplay.textContent = shortcut;
      globalDisplay.classList.remove("unset");
      globalBtn.textContent = "Change";
      globalWarn.hidden = true;
    } else {
      globalDisplay.textContent = "Not set";
      globalDisplay.classList.add("unset");
      globalBtn.textContent = "Set up";
      globalWarn.hidden = false;
    }
  });
}

refreshGlobalShortcut();

globalBtn.addEventListener("click", () => {
  // A plain <a href> to chrome:// is blocked from a popup; opening a tab works.
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

// --- Toggle + preferences ---------------------------------------------------

toggle.addEventListener("change", () => {
  chrome.storage.local.set({ catModeEnabled: toggle.checked });
  statusSub.textContent = toggle.checked ? "On — input is blocked" : "Off";
});

keepVideo.addEventListener("change", () => {
  chrome.storage.sync.set({ keepVideoPlaying: keepVideo.checked });
});

autoOff.addEventListener("change", () => {
  chrome.storage.sync.set({ autoOffMinutes: Number(autoOff.value) || 0 });
});

// --- Recording a new unlock shortcut ---------------------------------------

let recording = false;

recordBtn.addEventListener("click", () => {
  recording = !recording;
  if (recording) {
    comboDisplay.classList.add("recording");
    comboDisplay.textContent = "Press keys…";
    recordBtn.textContent = "Cancel";
    recordHint.textContent = "Hold a modifier (Ctrl/Shift/Alt/⌘) and press a key.";
  } else {
    stopRecording();
  }
});

function stopRecording() {
  recording = false;
  comboDisplay.classList.remove("recording");
  recordBtn.textContent = "Change";
  chrome.storage.sync.get(SYNC_DEFAULTS, (s) => {
    comboDisplay.textContent = comboLabel(s.unlockCombo);
  });
}

window.addEventListener(
  "keydown",
  (e) => {
    if (!recording) return;
    e.preventDefault();
    e.stopPropagation();

    if (e.key === "Escape") {
      recordHint.textContent = "Cancelled.";
      stopRecording();
      return;
    }

    // Wait until a non-modifier key is pressed alongside the modifiers.
    if (MODIFIER_KEYS.has(e.key)) return;

    const combo = {
      ctrl: e.ctrlKey,
      shift: e.shiftKey,
      alt: e.altKey,
      meta: e.metaKey,
      key: e.key.toLowerCase(),
    };

    if (!combo.ctrl && !combo.shift && !combo.alt && !combo.meta) {
      recordHint.textContent = "Use at least one modifier so pets can't trigger it.";
      return;
    }

    const risk = riskyReason(combo);
    if (risk) {
      recordHint.textContent = risk;
      return;
    }

    chrome.storage.sync.set({ unlockCombo: combo }, () => {
      recordHint.textContent = "Saved ✓";
      comboDisplay.classList.remove("recording");
      comboDisplay.textContent = comboLabel(combo);
      recording = false;
      recordBtn.textContent = "Change";
    });
  },
  true
);
