/* ========== PURRMATCHR MAIN JS ========== */

const elements = {
  // Theme
  themeToggle: document.getElementById("theme-toggle"),

  // Form
  form: document.getElementById("survey-form"),
  formSteps: document.querySelectorAll(".form-step"),

  // Nav
  prevBtn: document.getElementById("prev-btn"),
  nextBtn: document.getElementById("next-btn"),
  submitBtn: document.getElementById("submit"),
  formNav: document.querySelector(".form-navigation"),

  // Progress
  progressFill: document.querySelector(".progress-fill"),
  progressSteps: document.querySelectorAll(".progress-step")
};

const state = {
  currStep: 1,
  totalSteps: 4
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

// ----- Navigation -----

/**
 * Navigate to a specific step
 * @param {number} stepNumber - The step to navigate to (1-4)
 */
function goToStep(stepNumber) {
  if (stepNumber < 1 || stepNumber > state.totalSteps) return;

  state.currStep = stepNumber;

  elements.formSteps.forEach(step => {
    step.classList.remove("active");
    if (parseInt(step.dataset.step) === stepNumber) {
      step.classList.add("active");
    }
  });

  updateProgressIndicator();
  updateNavigationButtons();
  focusFirstInput(stepNumber);
}


/**
 * Go to the next step
 */
function goToNextStep() {
  goToStep(state.currStep + 1);
}

/**
 * Go to previous step
 */
function goToPrevStep() {
  goToStep(state.currStep - 1);
}

/**
 * Update progress bar and step indicators
 */
function updateProgressIndicator() {
  const progressPercentage = (state.currStep / state.totalSteps) * 100;
  elements.progressFill.style.width = `${progressPercentage}%`;

  elements.progressSteps.forEach(step => {
    const stepNum = parseInt(step.dataset.step);
    step.classList.remove("active", "completed");

    if (stepNum === state.currStep) {
      step.classList.add("active");
    } else if (stepNum < state.currStep) {
      step.classList.add("completed");
    }
  }); 
}

/**
 * Update navigation button states
 */
function updateNavigationButtons() {
  elements.prevBtn.disabled = state.currStep === 1;
  
  if (state.currStep === state.totalSteps) {
    elements.formNav.classList.add("last-step");
  } else {
    elements.formNav.classList.remove("last-step");
  }
}

/**
 * Focus the first input in the specified step
 * @param {number} stepNumber - The step number
 */
function focusFirstInput(stepNumber) {
  const stepEl = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
  if (!stepEl) return;

  const firstInput = stepEl.querySelector("input, select, textarea");
  if (firstInput) {
    // Delay for CSS transition
    setTimeout(() => {
      firstInput.focus();
    }, 300);
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

  elements.prevBtn.addEventListener("click", goToPrevStep);
  elements.nextBtn.addEventListener("click", goToNextStep);
}

// ----- Init App -----

/**
 * Initialize the application
 */
function init() {
  initTheme();
  initEventListeners();
  goToStep(state.currStep);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
