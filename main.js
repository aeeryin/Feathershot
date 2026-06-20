const { app, BrowserWindow, globalShortcut, ipcMain, clipboard, nativeImage, dialog, screen, Tray, Menu, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');
const { autoUpdater } = require('electron-updater');

const IS_WINDOWS = process.platform === 'win32';
const IS_MACOS = process.platform === 'darwin';
const SUPPORTS_LOGIN_ITEMS = IS_WINDOWS || IS_MACOS;
const DEFAULT_SHORTCUT = 'CommandOrControl+Shift+S';

// Default Settings
const DEFAULT_SETTINGS = {
  shortcut: DEFAULT_SHORTCUT,
  defaultAction: 'editor', // 'editor' | 'clipboard' | 'save'
  saveFolder: path.join(app.getPath('pictures'), 'Feathershot'),
  imageFormat: 'png', // 'png' | 'jpeg'
  fileNamePattern: 'Screenshot_{yyyy}-{mm}-{dd}_{hh}-{mm}-{ss}',
  alwaysMaximized: false,
  startAtLogin: false,
  language: 'auto' // 'auto' | 'en' | 'pt'
};

let settings = { ...DEFAULT_SETTINGS };
const settingsPath = path.join(app.getPath('userData'), 'config.json');

// Load Settings
function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      const storedSettings = JSON.parse(data);
      if (storedSettings.startAtLogin === undefined && storedSettings.startWithWindows !== undefined) {
        storedSettings.startAtLogin = storedSettings.startWithWindows;
      }
      delete storedSettings.startWithWindows;
      settings = { ...DEFAULT_SETTINGS, ...storedSettings };
    } else {
      saveSettings(settings);
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

function normalizeSettings(newSettings) {
  const normalized = { ...newSettings };
  if (normalized.startAtLogin === undefined && normalized.startWithWindows !== undefined) {
    normalized.startAtLogin = normalized.startWithWindows;
  }
  delete normalized.startWithWindows;
  return normalized;
}

// Apply auto-launch where Electron supports login items.
function applyAutoLaunch() {
  if (!SUPPORTS_LOGIN_ITEMS) {
    return;
  }

  try {
    const loginSettings = {
      openAtLogin: settings.startAtLogin || false
    };

    if (IS_WINDOWS) {
      loginSettings.path = app.getPath('exe');
    }

    app.setLoginItemSettings(loginSettings);
  } catch (err) {
    console.warn('Failed to apply login item settings:', err.message);
  }
}

// Save Settings
function saveSettings(newSettings) {
  try {
    settings = { ...settings, ...normalizeSettings(newSettings) };
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    
    // Apply auto-launch setting
    applyAutoLaunch();
    
    // Create save folder if it doesn't exist
    if (!fs.existsSync(settings.saveFolder)) {
      fs.mkdirSync(settings.saveFolder, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

// Get Resolved Language (resolves 'auto' using system locale)
function getResolvedLanguage() {
  if (settings.language && settings.language !== 'auto') {
    return settings.language;
  }
  const locale = app.getLocale() || 'en';
  return locale.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

// App Windows
let cropperWindows = [];
let editorWindow = null;
let settingsWindow = null;
let updateWindow = null;
let updateVersion = null;
let tray = null;

// App Icon Path (main.png as requested)
const APP_ICON_PATH = path.join(__dirname, 'main.png');

// Create system tray
function createTray() {
  try {
    const icon = nativeImage.createFromPath(APP_ICON_PATH);
    tray = new Tray(icon);
    tray.setToolTip('Feathershot');
    
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Capture Region', click: () => triggerScreenCapture() },
      { label: 'Capture Fullscreen', click: () => captureFullscreenDirectly() },
      { type: 'separator' },
      { label: 'Check for Updates', click: () => {
        if (app.isPackaged) {
          autoUpdater.checkForUpdatesAndNotify().catch(err => {
            dialog.showErrorBox('Update Check Failed', err.message);
          });
        } else {
          dialog.showMessageBox({
            type: 'info',
            title: 'Feathershot',
            message: 'Auto-update is only active in the packaged/production application.'
          });
        }
      }},
      { label: 'Settings', click: () => openSettingsWindow() },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ]);
    
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      triggerScreenCapture();
    });
  } catch (err) {
    console.error('Failed to create system tray:', err);
  }
}

// Global hotkeys register
function registerShortcuts() {
  globalShortcut.unregisterAll();
  
  // Register screen capture shortcut
  let shortcutString = settings.shortcut || DEFAULT_SHORTCUT;
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
  
  let name = settings.fileNamePattern;
  
  name = name.replace('{yyyy}', now.getFullYear());
  name = name.replace('{mm}', pad(now.getMonth() + 1)); // first {mm} = month
  name = name.replace('{mm}', pad(now.getMinutes()));   // second {mm} = minutes
  name = name.replace('{dd}', pad(now.getDate()));
  name = name.replace('{hh}', pad(now.getHours()));
  name = name.replace('{ss}', pad(now.getSeconds()));
  name = name.replace('{min}', pad(now.getMinutes()));
  name = name.replace('{month}', pad(now.getMonth() + 1));
  name = name.replace('{day}', pad(now.getDate()));
  name = name.replace('{hour}', pad(now.getHours()));
  name = name.replace('{sec}', pad(now.getSeconds()));
  
  // Clean up any characters not allowed in file names
  name = name.replace(/[\\/:*?"<>|]/g, '_');
  
  return `${name}.${settings.imageFormat}`;
}

// Get display where the mouse cursor is located
function getActiveDisplay() {
  const cursorPoint = screen.getCursorScreenPoint();
  return screen.getDisplayNearestPoint(cursorPoint);
}

// Capture screen using PowerShell (native Windows GDI, avoids Electron GPU issues)
function captureScreenViaPowerShell(activeDisplay) {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(os.tmpdir(), `feathershot_${Date.now()}.png`);
    const escapedPath = tmpFile.replace(/\\/g, '\\\\');

    if (!activeDisplay) activeDisplay = getActiveDisplay();
    const { x, y, width, height } = activeDisplay.bounds;

    const script = `Add-Type -AssemblyName System.Drawing,System.Windows.Forms; $b=New-Object System.Drawing.Bitmap(${width},${height}); $g=[System.Drawing.Graphics]::FromImage($b); $g.CopyFromScreen(${x},${y},0,0,New-Object System.Drawing.Size(${width},${height})); $b.Save('${escapedPath}',[System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $b.Dispose();`;

    console.log('[Feathershot] PowerShell: salvando screenshot do display ativo em', tmpFile);
    console.log('[Feathershot] PowerShell script:', script);

    execFile('powershell', ['-STA', '-NoProfile', '-NonInteractive', '-Command', script], { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('[Feathershot] PowerShell ERRO:', error.message);
        if (stderr) console.error('[Feathershot] PowerShell stderr:', stderr);
        return reject(new Error(stderr?.trim() || error.message));
      }
      console.log('[Feathershot] PowerShell executou com sucesso');
      try {
        if (!fs.existsSync(tmpFile)) {
          console.error('[Feathershot] Arquivo de screenshot NÃO foi criado:', tmpFile);
          return reject(new Error('PowerShell não criou o arquivo de screenshot'));
        }
        const data = fs.readFileSync(tmpFile);
        console.log('[Feathershot] Arquivo lido, tamanho:', data.length, 'bytes');
        try { fs.unlinkSync(tmpFile); } catch (_) {}
        resolve(`data:image/png;base64,${data.toString('base64')}`);
      } catch (e) {
        console.error('[Feathershot] Erro ao ler arquivo:', e);
        reject(e);
      }
    });
  });
}

// Screenshot using desktopCapturer (fallback)
async function captureScreenViaDesktopCapturer(activeDisplay) {
  console.log('[Feathershot] Usando desktopCapturer...');

  if (!activeDisplay) activeDisplay = getActiveDisplay();
  const { width, height } = activeDisplay.bounds;
  const scaleFactor = activeDisplay.scaleFactor;

  console.log('[Feathershot] Display ativo:', activeDisplay.id, { width, height, scaleFactor });

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: {
      width: Math.round(width * scaleFactor),
      height: Math.round(height * scaleFactor)
    }
  });

  console.log('[Feathershot] desktopCapturer retornou', sources.length, 'fonte(s)');

  if (sources.length > 0) {
    let source = sources.find(s => s.id === `screen:${activeDisplay.id}`);
    
    if (!source) {
      const displays = screen.getAllDisplays();
      const index = displays.findIndex(d => d.id === activeDisplay.id);
      if (index !== -1 && index < sources.length) {
        source = sources[index];
      } else {
        source = sources[0];
      }
    }
    
    const thumbnail = source.thumbnail;
    console.log('[Feathershot] Thumbnail vazio:', thumbnail.isEmpty(), 'size:', thumbnail.getSize());
    if (!thumbnail.isEmpty()) {
      const url = thumbnail.toDataURL();
      console.log('[Feathershot] toDataURL tamanho:', url.length);
      return url;
    }
    
    // Fallback: try without DPI scaling
    console.log('[Feathershot] Tentando sem DPI scaling...');
    const fallbackSources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width, height }
    });
    
    let fallbackSource = fallbackSources.find(s => s.id === `screen:${activeDisplay.id}`);
    if (!fallbackSource) {
      const displays = screen.getAllDisplays();
      const index = displays.findIndex(d => d.id === activeDisplay.id);
      if (index !== -1 && index < fallbackSources.length) {
        fallbackSource = fallbackSources[index];
      } else {
        fallbackSource = fallbackSources[0];
      }
    }
    
    if (fallbackSource && !fallbackSource.thumbnail.isEmpty()) {
      const url = fallbackSource.thumbnail.toDataURL();
      console.log('[Feathershot] Fallback toDataURL tamanho:', url.length);
      return url;
    }
  }
  throw new Error('desktopCapturer returned no valid screen source');
}

