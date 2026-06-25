const { app, BrowserWindow, globalShortcut, ipcMain, clipboard, nativeImage, dialog, screen, Tray, Menu, desktopCapturer, Notification } = require('electron');

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');
const http = require('http');
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
  language: 'auto', // 'auto' | 'en' | 'pt' | 'es' | 'ja' | 'ko' | 'de' | 'zh' | 'fr'
  theme: 'dark', // 'dark' | 'light' | 'linux' | 'macos'
  watermarkEnabled: false,
  watermarkText: 'Feathershot',
  watermarkPosition: 'bottom-right',
  watermarkOpacity: 0.3,
  watermarkLogoOnly: false,
  customThemeColors: null // { bgMain, bgCard, bgTitlebar, accentColor, textPrimary }
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
  const lower = locale.toLowerCase();
  if (lower.startsWith('pt')) return 'pt';
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('fr')) return 'fr';
  if (lower.startsWith('de')) return 'de';
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('ko')) return 'ko';
  if (lower.startsWith('zh')) return 'zh';
  return 'en';
}

// App Windows
let cropperWindows = [];
let editorWindow = null;
let settingsWindow = null;
let updateWindow = null;
let introWindow = null;
let updateVersion = null;
let tray = null;
let isQuitting = false;

let restoreSettingsAfterCrop = false;
let restoreEditorAfterCrop = false;

if (gotTheLock) {
  app.on('second-instance', () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      if (settingsWindow.isMinimized()) settingsWindow.restore();
      settingsWindow.show();
      settingsWindow.focus();
    }
  });
}

// App Icon Path
const APP_ICON_PATH = path.join(__dirname, 'src', 'assets', 'icons', 'main.png');
const APP_ICON_HYPR_PATH = path.join(__dirname, 'src', 'assets', 'icons', 'main-hyprland.png');
const APP_ICON_MACOS_PATH = path.join(__dirname, 'src', 'assets', 'icons', 'main-macos.png');

function getAppIcon() {
  if (settings.theme === 'linux') return APP_ICON_HYPR_PATH;
  if (settings.theme === 'macos') return APP_ICON_MACOS_PATH;
  return APP_ICON_PATH;
}

// Create system tray
function createTray() {
  try {
    const icon = nativeImage.createFromPath(getAppIcon());
    tray = new Tray(icon);
    tray.setToolTip('Feathershot');

    const osName = process.platform === 'win32' ? 'Windows' : process.platform === 'darwin' ? 'macOS' : 'Linux';
    const cpuArch = process.arch === 'x64' ? '64-bit' : process.arch === 'arm64' ? 'ARM64' : '32-bit';
    const appVersion = app.getVersion();

    const iconQuit = nativeImage.createFromPath(path.join(__dirname, 'src', 'assets', 'icons', 'quit.png')).resize({ width: 16, height: 16 });
    const iconSettings = nativeImage.createFromPath(path.join(__dirname, 'src', 'assets', 'icons', 'settings.png')).resize({ width: 16, height: 16 });
    const iconDownload = nativeImage.createFromPath(path.join(__dirname, 'src', 'assets', 'icons', 'download.png')).resize({ width: 16, height: 16 });

    const contextMenu = Menu.buildFromTemplate([
      { label: `Operational System: ${osName}`, enabled: false, icon: null },
      { label: `CPU: ${cpuArch}`, enabled: false, icon: null },
      { label: `Version: v${appVersion}`, enabled: false, icon: null },
      { type: 'separator' },
      { label: 'Settings', icon: iconSettings, click: () => openSettingsWindow() },
      { label: 'Check for Updates', icon: iconDownload, click: () => {
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
      { type: 'separator' },
      { label: 'Quit', icon: iconQuit, click: () => {
        isQuitting = true;
        app.quit();
      }}
    ]);
    
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      triggerScreenCapture();
    });
  } catch (err) {
    console.error('Failed to create system tray:', err);
  }
}

let hasShownShortcutConflict = false;

