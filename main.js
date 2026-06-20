const { app, BrowserWindow, globalShortcut, ipcMain, clipboard, nativeImage, dialog, screen, Tray, Menu, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// Default Settings
const DEFAULT_SETTINGS = {
  shortcut: 'Ctrl+Shift+S',
  defaultAction: 'editor', // 'editor' | 'clipboard' | 'save'
  saveFolder: path.join(app.getPath('pictures'), 'Feathershot'),
  imageFormat: 'png', // 'png' | 'jpeg'
  fileNamePattern: 'Screenshot_{yyyy}-{mm}-{dd}_{hh}-{mm}-{ss}',
  alwaysMaximized: false
};

let settings = { ...DEFAULT_SETTINGS };
const settingsPath = path.join(app.getPath('userData'), 'config.json');

// Load Settings
function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      settings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } else {
      saveSettings(settings);
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

// Save Settings
function saveSettings(newSettings) {
  try {
    settings = { ...settings, ...newSettings };
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    
    // Create save folder if it doesn't exist
    if (!fs.existsSync(settings.saveFolder)) {
      fs.mkdirSync(settings.saveFolder, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

// App Windows
let cropperWindow = null;
let editorWindow = null;
let settingsWindow = null;
let tray = null;

// App Icon Path (main.png as requested)
const APP_ICON_PATH = path.join(__dirname, 'main.png');

// Create system tray
function createTray() {
  const icon = nativeImage.createFromPath(APP_ICON_PATH);
  tray = new Tray(icon);
  tray.setToolTip('Feathershot');
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Capture Region', click: () => triggerScreenCapture() },
    { label: 'Capture Fullscreen', click: () => captureFullscreenDirectly() },
    { type: 'separator' },
    { label: 'Settings', click: () => openSettingsWindow() },
    { label: 'Quit', click: () => app.quit() }
  ]);
  
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    triggerScreenCapture();
  });
}

// Global hotkeys register
function registerShortcuts() {
  globalShortcut.unregisterAll();
  
  // Register screen capture shortcut
  let shortcutString = settings.shortcut;
  if (shortcutString === 'PrintScreen') {
    shortcutString = 'PrintScreen';
  }
  
  try {
    const registered = globalShortcut.register(shortcutString, () => {
      triggerScreenCapture();
    });
    if (!registered) {
      console.warn(`Failed to register global shortcut: ${shortcutString}`);
    }
  } catch (err) {
    console.error('Shortcut registration error:', err);
  }
}

// Generate file name based on pattern
function generateFileName() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  
  const mapping = {
    '{yyyy}': now.getFullYear(),
    '{mm}': pad(now.getMonth() + 1),
    '{dd}': pad(now.getDate()),
    '{hh}': pad(now.getHours()),
    '{mm}': pad(now.getMinutes()), // Note: re-defined below for convenience
    '{ss}': pad(now.getSeconds())
  };
  
  let name = settings.fileNamePattern;
  name = name.replace('{yyyy}', now.getFullYear());
  name = name.replace('{mm}', pad(now.getMonth() + 1));
  name = name.replace('{dd}', pad(now.getDate()));
  name = name.replace('{hh}', pad(now.getHours()));
  name = name.replace('{ss}', pad(now.getSeconds()));
  
  // Handle minute replacement carefully (since it shares 'mm' with month, standard template uses {min} or similar, let's fix it by parsing both)
  // Let's replace '{min}' or support '{mm}' contextually if user uses it. Let's replace '{min}' or '{min}' with pad(now.getMinutes())
  name = name.replace('{min}', pad(now.getMinutes()));
  // If the user used {mm} twice, we replace the second instance or we can just support both. Let's make sure it handles {mm} in time:
  // Usually users use {mm} for month and {MM} or {min} for minute. Let's support:
  // {yyyy} - Year
  // {month} - Month
  // {day} - Day
  // {hour} - Hour
  // {min} - Minute
  // {sec} - Second
  // Let's replace standard ones:
  name = name.replace('{month}', pad(now.getMonth() + 1));
  name = name.replace('{day}', pad(now.getDate()));
  name = name.replace('{hour}', pad(now.getHours()));
  name = name.replace('{sec}', pad(now.getSeconds()));
  
  // Also clean up any characters not allowed in file names
  name = name.replace(/[\\/:*?"<>|]/g, '_');
  
  return `${name}.${settings.imageFormat}`;
}

// Screenshot using desktopCapturer
async function captureScreen() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;
  const scaleFactor = primaryDisplay.scaleFactor;
  
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: {
      width: Math.round(width * scaleFactor),
      height: Math.round(height * scaleFactor)
    }
  });
  
  if (sources.length > 0) {
    return sources[0].thumbnail.toDataURL();
  }
  throw new Error('No screen source found');
}

