const DEFAULTS = {
  catModeEnabled: false,
  unlockCombo: { ctrl: true, shift: true, alt: false, meta: false, key: "k" },
};

const toggle = document.getElementById("toggle");
const statusSub = document.getElementById("status-sub");
const comboDisplay = document.getElementById("combo-display");
const recordBtn = document.getElementById("record-btn");
const recordHint = document.getElementById("record-hint");

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

function render(state) {
  toggle.checked = !!state.catModeEnabled;
  statusSub.textContent = state.catModeEnabled ? "On — input is blocked" : "Off";
  comboDisplay.textContent = comboLabel(state.unlockCombo);
}

chrome.storage.local.get(DEFAULTS, render);

toggle.addEventListener("change", () => {
  chrome.storage.local.set({ catModeEnabled: toggle.checked });
  statusSub.textContent = toggle.checked ? "On — input is blocked" : "Off";
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
  chrome.storage.local.get(DEFAULTS, (s) => {
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

    chrome.storage.local.set({ unlockCombo: combo }, () => {
      recordHint.textContent = "Saved ✓";
      comboDisplay.classList.remove("recording");
      comboDisplay.textContent = comboLabel(combo);
      recording = false;
      recordBtn.textContent = "Change";
    });
  },
  true
);