// Global hotkeys register
function registerShortcuts() {
  globalShortcut.unregisterAll();
  
  let shortcutString = settings.shortcut || DEFAULT_SHORTCUT;
  
  try {
    const registered = globalShortcut.register(shortcutString, () => {
      triggerScreenCapture();
    });
    if (!registered) {
      console.warn(`Failed to register global shortcut: ${shortcutString}`);
      
      if (shortcutString === 'PrintScreen') {
        const fallbackRegistered = globalShortcut.register(DEFAULT_SHORTCUT, () => {
          triggerScreenCapture();
        });
        if (fallbackRegistered && !hasShownShortcutConflict) {
          hasShownShortcutConflict = true;
          const lang = getResolvedLanguage();
          const title = lang === 'pt' ? 'Feathershot - Atalho em Conflito' : 'Feathershot - Shortcut Conflict';
          const message = lang === 'pt' 
            ? 'Não foi possível registrar a tecla PrintScreen.' 
            : 'Could not register the PrintScreen key.';
          const detail = lang === 'pt'
            ? `O Windows ou outro aplicativo está usando a tecla PrintScreen. O Feathershot usará o atalho alternativo: Ctrl+Shift+S.\n\nPara liberar a tecla PrintScreen:\n1. Abra as Configurações do Windows.\n2. Vá em Acessibilidade > Teclado.\n3. Desative a opção "Usar o botão Print screen para abrir a captura de tela".`
            : `Windows or another application is using the PrintScreen key. Feathershot will use the fallback shortcut: Ctrl+Shift+S.\n\nTo free up the PrintScreen key:\n1. Open Windows Settings.\n2. Go to Accessibility > Keyboard.\n3. Turn off "Use the Print screen key to open screen capture".`;
          
          const showDialog = () => {
            dialog.showMessageBox({
              type: 'warning',
              title,
              message,
              detail,
              buttons: ['OK']
            });
          };
          if (app.isReady()) {
            showDialog();
          } else {
            app.whenReady().then(showDialog);
          }
        }
      } else {
        globalShortcut.register(DEFAULT_SHORTCUT, () => {
          triggerScreenCapture();
        });
      }
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
    if (!activeDisplay) activeDisplay = getActiveDisplay();
    const tmpFile = path.join(os.tmpdir(), `feathershot_${activeDisplay.id}_${Date.now()}.png`);
    const escapedPath = tmpFile.replace(/\\/g, '\\\\');
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
    
    restoreEditorAfterCrop = wasEditorVisible;
    restoreSettingsAfterCrop = wasSettingsVisible;
    
    if (wasEditorVisible) editorWindow.hide();
    if (wasSettingsVisible) settingsWindow.hide();
    
    // Wait a brief moment for the windows to fully hide
    await new Promise(resolve => setTimeout(resolve, 250));
    
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
    
    // Cria uma janela por monitor com dados compostos para suporte a drag entre monitores
    cropperWindows = createCropperWindows(validScreenshots);
  } catch (err) {
    console.error('Failed to trigger capture:', err);
    
    // Restore windows immediately if trigger failed
    if (restoreEditorAfterCrop && editorWindow && !editorWindow.isDestroyed()) editorWindow.show();
    if (restoreSettingsAfterCrop && settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.show();
    
    restoreEditorAfterCrop = false;
    restoreSettingsAfterCrop = false;
    
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
    // Show a native notification (non-blocking)
    if (Notification.isSupported()) {
      new Notification({
        title: 'Feathershot',
        body: getResolvedLanguage() === 'pt' 
          ? 'Captura de tela copiada para a área de transferência!' 
          : 'Screenshot copied to clipboard!',
        icon: getAppIcon()
      }).show();
    }
  } else if (settings.defaultAction === 'save') {
    const fileName = generateFileName();
    const savePath = path.join(settings.saveFolder, fileName);
    
    convertPngToFormat(dataUrl, settings.imageFormat).then(buffer => {
      fs.writeFileSync(savePath, buffer);
      // Show a native notification (non-blocking)
      if (Notification.isSupported()) {
        new Notification({
          title: 'Feathershot',
          body: getResolvedLanguage() === 'pt'
            ? `Captura de tela salva diretamente em:\n${savePath}`
            : `Screenshot saved directly to:\n${savePath}`,
          icon: APP_ICON_PATH
        }).show();
      }
    }).catch(err => {
      console.error('Failed to convert screenshot for direct save:', err);
    });
  }
}

// Create one cropper window per monitor with shared composite data for cross-monitor selection
function createCropperWindows(validScreenshots) {
  const displays = screen.getAllDisplays();
  
  // Calculate bounding box of all displays (virtual desktop)
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  displays.forEach(d => {
    minX = Math.min(minX, d.bounds.x);
    minY = Math.min(minY, d.bounds.y);
    maxX = Math.max(maxX, d.bounds.x + d.bounds.width);
    maxY = Math.max(maxY, d.bounds.y + d.bounds.height);
  });
  
  const totalWidth = maxX - minX;
  const totalHeight = maxY - minY;
  
  // All display captures with global offsets (for composite building)
  const displayCaptures = validScreenshots.map(({ display, url }) => ({
    x: display.bounds.x - minX,
    y: display.bounds.y - minY,
    width: display.bounds.width,
    height: display.bounds.height,
    url
  }));
  
  const windows = [];
  
  validScreenshots.forEach(({ display, url }) => {
    const win = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      frame: false,
      transparent: false,
      backgroundColor: '#000000',
      alwaysOnTop: true,
      fullscreen: false,
      resizable: false,
      show: true, // Show immediately to avoid Chromium paint throttling on hidden windows
      focusable: true,
      skipTaskbar: true,
      webPreferences: {
        preload: path.join(__dirname, 'src', 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        devTools: false
      }
    });
    
    win.setAlwaysOnTop(true, 'screen-saver', 1);
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.loadFile(path.join('src', 'pages', 'cropper.html'));
    
    // This window's offset within the virtual desktop
    const displayOffset = {
      x: display.bounds.x - minX,
      y: display.bounds.y - minY
    };
    
    win.webContents.on('did-finish-load', () => {
      if (!win.webContents.isDestroyed()) {
        win.webContents.send('capture-image', {
          displayCaptures,
          displayOffset,
          displaySize: { width: display.bounds.width, height: display.bounds.height },
          totalSize: { width: totalWidth, height: totalHeight },
          theme: settings.theme,
          defaultAction: settings.defaultAction
        }, getResolvedLanguage());
        
        // Explicitly focus and show to ensure foreground focus
        win.show();
        win.focus();
      }
    });
    
    windows.push(win);
  });
  
  return windows;
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
  
  // Force maximized/fullscreen by default as requested
  let maximize = true;
  
  // If window size bounds exceed screen bounds, scale down window size
  if (winWidth >= displayWidth || winHeight >= displayHeight) {
    winWidth = Math.min(winWidth, displayWidth - 40);
    winHeight = Math.min(winHeight, displayHeight - 40);
  }

  // Center editor on the active screen
  const winX = activeDisplay.bounds.x + (activeDisplay.bounds.width - winWidth) / 2;
  const winY = activeDisplay.bounds.y + (activeDisplay.bounds.height - winHeight) / 2;
  
  const icon = nativeImage.createFromPath(getAppIcon());
  
  editorWindow = new BrowserWindow({
    x: Math.round(winX),
    y: Math.round(winY),
    width: Math.round(winWidth),
    height: Math.round(winHeight),
    minWidth: 800,
    minHeight: 600,
    resizable: true, // MUST be resizable to allow maximization on Windows
    icon: icon,
    frame: false, // Frameless window for beautiful custom title bar
    show: false,
    backgroundColor: '#121214',
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false
    }
  });
  
    editorWindow.loadFile(path.join('src', 'pages', 'editor.html'));
  
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
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    settingsWindow.webContents.send('reload-settings');
    return;
  }

  const icon = nativeImage.createFromPath(getAppIcon());

  settingsWindow = new BrowserWindow({
    width: 1120,
    height: 550,
    resizable: false,
    icon: icon,
    frame: false, // Frameless for a premium styled view
    show: false,
    backgroundColor: '#121214',
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false
    }
  });
  
    settingsWindow.loadFile(path.join('src', 'pages', 'settings-new-interface.html'));
  
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });
  
  settingsWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      settingsWindow.hide();
    } else {
      settingsWindow = null;
    }
  });
}

