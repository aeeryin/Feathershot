const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Window controls
  closeWindow: () => ipcRenderer.send('window-control', 'close'),
  minimizeWindow: () => ipcRenderer.send('window-control', 'minimize'),
  maximizeWindow: () => ipcRenderer.send('window-control', 'maximize'),

  // Cropper specific APIs
  onCaptureImage: (callback) => ipcRenderer.on('capture-image', (event, data, lang) => callback(data, lang)),
  cropCompleted: (dataUrl, width, height) => ipcRenderer.send('crop-completed', dataUrl, width, height),
  cancelCrop: () => ipcRenderer.send('cancel-crop'),
  printImage: (dataUrl) => ipcRenderer.send('print-image', dataUrl),
  saveToDesktop: (dataUrl) => ipcRenderer.invoke('save-to-desktop', dataUrl),
  reportMouseActive: () => ipcRenderer.send('report-mouse-active'),
  onHideMagnifier: (callback) => ipcRenderer.on('hide-magnifier', () => callback()),
  sendCropperEvent: (data) => ipcRenderer.send('cropper-event', data),
  onCropperSync: (callback) => ipcRenderer.on('cropper-sync', (event, data) => callback(data)),

  // Editor specific APIs
  onOpenImage: (callback) => ipcRenderer.on('open-image', (event, dataUrl, lang) => callback(dataUrl, lang)),
  copyToClipboard: (pngDataUrl, fileData, format) => ipcRenderer.invoke('copy-to-clipboard', pngDataUrl, fileData, format),
  saveToDisk: (dataUrl, defaultName) => ipcRenderer.invoke('save-to-disk', dataUrl, defaultName),
  showSaveDialog: (selectedFormat) => ipcRenderer.invoke('show-save-dialog', selectedFormat),
  saveFile: (filePath, data) => ipcRenderer.invoke('save-file', filePath, data),
  encodeGif: (pixelData, width, height) => {
    const { GIFEncoder, quantize, applyPalette } = require('gifenc');
    const palette = quantize(pixelData, 256);
    const index = applyPalette(pixelData, palette);
    const gif = GIFEncoder();
    gif.writeFrame(index, width, height, { palette });
    gif.finish();
    return gif.bytes();
  },
  closeEditor: () => ipcRenderer.send('close-editor'),

  // Settings APIs
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  joinPath: (dir, file) => ipcRenderer.invoke('join-path', dir, file),
  onSettingsChanged: (callback) => ipcRenderer.on('settings-changed', (event, settings) => callback(settings)),

  // Update APIs
  onUpdateProgress: (callback) => ipcRenderer.on('update-progress', callback),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, data) => callback(data)),
  sendUpdateAction: (action) => ipcRenderer.send('update-action', action),
  onReloadSettings: (callback) => ipcRenderer.on('reload-settings', callback),
  getDefaultFileName: () => ipcRenderer.invoke('get-default-filename'),

  // Intro APIs
  introComplete: () => ipcRenderer.send('intro-complete'),

  // OCR APIs
  ocrExtract: (imageDataUrl, lang) => ipcRenderer.invoke('ocr-extract', imageDataUrl, lang),

  // Translation APIs
  translateText: (text, fromLang, toLang) => ipcRenderer.invoke('translate-text', text, fromLang, toLang),

  // Watermark logo
  getWatermarkLogo: () => ipcRenderer.invoke('get-watermark-logo')
});