// Screenshot: try desktopCapturer first (fast, in-process), fallback to PowerShell on Windows.
async function captureScreen(activeDisplay) {
  console.log('[Feathershot] Iniciando captura de tela...');
  try {
    const result = await captureScreenViaDesktopCapturer(activeDisplay);
    console.log('[Feathershot] Captura via desktopCapturer OK');
    return result;
  } catch (err) {
    if (IS_WINDOWS) {
      console.warn('[Feathershot] desktopCapturer falhou, tentando PowerShell:', err.message);
      return await captureScreenViaPowerShell(activeDisplay);
    }

    const platformHint = IS_MACOS
      ? 'On macOS, grant Screen Recording permission to Feathershot in System Settings.'
      : 'On Linux, make sure the desktop session allows screen capture through X11 or the active portal.';
    throw new Error(`${platformHint}\n\nOriginal error: ${err.message}`);
  }
}

// Capture full screen directly without cropping
async function captureFullscreenDirectly() {
  try {
    const wasEditorVisible = editorWindow && !editorWindow.isDestroyed() && editorWindow.isVisible();
    const wasSettingsVisible = settingsWindow && !settingsWindow.isDestroyed() && settingsWindow.isVisible();

    if (wasEditorVisible) editorWindow.hide();
    if (wasSettingsVisible) settingsWindow.hide();

    await new Promise(resolve => setTimeout(resolve, 80));

    const dataUrl = await captureScreen();

    if (wasEditorVisible) editorWindow.show();
    if (wasSettingsVisible) settingsWindow.show();

    handleScreenshotResult(dataUrl);
  } catch (err) {
    console.error('Fullscreen capture failed:', err);
    dialog.showErrorBox('Feathershot - Erro na Captura', `Não foi possível capturar a tela.\n\n${err.message}`);
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
    await new Promise(resolve => setTimeout(resolve, 80));
    
    // Close any existing croppers first
    closeAllCroppers();

    const displays = screen.getAllDisplays();
    const screenshots = await Promise.all(
      displays.map(async (display) => {
        try {
          const url = await captureScreen(display);
          return { display, url };
        } catch (err) {
          console.error(`Failed to capture display ${display.id}:`, err);
          return null;
        }
      })
    );

    // Filter out failed captures
    const validScreenshots = screenshots.filter(s => s !== null);

    if (validScreenshots.length === 0) {
      throw new Error('Could not capture any screen');
    }
    
    // Restore windows
    if (wasEditorVisible) editorWindow.show();
    if (wasSettingsVisible) settingsWindow.show();
    
    cropperWindows = validScreenshots.map(({ display, url }) => createCropperWindowForDisplay(display, url));
  } catch (err) {
    console.error('Failed to trigger capture:', err);
    dialog.showErrorBox('Feathershot - Erro na Captura', `Não foi possível capturar a tela.\n\n${err.message}`);
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

// Cropper Window creation for a specific display
function createCropperWindowForDisplay(display, screenshotDataUrl) {
  const { x, y, width, height } = display.bounds;
  
  const win = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    fullscreen: true,
    resizable: false,
    enableLargerThanScreen: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false
    }
  });
  
  const contents = win.webContents;

  win.loadFile('cropper.html');
  
  contents.on('did-finish-load', () => {
    if (!contents.isDestroyed()) {
      contents.send('capture-image', screenshotDataUrl, getResolvedLanguage());
    }
  });
  
  return win;
}

