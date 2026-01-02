const statusDiv = document.getElementById('status');
const fillDummyButton = document.getElementById('fillDummyButton');
const fillStoredButton = document.getElementById('fillStoredButton');
const clearButton = document.getElementById('clearButton');
const settingsBtn = document.getElementById('settingsBtn');

function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  
  if (type !== 'error') {
    setTimeout(() => {
      statusDiv.className = 'status';
    }, 3000);
  }
}

function showStatusWithAction(message, type = 'info', actionText = '', actionCallback = null) {
  statusDiv.innerHTML = message;
  statusDiv.className = `status ${type}`;
  
  if (actionCallback && actionText) {
    const actionBtn = document.createElement('button');
    actionBtn.textContent = actionText;
    actionBtn.style.marginLeft = '8px';
    actionBtn.style.padding = '4px 12px';
    actionBtn.style.fontSize = '12px';
    actionBtn.style.border = 'none';
    actionBtn.style.borderRadius = '4px';
    actionBtn.style.cursor = 'pointer';
    actionBtn.style.fontWeight = '600';
    
    if (type === 'error') {
      actionBtn.style.background = 'rgba(255, 255, 255, 0.3)';
      actionBtn.style.color = '#991b1b';
    } else {
      actionBtn.style.background = 'rgba(255, 255, 255, 0.3)';
      actionBtn.style.color = '#065f46';
    }
    
    actionBtn.addEventListener('click', actionCallback);
    statusDiv.appendChild(actionBtn);
  }
  
  if (type !== 'error') {
    setTimeout(() => {
      statusDiv.className = 'status';
    }, 5000);
  }
}

// Check if stored data exists
function hasStoredData(callback) {
  chrome.storage.local.get(['firstName', 'lastName', 'email'], (result) => {
    const hasData = result.firstName && result.lastName && result.email;
    callback(hasData);
  });
}

// Open settings page
settingsBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});

// Fill with dummy data
fillDummyButton.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(
      tab.id,
      { action: 'fillForm', useStoredData: false },
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

// Fill with stored data
fillStoredButton.addEventListener('click', async () => {
  // Check if stored data exists first
  hasStoredData((hasData) => {
    if (!hasData) {
      showStatusWithAction(
        '❌ No stored data found. Please save your information in settings first.',
        'error',
        'Open Settings',
        () => {
          chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
        }
      );
      return;
    }

    // If stored data exists, proceed with filling
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      try {
        const tab = tabs[0];
        
        chrome.tabs.sendMessage(
          tab.id,
          { action: 'fillForm', useStoredData: true },
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
  });
});

// Clear form
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
