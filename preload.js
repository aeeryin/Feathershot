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
  copyToClipboard: (dataUrl) => ipcRenderer.invoke('copy-to-clipboard', dataUrl),
  saveToDisk: (dataUrl, defaultName) => ipcRenderer.invoke('save-to-disk', dataUrl, defaultName),
  closeEditor: () => ipcRenderer.send('close-editor'),

  // Settings APIs
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  onSettingsChanged: (callback) => ipcRenderer.on('settings-changed', (event, settings) => callback(settings)),

  // Update APIs
  onUpdateProgress: (callback) => ipcRenderer.on('update-progress', callback),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, data) => callback(data)),
  sendUpdateAction: (action) => ipcRenderer.send('update-action', action)
});
