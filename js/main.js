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
  progressSteps: document.querySelectorAll(".progress-step"),

  // Textareas w/ char counts
  whyAdoptTextarea: document.getElementById("why-adopt"),
  whyAdoptCount: document.getElementById("why-adopt-count"),
  additionalInfoTextarea: document.getElementById("additional-info"),
  additionalInfoCount: document.getElementById("additional-info-count"),

  // Success
  successMsg: document.getElementById("success-message"),
  restartBtn: document.getElementById("restart-btn"),

  // Reset Modal
  resetBtn: document.getElementById("reset-btn"),
  resetModal: document.getElementById("reset-modal"),
  modalCancel: document.getElementById("modal-cancel"),
  modalConfirm: document.getElementById("modal-confirm")
};

const state = {
  currStep: 1,
  totalSteps: 4,
  formData: {}
};

const STORAGE_KEYS = {
  THEME_MODE: "purrmatchr-theme-mode",
  FORM_DATA: "purrmatchr-form-data",
  CURRENT_STEP: "purrmatchr-current-step"
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
  updateProgressStepsClickable();
  localStorage.setItem(STORAGE_KEYS.CURRENT_STEP, stepNumber.toString());
  focusFirstInput(stepNumber);
}


/**
 * Go to the next step (if current step is valid)
 */
function goToNextStep() {
  if (validateCurrentStep()) {
    saveFormData();
    goToStep(state.currStep + 1);
  }
}

/**
 * Go to previous step
 */
function goToPrevStep() {
  saveFormData();
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

/**
 * Handle click on progress step indicators
 * @param {number} targetStep - The step to navigate to
 */
function handleProgressStepClick(targetStep) {
  if (targetStep === state.currStep) return;

  // Allow navigation to completed steps (going back) without validation
  if (targetStep < state.currStep) {
    saveFormData();
    goToStep(targetStep);
    return;
  }

  // Going forward: validate all steps up to and including the current step
  // then allow navigation only to the next incomplete step
  if (validateCurrentStep()) {
    saveFormData();
    // Only allow going one step forward at a time
    if (targetStep === state.currStep + 1) {
      goToStep(targetStep);
    }
  }
}

/**
 * Update clickable state of progress steps
 */
function updateProgressStepsClickable() {
  elements.progressSteps.forEach(step => {
    const stepNum = parseInt(step.dataset.step);

    // Make completed steps and the next available step clickable
    if (stepNum <= state.currStep || stepNum === state.currStep + 1) {
      step.classList.add("clickable");
      step.setAttribute("tabindex", "0");
      step.setAttribute("role", "button");
      step.setAttribute("aria-label", `Go to step ${stepNum}`);
    } else {
      step.classList.remove("clickable");
      step.removeAttribute("tabindex");
      step.removeAttribute("role");
      step.removeAttribute("aria-label");
    }
  });
}

/**
 * Initialize progress step click handlers
 */
function initProgressStepNavigation() {
  elements.progressSteps.forEach(step => {
    step.addEventListener("click", () => {
      if (step.classList.contains("clickable")) {
        handleProgressStepClick(parseInt(step.dataset.step));
      }
    });

    step.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && step.classList.contains("clickable")) {
        e.preventDefault();
        handleProgressStepClick(parseInt(step.dataset.step));
      }
    });
  });

  updateProgressStepsClickable();
}

// ----- Form Validation -----

/**
 * Validate the current step's required fields
 * @returns {boolean} - Whether the step is valid
 */
function validateCurrentStep() {
  const currStepEl = document.querySelector(`.form-step[data-step="${state.currStep}"]`);
  if (!currStepEl) return true;

  const requiredInputs = currStepEl.querySelectorAll("[required]");
  let isValid = true;

  requiredInputs.forEach(input => {
    if (!validateField(input)) isValid = false;
  });

  return isValid;
}

/**
 * Validate a single form field
 * @param {HTMLElement} field - The form field to validate
 * @returns {boolean} - Whether the field is valid
 */
