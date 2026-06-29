// MV3 forbids inline scripts, so the welcome page's one button lives here.
document.getElementById("shortcuts-btn").addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});
