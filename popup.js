const statusDiv = document.getElementById('status');
const fillButton = document.getElementById('fillButton');
const clearButton = document.getElementById('clearButton');
const settingsBtn = document.getElementById('settingsBtn');
const generatedModeBtn = document.getElementById('generatedModeBtn');
const storedModeBtn = document.getElementById('storedModeBtn');

let useStoredData = false;

// Load user preference on popup open
document.addEventListener('DOMContentLoaded', () => {
  loadUserPreference();
});

function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  
  if (type !== 'error') {
    setTimeout(() => {
      statusDiv.className = 'status';
    }, 3000);
  }
}

// Open settings page
settingsBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});

// Mode switcher
generatedModeBtn.addEventListener('click', () => {
  useStoredData = false;
  updateModeUI();
  chrome.storage.local.set({ useStoredData: false });
});

storedModeBtn.addEventListener('click', () => {
  useStoredData = true;
  updateModeUI();
  chrome.storage.local.set({ useStoredData: true });
});

function updateModeUI() {
  if (useStoredData) {
    generatedModeBtn.classList.remove('active');
    storedModeBtn.classList.add('active');
  } else {
    generatedModeBtn.classList.add('active');
    storedModeBtn.classList.remove('active');
  }
}

function loadUserPreference() {
  chrome.storage.local.get(['useStoredData'], (result) => {
    useStoredData = result.useStoredData || false;
    updateModeUI();
  });
}

fillButton.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(
      tab.id,
      { action: 'fillForm', useStoredData: useStoredData },
      (response) => {
        if (!response) {
          showStatus('❌ Could not reach page', 'error');
          return;
        }
        
        if (response.success) {
          showStatus(`✅ Filled ${response.count} fields!`, 'success');
        } else {
          showStatus('❌ No form fields found', 'error');
        }
      }
    );
  } catch (error) {
    showStatus('❌ Error: ' + error.message, 'error');
  }
});

clearButton.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(
      tab.id,
      { action: 'clearForm' },
      (response) => {
        if (!response) {
          showStatus('❌ Could not reach page', 'error');
          return;
        }
        
        if (response.success) {
          showStatus(`✅ Cleared ${response.count} fields!`, 'success');
        } else {
          showStatus('❌ No form fields found', 'error');
        }
      }
    );
  } catch (error) {
    showStatus('❌ Error: ' + error.message, 'error');
  }
});