function validateField(field) {
  const errEl = document.getElementById(`${field.id}-error`)
    || document.getElementById(`${field.name}-error`)
    || field.closest(".form-group")?.querySelector(".error-message");
  let isValid = true;
  let errMsg = "";

  // Check if required field is empty
  const isEmpty = field.type === "checkbox" ? !field.checked : !field.value.trim();
  if (field.hasAttribute("required") && isEmpty) {
    isValid = false;
    errMsg = getRequiredErrorMessage(field);
  } 
  // Check specific validation rules
  else if (field.value.trim()) {
    switch (field.type) {
      case "email":
        if (!isValidEmail(field.value)) {
          isValid = false;
          errMsg = "Please enter a valid email address";
        }
        break;
      case "number":
        const min = parseInt(field.min);
        const max = parseInt(field.max);
        const val = parseInt(field.value);
        
        if (isNaN(val)) {
          isValid = false;
          errMsg = "Please enter a valid number";
        } else if (val < min) {
          isValid = false;
          errMsg = `Must be at least ${min}`;
        } else if (val > max) {
          isValid = false;
          errMsg = `Must be no more than ${max}`;
        }

        break;
      case "tel":
        if (field.value && !isValidPhone(field.value)) {
          isValid = false;
          errMsg = "Please enter a valid phone number";
        }
        break;
    }
  }

  // Update field appearance and err message
  if (errEl) errEl.textContent = errMsg;

  if (isValid) {
    field.classList.remove("error");
    if (field.value.trim()) {
      field.classList.add("valid");
    }
  } else {
    field.classList.remove("valid");
    field.classList.add("error");
  }

  return isValid;
}

/**
 * Get the correct error message for a required field
 * @param {HTMLElement} field - The form field
 * @returns {string} - The error message
 */
function getRequiredErrorMessage(field) {
  const fieldName = field.id || field.name;
  
  const messages = {
    "name": "Please enter your name",
    "email": "Please enter your email address",
    "age": "Please enter your age",
    "why-adopt": "Please tell us why you want to adopt",
    "terms": "You must acknowledge this is not a real form or survey"
  };


  return messages[fieldName] || "This field is required";
}

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @return {boolean} - Whether the email is valid 
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 * @param {string} phone - The phone number ot validate
 * @return {boolean} - Whether the phone number is valid
 */
function isValidPhone(phone) {
  const cleanedPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  return /^\+?\d{7,15}$/.test(cleanedPhone);
}

/**
 * Clear validation styling form a field
 * @param {HTMLElement} field - The form field
 */
function clearFieldValidationStyles(field) {
  field.classList.remove("error", "valid");
  const errEl = document.getElementById(`${field.id}-error`) || field.parentElement.querySelector(".error-message");
  if (errEl) errEl.textContent = "";
}

// ----- Textarea Char Counters -----

/**
 * Update char count display for a textarea
 * @param {HTMLTextAreaElement} textarea - The textarea element
 * @param {HTMLElement} countEl - The count display element
 */
function updateCharCount(textarea, countEl) {
  if (!textarea || !countEl) return;

  const currLen = textarea.value.length;
  const maxLen = textarea.getAttribute("maxlength") || 0;
  countEl.textContent = `${currLen} / ${maxLen}`;

  // Warning when approaching the char count limit
  if (currLen >= maxLen * 0.9) {
    countEl.style.color = "var(--color-error)";
  } else {
    countEl.style.color = "";
  }
}

/**
 * Initialize char counters for all textareas
 */
function initCharCounters() {
  if (elements.whyAdoptTextarea && elements.whyAdoptCount) {
    updateCharCount(elements.whyAdoptTextarea, elements.whyAdoptCount);
    elements.whyAdoptTextarea.addEventListener("input", () => {
      updateCharCount(elements.whyAdoptTextarea, elements.whyAdoptCount);
    });
  }

  if (elements.additionalInfoTextarea && elements.additionalInfoCount) {
    updateCharCount(elements.additionalInfoTextarea, elements.additionalInfoCount);
    elements.additionalInfoTextarea.addEventListener("input", () => {
      updateCharCount(elements.additionalInfoTextarea, elements.additionalInfoCount);
    });
  }
}

// ----- Local Storage -----

/**
 * Save current form data to local storage
 */
function saveFormData() {
  const formData = new FormData(elements.form);
  const data = {};

  for (const [key, value] of formData.entries()) {
    if (data[key]) {
      if (Array.isArray(data[key])) {
        data[key].push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
  }

  localStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(data));
  state.formData = data;
}

/**
 * Load saved form data from localStorage
 */
function loadFormData() {
  const savedData = localStorage.getItem(STORAGE_KEYS.FORM_DATA);
  if (!savedData) return;

  try {
    const data = JSON.parse(savedData);
    state.formData = data;

    // Populate form fields
    Object.entries(data).forEach(([key, value]) => {
      const fields = elements.form.querySelectorAll(`[name="${key}"]`);

      fields.forEach((field) => {
        if (field.type === "checkbox") {
          const values = Array.isArray(value) ? value : [value];
          field.checked = values.includes(field.value);
        } else if (field.type === "radio") {
          field.checked = field.value === value;
        } else {
          field.value = value;
        }
      });
    });

    updateCharCount(elements.whyAdoptTextarea, elements.whyAdoptCount);
    updateCharCount(elements.additionalInfoTextarea, elements.additionalInfoCount);
  } catch(err) {
    console.error("Error loading saved form data:", err);
  }
}

/**
 * Load saved step from localStorage
 */
function loadSavedStep() {
  const savedStep = localStorage.getItem(STORAGE_KEYS.CURRENT_STEP);
  if (savedStep) {
    const stepNum = parseInt(savedStep);
    if (stepNum >= 1 && stepNum <= state.totalSteps) {
      state.currStep = stepNum;
    }
  }
}

/**
 * Clear all saved form data from localStorage
 */
function clearSavedData() {
  localStorage.removeItem(STORAGE_KEYS.FORM_DATA);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_STEP);
  state.formData = {};
  state.currStep = 1;
}