// Close all active croppers
function closeAllCroppers() {
  cropperWindows.forEach(win => {
    try {
      if (win && !win.isDestroyed()) {
        win.close();
      }
    } catch (e) {
      console.error(e);
    }
  });
  cropperWindows = [];
}

// Editor Window creation
function openEditorWindow(dataUrl, width, height) {
  if (editorWindow && !editorWindow.isDestroyed()) {
    editorWindow.focus();
    editorWindow.webContents.send('open-image', dataUrl, getResolvedLanguage());
    return;
  }
  
  // Calculate window dimensions dynamically to fit cropped screenshot
  const sidebarWidth = 220;
  const titlebarHeight = 48;
  const statusbarHeight = 28;
  const padding = 64; // Workspace margin spacing
  
  let winWidth = (width || 1000) + sidebarWidth + padding;
  let winHeight = (height || 650) + titlebarHeight + statusbarHeight + padding;
  
  const activeDisplay = getActiveDisplay();
  const displayWidth = activeDisplay.workArea.width;
  const displayHeight = activeDisplay.workArea.height;
  
  let maximize = settings.alwaysMaximized || false;
  
  // If window size bounds exceed screen bounds, scale down window size
  if (winWidth >= displayWidth || winHeight >= displayHeight) {
    winWidth = Math.min(winWidth, displayWidth - 40);
    winHeight = Math.min(winHeight, displayHeight - 40);
    if ((width && width > displayWidth * 0.8) || (height && height > displayHeight * 0.8)) {
      maximize = true;
    }
  }

  // Center editor on the active screen
  const winX = activeDisplay.bounds.x + (activeDisplay.bounds.width - winWidth) / 2;
  const winY = activeDisplay.bounds.y + (activeDisplay.bounds.height - winHeight) / 2;
  
  const icon = nativeImage.createFromPath(APP_ICON_PATH);
  
  editorWindow = new BrowserWindow({
    x: Math.round(winX),
    y: Math.round(winY),
    width: Math.round(winWidth),
    height: Math.round(winHeight),
    minWidth: 800,
    minHeight: 600,
    resizable: false,
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
    editorWindow.webContents.send('open-image', dataUrl, getResolvedLanguage());
  });
  
  editorWindow.on('closed', () => {
    editorWindow = null;
  });
}

