// Elements
const winClose = document.getElementById('win-close');
const hotkeyInput = document.getElementById('hotkey-input');
const recordBtn = document.getElementById('btn-record-hotkey');
const printScreenBtn = document.getElementById('btn-set-printscreen');
const toggleMaximized = document.getElementById('toggle-maximized');
const folderInput = document.getElementById('folder-input');
const browseBtn = document.getElementById('btn-browse-folder');
const filenamePatternInput = document.getElementById('filename-pattern');
const formatSelect = document.getElementById('format-select');
const btnSave = document.getElementById('btn-save-settings');
const btnCancel = document.getElementById('btn-cancel-settings');

let currentSettings = {};
let isRecordingHotkey = false;

// Initialize Settings
async function initSettings() {
  currentSettings = await window.api.getSettings();
  
  // Populate default actions radio
  const radio = document.querySelector(`input[name="default-action"][value="${currentSettings.defaultAction}"]`);
  if (radio) {
    radio.checked = true;
  }
  
  // Populate inputs
  hotkeyInput.value = currentSettings.shortcut;
  folderInput.value = currentSettings.saveFolder;
  filenamePatternInput.value = currentSettings.fileNamePattern;
  formatSelect.value = currentSettings.imageFormat;
  
  // Populate toggle
  toggleMaximized.checked = currentSettings.alwaysMaximized || false;
}

// Window Controls
winClose.addEventListener('click', () => window.api.closeWindow());
btnCancel.addEventListener('click', () => window.api.closeWindow());

// Browse Folder
browseBtn.addEventListener('click', async () => {
  const selectedPath = await window.api.selectFolder();
  if (selectedPath) {
    folderInput.value = selectedPath;
  }
});

// Set PrintScreen directly
printScreenBtn.addEventListener('click', () => {
  // Cancel any ongoing recording
  if (isRecordingHotkey) {
    isRecordingHotkey = false;
    recordBtn.textContent = 'Change Hotkey';
    hotkeyInput.classList.remove('recording');
  }
  
  hotkeyInput.value = 'PrintScreen';
  currentSettings.shortcut = 'PrintScreen';
  
  // Visual feedback
  printScreenBtn.style.backgroundColor = 'rgba(19, 190, 158, 0.2)';
  setTimeout(() => {
    printScreenBtn.style.backgroundColor = '';
  }, 400);
});

// Record Hotkey
recordBtn.addEventListener('click', () => {
  isRecordingHotkey = !isRecordingHotkey;
  if (isRecordingHotkey) {
    recordBtn.textContent = 'Cancel...';
    hotkeyInput.value = 'Press key combo...';
    hotkeyInput.classList.add('recording');
  } else {
    recordBtn.textContent = 'Change Hotkey';
    hotkeyInput.value = currentSettings.shortcut;
    hotkeyInput.classList.remove('recording');
  }
});

hotkeyInput.addEventListener('click', () => recordBtn.click());

window.addEventListener('keydown', (e) => {
  if (!isRecordingHotkey) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  if (e.key === 'Escape') {
    isRecordingHotkey = false;
    recordBtn.textContent = 'Change Hotkey';
    hotkeyInput.value = currentSettings.shortcut;
    hotkeyInput.classList.remove('recording');
    return;
  }
  
  const keys = [];
  if (e.ctrlKey) keys.push('Ctrl');
  if (e.shiftKey) keys.push('Shift');
  if (e.altKey) keys.push('Alt');
  
  const keyName = e.key;
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(keyName)) {
    // Just modifiers pressed, wait for base key
    return;
  }
  
  let baseKey = keyName;
  if (keyName === ' ') baseKey = 'Space';
  else if (keyName === 'ArrowUp') baseKey = 'Up';
  else if (keyName === 'ArrowDown') baseKey = 'Down';
  else if (keyName === 'ArrowLeft') baseKey = 'Left';
  else if (keyName === 'ArrowRight') baseKey = 'Right';
  else if (keyName === 'PrintScreen' || keyName === 'Snapshot') baseKey = 'PrintScreen';
  else if (keyName === 'PageUp') baseKey = 'PageUp';
  else if (keyName === 'PageDown') baseKey = 'PageDown';
  else if (keyName === 'Delete') baseKey = 'Delete';
  else if (keyName === 'Insert') baseKey = 'Insert';
  else if (keyName === 'Home') baseKey = 'Home';
  else if (keyName === 'End') baseKey = 'End';
  else if (keyName.startsWith('F') && keyName.length > 1 && !isNaN(keyName.substring(1))) baseKey = keyName; // F1-F12
  else if (keyName.length === 1) baseKey = keyName.toUpperCase();
  
  // Allow PrintScreen as standalone key, or any special key, or modified key
  const hasModifier = e.ctrlKey || e.shiftKey || e.altKey;
  const isSpecialKey = baseKey.length > 1;
  if (!hasModifier && !isSpecialKey) {
    return; // Ignore single letter keys without modifiers
  }
  
  keys.push(baseKey);
  const shortcutString = keys.join('+');
  
  hotkeyInput.value = shortcutString;
  currentSettings.shortcut = shortcutString;
  isRecordingHotkey = false;
  recordBtn.textContent = 'Change Hotkey';
  hotkeyInput.classList.remove('recording');
});

// Save Settings Action
btnSave.addEventListener('click', async () => {
  const selectedAction = document.querySelector('input[name="default-action"]:checked').value;
  
  const newSettings = {
    shortcut: hotkeyInput.value,
    defaultAction: selectedAction,
    saveFolder: folderInput.value,
    fileNamePattern: filenamePatternInput.value,
    imageFormat: formatSelect.value,
    alwaysMaximized: toggleMaximized.checked
  };
  
  await window.api.saveSettings(newSettings);
  window.api.closeWindow();
});

// Start initialization
initSettings();
