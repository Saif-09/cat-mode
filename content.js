// Cat Mode content script.
// Runs in every frame at document_start. When enabled, it swallows keyboard
// and trackpad/mouse input during the capture phase so it never reaches the
// page (or the video player). The only input that gets through is the
// user-defined unlock shortcut, which turns Cat Mode back off.

(() => {
  const DEFAULTS = {
    catModeEnabled: false,
    // Default unlock shortcut: Ctrl+Shift+K
    unlockCombo: { ctrl: true, shift: true, alt: false, meta: false, key: "k" },
  };

  let enabled = false;
  let unlockCombo = DEFAULTS.unlockCombo;

  // Events we intercept while Cat Mode is on. Pointer/touch/wheel need a
  // non-passive listener so preventDefault() actually works.
  const PASSIVE_FALSE = new Set(["wheel", "touchstart", "touchmove", "touchend"]);
  const BLOCKED_EVENTS = [
    "keydown", "keyup", "keypress", "beforeinput",
    "pointerdown", "pointerup", "mousedown", "mouseup",
    "click", "dblclick", "auxclick", "contextmenu", "wheel",
    "touchstart", "touchend", "touchmove",
  ];

  const isTopFrame = (() => {
    try { return window.top === window; } catch (_) { return false; }
  })();

  function comboMatches(e) {
    if (!unlockCombo || !unlockCombo.key) return false;
    const key = (e.key || "").toLowerCase();
    return (
      e.ctrlKey === !!unlockCombo.ctrl &&
      e.shiftKey === !!unlockCombo.shift &&
      e.altKey === !!unlockCombo.alt &&
      e.metaKey === !!unlockCombo.meta &&
      key === unlockCombo.key.toLowerCase()
    );
  }

  function swallow(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
  }

  function handler(e) {
    if (!enabled) return;

    // The unlock shortcut is the one thing allowed through — it disables Cat Mode.
    if (e.type === "keydown" && comboMatches(e)) {
      swallow(e);
      pulseBanner(true);
      // Persist the new state; the storage listener flips `enabled` everywhere.
      chrome.storage.local.set({ catModeEnabled: false });
      return;
    }

    swallow(e);
    pulseBanner(false);
  }

  function attach() {
    for (const type of BLOCKED_EVENTS) {
      window.addEventListener(type, handler, {
        capture: true,
        passive: PASSIVE_FALSE.has(type) ? false : undefined,
      });
    }
  }

  // ---- On-screen banner (top frame only) -----------------------------------

  let banner = null;
  let pulseTimer = null;

  function comboLabel() {
    const c = unlockCombo || {};
    const parts = [];
    if (c.ctrl) parts.push("Ctrl");
    if (c.meta) parts.push("⌘");
    if (c.alt) parts.push("Alt");
    if (c.shift) parts.push("Shift");
    if (c.key) parts.push(c.key.length === 1 ? c.key.toUpperCase() : c.key);
    return parts.join(" + ") || "(not set)";
  }

  function ensureBanner() {
    if (!isTopFrame || banner) return;
    banner = document.createElement("div");
    banner.id = "__catmode_banner__";
    banner.setAttribute("role", "status");
    Object.assign(banner.style, {
      position: "fixed",
      top: "16px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "2147483647",
      background: "rgba(20,20,24,0.92)",
      color: "#fff",
      font: "600 13px/1.4 -apple-system, system-ui, sans-serif",
      padding: "10px 16px",
      borderRadius: "999px",
      boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
      pointerEvents: "none",
      transition: "transform .15s ease, opacity .15s ease",
      whiteSpace: "nowrap",
    });
    (document.body || document.documentElement).appendChild(banner);
  }

  function renderBanner() {
    if (!isTopFrame) return;
    if (enabled) {
      ensureBanner();
      if (banner) {
        banner.textContent = `🐾 Cat Mode ON — press ${comboLabel()} to unlock`;
        banner.style.display = "block";
        banner.style.opacity = "1";
      }
    } else if (banner) {
      banner.style.display = "none";
    }
  }

  // Briefly nudge the banner so the user sees a blocked input was caught.
  function pulseBanner(unlocking) {
    if (!isTopFrame || !banner || !enabled) return;
    banner.style.transform = "translateX(-50%) scale(1.06)";
    banner.style.background = unlocking ? "rgba(34,160,90,0.95)" : "rgba(200,60,60,0.95)";
    clearTimeout(pulseTimer);
    pulseTimer = setTimeout(() => {
      if (!banner) return;
      banner.style.transform = "translateX(-50%) scale(1)";
      banner.style.background = "rgba(20,20,24,0.92)";
    }, 180);
  }

  // ---- State sync ----------------------------------------------------------

  function applyState(state) {
    enabled = !!state.catModeEnabled;
    if (state.unlockCombo) unlockCombo = state.unlockCombo;
    renderBanner();
  }

  chrome.storage.local.get(DEFAULTS, applyState);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if ("catModeEnabled" in changes) enabled = !!changes.catModeEnabled.newValue;
    if ("unlockCombo" in changes && changes.unlockCombo.newValue) {
      unlockCombo = changes.unlockCombo.newValue;
    }
    renderBanner();
  });

  attach();
})();