function openUpdateWindow() {
  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.focus();
    return;
  }

  const icon = nativeImage.createFromPath(getAppIcon());

  updateWindow = new BrowserWindow({
    width: 450,
    height: 600,
    resizable: false,
    icon: icon,
    frame: false, // Frameless for a premium styled view
    show: false,
    backgroundColor: '#121214',
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false
    }
  });

    updateWindow.loadFile(path.join('src', 'pages', 'update.html'));

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
    // Dispara o download automático se estiver empacotado em produção
    if (app.isPackaged) {
      autoUpdater.downloadUpdate().catch(err => {
        console.error('Failed to download update on window open:', err);
      });
    }
  });

  updateWindow.on('closed', () => {
    updateWindow = null;
  });
}

// Intro Window for Hyprland theme switch
function openIntroWindow() {
  if (introWindow && !introWindow.isDestroyed()) {
    return;
  }

  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  introWindow = new BrowserWindow({
    width: 420,
    height: 320,
    x: Math.round((screenW - 420) / 2),
    y: Math.round((screenH - 320) / 2),
    resizable: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false
    }
  });

    introWindow.loadFile(path.join('src', 'pages', 'intro.html'));

  introWindow.on('closed', () => {
    introWindow = null;
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
    openUpdateWindow(); // Abre a janela de atualização automaticamente!
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
  if (!gotTheLock) return;
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
  
  // Restore settings if it was open before crop
  if (restoreSettingsAfterCrop && settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
  }
  
  restoreEditorAfterCrop = false;
  restoreSettingsAfterCrop = false;
  
  handleScreenshotResult(croppedDataUrl, width, height);
});

