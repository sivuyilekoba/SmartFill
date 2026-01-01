const statusDiv = document.getElementById('status');
const fillButton = document.getElementById('fillButton');
const clearButton = document.getElementById('clearButton');

function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  
  if (type !== 'error') {
    setTimeout(() => {
      statusDiv.className = 'status';
    }, 3000);
  }
}

fillButton.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(
      tab.id,
      { action: 'fillForm' },
      (response) => {
        if (chrome.runtime.lastError) {
          showStatus('❌ Could not reach page', 'error');
          return;
        }
        
        if (response && response.success) {
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
        if (chrome.runtime.lastError) {
          showStatus('❌ Could not reach page', 'error');
          return;
        }
        
        if (response && response.success) {
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