// Capture full screen directly without cropping
async function captureFullscreenDirectly() {
  try {
    const dataUrl = await captureScreen();
    handleScreenshotResult(dataUrl);
  } catch (err) {
    console.error('Fullscreen capture failed:', err);
  }
}

// Trigger area screen capture workflow
async function triggerScreenCapture() {
  try {
    // Hide the editor and settings windows briefly so they don't appear in the screenshot
    const wasEditorVisible = editorWindow && !editorWindow.isDestroyed() && editorWindow.isVisible();
    const wasSettingsVisible = settingsWindow && !settingsWindow.isDestroyed() && settingsWindow.isVisible();
    
    if (wasEditorVisible) editorWindow.hide();
    if (wasSettingsVisible) settingsWindow.hide();
    
    // Wait a brief moment for the windows to fully hide
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const screenshotDataUrl = await captureScreen();
    
    // Restore windows
    if (wasEditorVisible) editorWindow.show();
    if (wasSettingsVisible) settingsWindow.show();
    
    createCropperWindow(screenshotDataUrl);
  } catch (err) {
    console.error('Failed to trigger capture:', err);
  }
}

// Handle final cropped/full screenshot based on settings
function handleScreenshotResult(dataUrl, width, height) {
  if (settings.defaultAction === 'editor') {
    openEditorWindow(dataUrl, width, height);
  } else if (settings.defaultAction === 'clipboard') {
    const img = nativeImage.createFromDataURL(dataUrl);
    clipboard.writeImage(img);
    // Show a native notification
    dialog.showMessageBox({
      type: 'info',
      title: 'Feathershot',
      message: 'Screenshot copied to clipboard!',
      buttons: ['OK']
    });
  } else if (settings.defaultAction === 'save') {
    const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
    const fileName = generateFileName();
    const savePath = path.join(settings.saveFolder, fileName);
    
    fs.writeFileSync(savePath, buffer);
    dialog.showMessageBox({
      type: 'info',
      title: 'Feathershot',
      message: `Screenshot saved directly to:\n${savePath}`,
      buttons: ['OK']
    });
  }
}

// Cropper Window creation
function createCropperWindow(screenshotDataUrl) {
  if (cropperWindow) {
    cropperWindow.close();
  }
  
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.bounds;
  
  cropperWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    fullscreen: true,
    enableLargerThanScreen: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false
    }
  });
  
  cropperWindow.loadFile('cropper.html');
  
  cropperWindow.webContents.on('did-finish-load', () => {
    cropperWindow.webContents.send('capture-image', screenshotDataUrl);
  });
  
  cropperWindow.on('closed', () => {
    cropperWindow = null;
  });
}

// Editor Window creation
function openEditorWindow(dataUrl, width, height) {
  if (editorWindow && !editorWindow.isDestroyed()) {
    editorWindow.focus();
    editorWindow.webContents.send('open-image', dataUrl);
    return;
  }
  
  // Calculate window dimensions dynamically to fit cropped screenshot
  const sidebarWidth = 220;
  const titlebarHeight = 48;
  const statusbarHeight = 28;
  const padding = 64; // Workspace margin spacing
  
  let winWidth = (width || 1000) + sidebarWidth + padding;
  let winHeight = (height || 650) + titlebarHeight + statusbarHeight + padding;
  
  const primaryDisplay = screen.getPrimaryDisplay();
  const displayWidth = primaryDisplay.workArea.width;
  const displayHeight = primaryDisplay.workArea.height;
  
  let maximize = settings.alwaysMaximized || false;
  
  // If window size bounds exceed screen bounds, scale down window size
  if (winWidth >= displayWidth || winHeight >= displayHeight) {
    winWidth = Math.min(winWidth, displayWidth - 40);
    winHeight = Math.min(winHeight, displayHeight - 40);
    if ((width && width > displayWidth * 0.8) || (height && height > displayHeight * 0.8)) {
      maximize = true;
    }
  }
  
  const icon = nativeImage.createFromPath(APP_ICON_PATH);
  
  editorWindow = new BrowserWindow({
    width: Math.round(winWidth),
    height: Math.round(winHeight),
    minWidth: 800,
    minHeight: 600,
    icon: icon,
    frame: false, // Frameless window for beautiful custom title bar
    show: false,
    backgroundColor: '#121214',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false
    }
  });
  
  editorWindow.loadFile('editor.html');
  
  editorWindow.once('ready-to-show', () => {
    if (maximize) {
      editorWindow.maximize();
    }
    editorWindow.show();
    editorWindow.webContents.send('open-image', dataUrl);
  });
  
  editorWindow.on('closed', () => {
    editorWindow = null;
  });
}