// ----- Form Submission -----

/**
 * Handle form submission
 * @param {Event} e - The submit event
 */
function handleSubmit(e) {
  e.preventDefault();
  if (!validateCurrentStep()) return;
  
  saveFormData();
  // Demo success message
  console.log("Form submitted with data:", state.formData);

  showSuccessMessage();
  clearSavedData();
}

/**
 * Show the success message and hide the form
 */
function showSuccessMessage() {
  elements.form.hidden = true;
  document.querySelector(".progress-container").hidden = true;
  elements.successMsg.hidden = false;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Restart the form (for "Submit Another Response" button)
 */
function restartForm() {
  elements.form.reset();

  elements.form.querySelectorAll("input, select, textarea").forEach(field => {
    clearFieldValidationStyles(field);
  });

  updateCharCount(elements.whyAdoptTextarea, elements.whyAdoptCount);
  updateCharCount(elements.additionalInfoTextarea, elements.additionalInfoCount);

  elements.form.hidden = false;
  document.querySelector(".progress-container").hidden = false;
  elements.successMsg.hidden = true;

  goToStep(1);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ----- Reset Modal -----

/**
 * Open the reset confirmation modal
 */
function openResetModal() {
  elements.resetModal.hidden = false;
  elements.modalCancel.focus();
  document.body.style.overflow = "hidden";
}

/**
 * Close the reset confirmation modal
 */
function closeResetModal() {
  elements.resetModal.hidden = true;
  document.body.style.overflow = "";
  elements.resetBtn.focus();
}

/**
 * Confirm form reset from modal
 */
function confirmReset() {
  closeResetModal();
  clearSavedData();
  restartForm();
}

/**
 * Handle clicks on modal overlay (close if clicking outside modal)
 * @param {Event} e - The click event
 */
function handleModalOverlayClick(e) {
  if (e.target === elements.resetModal) {
    closeResetModal();
  }
}

/**
 * Handle Escape key to close modal
 * @param {KeyboardEvent} e - The keyboard event
 */
function handleModalKeydown(e) {
  if (e.key === "Escape" && !elements.resetModal.hidden) {
    closeResetModal();
  }
}

// ----- Keyboard Navigation -----

/**
 * Handle keyboard navigation
 * @param {KeyboardEvent} e - The keyboard event
 */
function handleKeyboardNavigation(e) {
  if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "BUTTON") {
    e.preventDefault();
    if (state.currStep === state.totalSteps) {
      elements.submitBtn.click();
    } else {
      elements.nextBtn.click();
    }
  }
}

// ----- Real-time Validation -----

/**
 * Set up real-time validation on form fields
 */
function initRealTimeValidation() {
  const inputs = elements.form.querySelectorAll("input, select, textarea");

  inputs.forEach(input => {
    input.addEventListener("blur", () => {
      if (input.hasAttribute("required") || input.value.trim()) {
        validateField(input);
      }
    });

    input.addEventListener("input", () => {
      // Track whether field has content for CSS styling
      input.classList.toggle("has-value", !!input.value.trim());

      if (input.classList.contains("error") || input.classList.contains("valid")) {
        clearFieldValidationStyles(input);
      }
    });
  });
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

  elements.form.addEventListener("submit", handleSubmit);
  elements.form.addEventListener("keydown", handleKeyboardNavigation);
  elements.restartBtn.addEventListener("click", restartForm);

  // Reset modal
  elements.resetBtn.addEventListener("click", openResetModal);
  elements.modalCancel.addEventListener("click", closeResetModal);
  elements.modalConfirm.addEventListener("click", confirmReset);
  elements.resetModal.addEventListener("click", handleModalOverlayClick);
  document.addEventListener("keydown", handleModalKeydown);

  window.addEventListener("beforeunload", saveFormData);
}

// ----- Init App -----

/**
 * Initialize the application
 */
function init() {
  initTheme();
  loadFormData();
  loadSavedStep();
  initCharCounters();
  initRealTimeValidation();
  initProgressStepNavigation();
  initEventListeners();
  goToStep(state.currStep);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