ipcMain.on('cancel-crop', () => {
  closeAllCroppers();
  
  // Restore settings and/or editor if they were open before crop
  if (restoreEditorAfterCrop && editorWindow && !editorWindow.isDestroyed()) {
    editorWindow.show();
  }
  if (restoreSettingsAfterCrop && settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
  }
  
  restoreEditorAfterCrop = false;
  restoreSettingsAfterCrop = false;
});

ipcMain.on('intro-complete', () => {
  // Intro animation finished, app will restart shortly
});

ipcMain.on('report-mouse-active', (event) => {
  const activeWin = BrowserWindow.fromWebContents(event.sender);
  if (!activeWin) return;
  
  cropperWindows.forEach(win => {
    if (win && !win.isDestroyed() && win !== activeWin) {
      win.webContents.send('hide-magnifier');
    }
  });
});

// Sync drag events between cropper windows for cross-monitor selection
ipcMain.on('cropper-event', (event, data) => {
  cropperWindows.forEach(win => {
    if (win && !win.isDestroyed() && win.webContents !== event.sender) {
      win.webContents.send('cropper-sync', data);
    }
  });
});

ipcMain.on('close-editor', () => {
  if (editorWindow) {
    editorWindow.close();
  }
});

// Places a real file on the Windows clipboard (CF_HDROP) plus a bitmap image, so
// pasting yields an actual file with the chosen extension (e.g. .gif) while apps
// that only accept images still get the picture. Uses PowerShell + WinForms.
function copyFileToClipboardWindows(dropPath, imgPath) {
  return new Promise((resolve) => {
    const esc = (p) => p.replace(/'/g, "''");
    const script = `Add-Type -AssemblyName System.Windows.Forms,System.Drawing; ` +
      `$files=New-Object System.Collections.Specialized.StringCollection; ` +
      `$files.Add('${esc(dropPath)}') | Out-Null; ` +
      `$do=New-Object System.Windows.Forms.DataObject; ` +
      `$do.SetFileDropList($files); ` +
      `$img=$null; try { $img=[System.Drawing.Image]::FromFile('${esc(imgPath)}'); $do.SetImage($img); } catch {}; ` +
      `[System.Windows.Forms.Clipboard]::SetDataObject($do, $true); ` +
      `if ($img) { $img.Dispose(); }`;

    execFile('powershell', ['-STA', '-NoProfile', '-NonInteractive', '-Command', script], { timeout: 15000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('[Feathershot] Clipboard PowerShell error:', error.message, stderr);
        return resolve(false);
      }
      resolve(true);
    });
  });
}

