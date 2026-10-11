// Content script - runs on every page and handles form detection/filling

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fillForm') {
    const count = fillForm(request.useStoredData);
    sendResponse({ success: count > 0, count: count });
  } else if (request.action === 'clearForm') {
    const count = clearForm();
    sendResponse({ success: count > 0, count: count });
  }
});

// Detect all form fields on the page
function getFormFields() {
  const fields = [];
  
  // Get all input elements (including checkbox and radio, but excluding buttons and hidden)
  const inputs = document.querySelectorAll('input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="hidden"])');
  inputs.forEach(input => {
    if (!input.disabled && input.offsetParent !== null) {
      fields.push(input);
    }
  });

  // Get all textarea elements
  const textareas = document.querySelectorAll('textarea:not([disabled]):not([readonly])');
  textareas.forEach(textarea => {
    if (textarea.offsetParent !== null) {
      fields.push(textarea);
    }
  });

  // Get all select elements
  const selects = document.querySelectorAll('select:not([disabled])');
  selects.forEach(select => {
    if (select.offsetParent !== null) {
      fields.push(select);
    }
  });

  return fields;
}

// Fill form with random or stored data
function fillForm(useStoredData = false) {
  const fields = getFormFields();
  let filledCount = 0;

  // If using stored data, load it first
  if (useStoredData) {
    chrome.storage.local.get(['firstName', 'lastName', 'email', 'phone'], (storedData) => {
      fillFormWithData(fields, storedData);
    });
    return fields.length;
  } else {
    fillFormWithData(fields, null);
    return fields.length;
  }
}

function fillFormWithData(fields, storedData) {
  fields.forEach(field => {
    let value = '';

    if (field.type === 'checkbox') {
      // Randomly check or uncheck checkbox
      field.checked = DataGenerator.generateCheckbox();
    } else if (field.type === 'radio') {
      // For radio buttons with the same name, pick a random one to check
      const radioGroup = document.querySelectorAll(`input[type="radio"][name="${field.name}"]`);
      if (radioGroup.length > 0) {
        const randomIndex = Math.floor(Math.random() * radioGroup.length);
        radioGroup.forEach(radio => {
          radio.checked = radio === radioGroup[randomIndex];
          radio.dispatchEvent(new Event('change', { bubbles: true }));
          radio.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }
    } else if (field.tagName === 'SELECT') {
      // For select elements, pick a random option
      const options = field.querySelectorAll('option');
      if (options.length > 1) {
        // Skip the first option if it's a placeholder (usually empty)
        const startIndex = options[0].value === '' ? 1 : 0;
        if (options.length > startIndex) {
          const randomIndex = startIndex + Math.floor(Math.random() * (options.length - startIndex));
          value = options[randomIndex].value;
          field.value = value;
        }
      }
    } else {
      // For input and textarea elements
      value = DataGenerator.generateForField(field, storedData);
      field.value = value;
    }

    // Dispatch change and input events to trigger form library listeners
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('blur', { bubbles: true }));
  });
}

// Clear all form fields
function clearForm() {
  const fields = getFormFields();
  let clearedCount = 0;

  fields.forEach(field => {
    if (field.type === 'checkbox' || field.type === 'radio') {
      field.checked = false;
    } else if (field.tagName === 'SELECT') {
      field.value = '';
    } else {
      field.value = '';
    }

    // Dispatch change and input events
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('blur', { bubbles: true }));
    
    clearedCount++;
  });

  return clearedCount;
}
