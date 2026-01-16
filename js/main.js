/* ========== PURRMATCHR MAIN JS ========== */

const elements = {
  themeToggle: document.getElementById("theme-toggle")
};

const STORAGE_KEYS = {
  THEME_MODE: "purrmatchr-theme-mode"
};

const THEME_MODES = ["light", "dark", "system"];

// ----- Theme Management -----

/**
 * Get the system's preferred color scheme
 * @returns {string} "dark" or "light"
 */
function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Apply the actual theme (light/dark) to the document
 * @param {string} theme - "light" or "dark"
 */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * Set the theme mode and apply the appropriate theme
 * @param {string} mode - "light", "dark", or "system"
 */
function setThemeMode(mode) {
  document.documentElement.setAttribute("data-theme-mode", mode);
  localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);

  if (mode === "system") {
    applyTheme(getSystemTheme());
  } else {
    applyTheme(mode);
  }
}

/**
 * Toggle to the next theme mode in the cycle: light → dark → system → light
 */
function toggleTheme() {
  const currentMode = document.documentElement.getAttribute("data-theme-mode");
  const currentIndex = THEME_MODES.indexOf(currentMode);
  const nextIndex = (currentIndex + 1) % THEME_MODES.length;
  setThemeMode(THEME_MODES[nextIndex]);
}

/**
 * Initialize theme based on saved preference or default to system
 */
function initTheme() {
  const savedMode = localStorage.getItem(STORAGE_KEYS.THEME_MODE);

  if (savedMode && THEME_MODES.includes(savedMode)) {
    setThemeMode(savedMode);
  } else {
    setThemeMode("system");
  }
}

// ----- Init Event Listeners -----
/**
 * Initialize all event listeners
 */
function initEventListeners() {
  elements.themeToggle.addEventListener("click", toggleTheme);

  // Listen for system theme changes (only affects when in system mode)
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const currentMode = document.documentElement.getAttribute("data-theme-mode");
    if (currentMode === "system") {
      applyTheme(getSystemTheme());
    }
  });
}

// ----- Init App -----
/**
 * Initialize the application
 */
function init() {
  initTheme();
  initEventListeners();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