function openSettingsWindow() {
  const icon = nativeImage.createFromPath(APP_ICON_PATH);

  settingsWindow = new BrowserWindow({
    width: 550,
    height: 650,
    resizable: false,
    icon: icon,
    frame: false, // Frameless for a premium styled view
    show: false,
    backgroundColor: '#121214',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false
    }
  });
  
  settingsWindow.loadFile('settings.html');
  
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });
  
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// Block DevTools keyboard shortcuts globally
function blockDevTools(win) {
  win.webContents.on('before-input-event', (event, input) => {
    // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
    if (input.key === 'F12') {
      event.preventDefault();
    }
    if (input.control && input.shift && (input.key === 'I' || input.key === 'i' || input.key === 'J' || input.key === 'j' || input.key === 'C' || input.key === 'c')) {
      event.preventDefault();
    }
  });
}

// Auto-Updater Setup
function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
  });
  
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    // Show notification to user
    const allWindows = BrowserWindow.getAllWindows();
    const parentWin = allWindows.length > 0 ? allWindows[0] : null;
    dialog.showMessageBox(parentWin, {
      type: 'info',
      title: 'Feathershot - Update',
      message: `Nova versão ${info.version} baixada!`,
      detail: 'A atualização será instalada automaticamente ao fechar o aplicativo. Deseja reiniciar agora?',
      buttons: ['Reiniciar Agora', 'Depois'],
      defaultId: 0
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
  
  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
  });
  
  // Check for updates
  autoUpdater.checkForUpdatesAndNotify().catch(err => {
    console.log('Update check skipped (dev mode or no internet):', err.message);
  });
}

// Electron Application Lifecycle
app.whenReady().then(() => {
  loadSettings();
  createTray();
  registerShortcuts();
  openSettingsWindow();
  
  // Setup auto-updater (only works in packaged app)
  if (app.isPackaged) {
    setupAutoUpdater();
  }
  
  // Disable hardware acceleration warning / configure window events
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      openSettingsWindow();
    }
  });
  
  // Block devtools on all new windows
  app.on('browser-window-created', (event, win) => {
    blockDevTools(win);
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // Keep the app running in the system tray
  // (Standard behavior for Greenshot-like tools)
});

// IPC handlers
ipcMain.on('window-control', (event, action) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  
  if (action === 'close') {
    win.close();
  } else if (action === 'minimize') {
    win.minimize();
  } else if (action === 'maximize') {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('crop-completed', (event, croppedDataUrl, width, height) => {
  if (cropperWindow) {
    cropperWindow.close();
  }
  handleScreenshotResult(croppedDataUrl, width, height);
});

ipcMain.on('cancel-crop', () => {
  if (cropperWindow) {
    cropperWindow.close();
  }
});

ipcMain.on('close-editor', () => {
  if (editorWindow) {
    editorWindow.close();
  }
});

ipcMain.handle('copy-to-clipboard', async (event, dataUrl) => {
  try {
    const img = nativeImage.createFromDataURL(dataUrl);
    clipboard.writeImage(img);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
});

ipcMain.handle('save-to-disk', async (event, dataUrl, defaultName) => {
  try {
    const name = defaultName || generateFileName();
    const defaultPath = path.join(settings.saveFolder, name);
    
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath,
      filters: [
        { name: settings.imageFormat === 'png' ? 'PNG Image' : 'JPEG Image', extensions: [settings.imageFormat] }
      ]
    });
    
    if (canceled || !filePath) return false;
    
    const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
    fs.writeFileSync(filePath, buffer);
    return true;
  } catch (err) {
    console.error('Failed to save screenshot:', err);
    return false;
  }
});

ipcMain.handle('get-settings', () => {
  return settings;
});

ipcMain.handle('save-settings', (event, newSettings) => {
  saveSettings(newSettings);
  registerShortcuts(); // Re-register shortcut if it changed
  
  // Notify other windows of settings change
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send('settings-changed', settings);
    }
  });
  
  return settings;
});

ipcMain.handle('select-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: settings.saveFolder
  });
  
  if (canceled || filePaths.length === 0) return null;
  return filePaths[0];
});

ipcMain.handle('save-to-desktop', async (event, dataUrl) => {
  try {
    const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
    const fileName = generateFileName();
    const savePath = path.join(app.getPath('desktop'), fileName);
    fs.writeFileSync(savePath, buffer);
    return true;
  } catch (err) {
    console.error('Failed to save to desktop:', err);
    return false;
  }
});

ipcMain.on('print-image', (event, dataUrl) => {
  let printWindow = new BrowserWindow({ show: false });
  printWindow.loadURL(`data:text/html,<html><body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;"><img src="${dataUrl}" style="max-width:100%;max-height:100%;object-fit:contain;"/></body></html>`);
  printWindow.webContents.on('did-finish-load', () => {
    printWindow.webContents.print({ silent: false, printBackground: true }, (success, failureReason) => {
      printWindow.close();
    });
  });
});