ipcMain.handle('copy-to-clipboard', async (event, pngDataUrl, fileData, format) => {
  try {
    const fmt = (format || 'png').toLowerCase();
    const ext = fmt === 'jpeg' ? 'jpg' : fmt;

    const pngBuffer = (typeof pngDataUrl === 'string' && pngDataUrl.startsWith('data:'))
      ? Buffer.from(pngDataUrl.split(',')[1], 'base64')
      : null;

    let fileBuffer;
    if (typeof fileData === 'string' && fileData.startsWith('data:')) {
      fileBuffer = Buffer.from(fileData.split(',')[1], 'base64');
    } else if (fileData) {
      fileBuffer = Buffer.from(fileData); // gif bytes (Uint8Array)
    } else {
      fileBuffer = pngBuffer;
    }

    // On Windows, drop the file (in the chosen format) on the clipboard so pasting
    // into Explorer / chat apps produces a real file with the right extension.
    if (IS_WINDOWS && fileBuffer && pngBuffer) {
      const dropPath = path.join(os.tmpdir(), `feathershot_clip.${ext}`);
      const imgPath = path.join(os.tmpdir(), 'feathershot_clip_img.png');
      fs.writeFileSync(dropPath, fileBuffer);
      fs.writeFileSync(imgPath, pngBuffer);
      const ok = await copyFileToClipboardWindows(dropPath, imgPath);
      if (ok) return true;
      // fall through to the image-only fallback if PowerShell failed
    }

    // Fallback (non-Windows, or PowerShell failure): put the bitmap on the clipboard.
    if (pngBuffer) {
      clipboard.writeImage(nativeImage.createFromBuffer(pngBuffer));
      return true;
    }
    return false;
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

ipcMain.handle('get-default-filename', () => {
  return generateFileName();
});

ipcMain.handle('save-settings', (event, newSettings) => {
  const previousTheme = settings.theme;
  saveSettings(newSettings);
  hasShownShortcutConflict = false; // Reset to allow showing warning again if new settings fail
  registerShortcuts(); // Re-register shortcut if it changed
  
  // Notify other windows of settings change
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send('settings-changed', settings);
    }
  });

  // If theme changed to Hyprland, show intro and restart app
  if (previousTheme !== 'linux' && newSettings.theme === 'linux') {
    setTimeout(() => {
      openIntroWindow();
      setTimeout(() => {
        app.relaunch();
        app.exit(0);
      }, 3200);
    }, 400);
  }
  
  return settings;
});

// Helper for converting images to target format offscreen
async function convertPngToFormat(pngDataUrl, targetFormat) {
  if (targetFormat === 'png') {
    return Buffer.from(pngDataUrl.split(',')[1], 'base64');
  }
  
  const workerWin = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  await workerWin.loadURL('about:blank');
  
  try {
    if (targetFormat === 'gif') {
      const result = await workerWin.webContents.executeJavaScript(`
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, img.width, img.height);
            resolve({
              pixels: Array.from(imgData.data),
              width: img.width,
              height: img.height
            });
          };
          img.src = ${JSON.stringify(pngDataUrl)};
        });
      `);
      
      const { GIFEncoder, quantize, applyPalette } = require('gifenc');
      const pixelArray = Uint8Array.from(result.pixels);
      const palette = quantize(pixelArray, 256);
      const index = applyPalette(pixelArray, palette);
      const gif = GIFEncoder();
      gif.writeFrame(index, result.width, result.height, { palette });
      gif.finish();
      return Buffer.from(gif.bytes());
    } else {
      const mime = targetFormat === 'jpeg' || targetFormat === 'jpg' ? 'image/jpeg' : 'image/webp';
      const resultDataUrl = await workerWin.webContents.executeJavaScript(`
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('${mime}', 0.92));
          };
          img.src = ${JSON.stringify(pngDataUrl)};
        });
      `);
      return Buffer.from(resultDataUrl.split(',')[1], 'base64');
    }
  } finally {
    workerWin.destroy();
  }
}