function openSettingsWindow() {
  const icon = nativeImage.createFromPath(APP_ICON_PATH);

  settingsWindow = new BrowserWindow({
    width: 550,
    height: 700,
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

function openUpdateWindow() {
  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.focus();
    return;
  }

  const icon = nativeImage.createFromPath(APP_ICON_PATH);

  updateWindow = new BrowserWindow({
    width: 450,
    height: 600,
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

  updateWindow.loadFile('update.html');

  updateWindow.webContents.on('did-finish-load', () => {
    if (updateWindow && !updateWindow.isDestroyed() && updateVersion) {
      updateWindow.webContents.send('update-progress', {
        type: 'version',
        version: updateVersion,
        lang: getResolvedLanguage()
      });
    }
  });

  updateWindow.once('ready-to-show', () => {
    updateWindow.show();
  });

  updateWindow.on('closed', () => {
    updateWindow = null;
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

// Send update status to all open windows (settings + update window)
function broadcastUpdateEvent(channel, data) {
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  });
}

// Auto-Updater Setup
function setupAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    updateVersion = info.version;
    broadcastUpdateEvent('update-status', {
      type: 'available',
      version: info.version
    });
  });
  
  autoUpdater.on('download-progress', (progressObj) => {
    console.log('Download progress:', progressObj.percent);
    broadcastUpdateEvent('update-status', {
      type: 'progress',
      percent: progressObj.percent,
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    broadcastUpdateEvent('update-status', {
      type: 'downloaded',
      version: info.version
    });
  });
  
  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
    broadcastUpdateEvent('update-status', {
      type: 'error',
      message: err.message
    });
  });
  
  // Check for updates
  autoUpdater.checkForUpdates().catch(err => {
    console.log('Update check skipped (dev mode or no internet):', err.message);
  });

  // Check for updates periodically in the background (every 2 hours)
  setInterval(() => {
    if (app.isPackaged) {
      autoUpdater.checkForUpdates().catch(err => {
        console.log('Periodic update check failed:', err.message);
      });
    }
  }, 2 * 60 * 60 * 1000);
}

// Disable hardware acceleration only on Windows to avoid black captures caused by GPU compositing.
if (IS_WINDOWS) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
}

// Electron Application Lifecycle
app.whenReady().then(() => {
  loadSettings();
  applyAutoLaunch();
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
  closeAllCroppers();
  handleScreenshotResult(croppedDataUrl, width, height);
});

ipcMain.on('cancel-crop', () => {
  closeAllCroppers();
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
  const resolvedLanguage = getResolvedLanguage();
  return {
    ...settings,
    startWithWindows: settings.startAtLogin,
    resolvedLanguage,
    updateVersion: updateVersion || null,
    appVersion: app.getVersion(),
    platform: process.platform,
    supportsAutoLaunch: SUPPORTS_LOGIN_ITEMS
  };
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

ipcMain.on('update-action', (event, action) => {
  if (action === 'restart') {
    autoUpdater.quitAndInstall();
  } else if (action === 'later') {
    if (updateWindow) {
      updateWindow.close();
    }
  } else if (action === 'download') {
    autoUpdater.downloadUpdate().catch(err => {
      console.error('Failed to download update:', err);
      broadcastUpdateEvent('update-status', {
        type: 'error',
        message: err.message
      });
    });
  } else if (action === 'check') {
    if (app.isPackaged) {
      autoUpdater.checkForUpdates().catch(err => {
        console.log('Update check failed:', err.message);
      });
    }
  }
});
