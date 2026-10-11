// Settings page - handles saving and loading user data

const settingsForm = document.getElementById('settingsForm');
const closeBtn = document.getElementById('closeBtn');
const deleteBtn = document.getElementById('deleteBtn');
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

// Delete data with confirmation
deleteBtn.addEventListener('click', () => {
  const confirmDelete = confirm('Are you sure you want to delete all your saved data? This action cannot be undone.');
  if (confirmDelete) {
    deleteData();
  }
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

function deleteData() {
  chrome.storage.local.remove(['firstName', 'lastName', 'email', 'phone', 'useStoredData'], () => {
    // Clear form inputs
    firstNameInput.value = '';
    lastNameInput.value = '';
    emailInput.value = '';
    phoneInput.value = '';
    
    showStatus('✅ All data has been deleted successfully!', 'success');
    setTimeout(() => {
      window.close();
    }, 1500);
  });
}

function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
}