ipcMain.handle('show-save-dialog', async (event, selectedFormat) => {
  const format = selectedFormat || settings.imageFormat;
  const name = generateFileName();
  const nameWithCorrectExt = name.substring(0, name.lastIndexOf('.')) + '.' + format;
  const defaultPath = path.join(settings.saveFolder, nameWithCorrectExt);
  
  const allFilters = [
    { name: 'PNG Image (*.png)', extensions: ['png'] },
    { name: 'JPEG Image (*.jpg; *.jpeg)', extensions: ['jpg', 'jpeg'] },
    { name: 'WebP Image (*.webp)', extensions: ['webp'] },
    { name: 'GIF Image (*.gif)', extensions: ['gif'] }
  ];
  
  const activeFilter = allFilters.find(f => f.extensions.includes(format));
  const otherFilters = allFilters.filter(f => !f.extensions.includes(format));
  const filters = [activeFilter, ...otherFilters].filter(Boolean);

  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath,
    filters
  });
  return { canceled, filePath };
});

ipcMain.handle('save-file', async (event, filePath, data) => {
  try {
    let buffer;
    if (typeof data === 'string' && data.startsWith('data:')) {
      buffer = Buffer.from(data.split(',')[1], 'base64');
    } else {
      buffer = Buffer.from(data);
    }
    fs.writeFileSync(filePath, buffer);
    return true;
  } catch (err) {
    console.error('Failed to write file:', err);
    return false;
  }
});

ipcMain.handle('select-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: settings.saveFolder
  });

  if (canceled || filePaths.length === 0) return null;
  return filePaths[0];
});

ipcMain.handle('join-path', (event, dir, file) => {
  return path.join(dir || '', file || '');
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
    openUpdateWindow();
  } else if (action === 'check') {
    if (app.isPackaged) {
      autoUpdater.checkForUpdates().catch(err => {
        console.log('Update check failed:', err.message);
      });
    }
  }
});

// ========== OCR (Online API - MyMemory) ==========
ipcMain.handle('ocr-extract', async (event, imageDataUrl, lang) => {
  try {
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const langMap = { pt: 'por', es: 'spa', fr: 'fra', de: 'deu', ja: 'jpn', ko: 'kor', zh: 'zho' };
    const ocrLang = langMap[lang] || 'eng';

    const postData = JSON.stringify({
      base64Image: `data:image/png;base64,${base64Data}`,
      language: ocrLang,
      OCREngine: 2
    });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.ocr.space',
        path: '/parse/image',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'K85587724388957',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.ParsedResults && result.ParsedResults.length > 0) {
              resolve({ text: result.ParsedResults[0].ParsedText || '', success: true });
            } else {
              resolve({ text: '', success: false, error: 'No text found in image' });
            }
          } catch (e) {
            resolve({ text: '', success: false, error: 'Failed to parse OCR response' });
          }
        });
      });
      req.on('error', (e) => resolve({ text: '', success: false, error: e.message }));
      req.write(postData);
      req.end();
    });
  } catch (err) {
    return { text: '', success: false, error: err.message };
  }
});

// ========== Translation (MyMemory API) ==========
ipcMain.handle('translate-text', async (event, text, fromLang, toLang) => {
  try {
    const langPair = `${fromLang || 'en'}|${toLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.responseStatus === 200 && result.responseData) {
              resolve({ text: result.responseData.translatedText, success: true });
            } else {
              resolve({ text: '', success: false, error: 'Translation failed' });
            }
          } catch (e) {
            resolve({ text: '', success: false, error: 'Failed to parse translation' });
          }
        });
      }).on('error', (e) => resolve({ text: '', success: false, error: e.message }));
    });
  } catch (err) {
    return { text: '', success: false, error: err.message };
  }
});

// ========== Watermark Logo ==========
ipcMain.handle('get-watermark-logo', () => {
  const theme = settings.theme || 'dark';
  let logoPath = APP_ICON_PATH;
  if (theme === 'linux') logoPath = APP_ICON_HYPR_PATH;
  else if (theme === 'macos') logoPath = APP_ICON_MACOS_PATH;

  try {
    const img = nativeImage.createFromPath(logoPath);
    return img.toDataURL();
  } catch (err) {
    console.error('Failed to load watermark logo:', err);
    return null;
  }
});
