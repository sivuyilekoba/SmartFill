// Settings page - handles saving and loading user data

const settingsForm = document.getElementById('settingsForm');
const closeBtn = document.getElementById('closeBtn');
const statusDiv = document.getElementById('status');

const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');

// Load settings when page opens
document.addEventListener('DOMContentLoaded', loadSettings);

// Save settings on form submit
settingsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  saveSettings();
});

// Close settings page
closeBtn.addEventListener('click', () => {
  window.close();
});

function loadSettings() {
  chrome.storage.local.get(['firstName', 'lastName', 'email', 'phone'], (result) => {
    if (result.firstName) {
      firstNameInput.value = result.firstName;
    }
    if (result.lastName) {
      lastNameInput.value = result.lastName;
    }
    if (result.email) {
      emailInput.value = result.email;
    }
    if (result.phone) {
      phoneInput.value = result.phone;
    }
  });
}

function saveSettings() {
  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();

  // Validate required fields
  if (!firstName) {
    showStatus('First name is required', 'error');
    return;
  }
  if (!lastName) {
    showStatus('Last name is required', 'error');
    return;
  }
  if (!email) {
    showStatus('Email is required', 'error');
    return;
  }

  // Save to Chrome storage
  const dataToSave = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    phone: phone
  };

  chrome.storage.local.set(dataToSave, () => {
    showStatus('✅ Settings saved successfully!', 'success');
    setTimeout(() => {
      window.close();
    }, 1500);
  });
}

function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
}
