// Elements
const winClose = document.getElementById('win-close');
const hotkeyInput = document.getElementById('hotkey-input');
const recordBtn = document.getElementById('btn-record-hotkey');
const printScreenBtn = document.getElementById('btn-set-printscreen');
const toggleMaximized = document.getElementById('toggle-maximized');
const toggleStartup = document.getElementById('toggle-startup');
const folderInput = document.getElementById('folder-input');
const browseBtn = document.getElementById('btn-browse-folder');
const filenamePatternInput = document.getElementById('filename-pattern');
const formatSelect = document.getElementById('format-select');
const languageSelect = document.getElementById('language-select');
const btnSave = document.getElementById('btn-save-settings');
const btnCancel = document.getElementById('btn-cancel-settings');

const settingsTranslations = {
  en: {
    'app-title': 'Feathershot Settings',
    'card-default-action-title': 'Default Action',
    'card-default-action-desc': 'Choose what happens right after you select and crop a screen area.',
    'action-editor-title': 'Open in Editor',
    'action-editor-desc': 'Add annotations, text, blur, and markup inside the visual editor.',
    'action-clipboard-title': 'Copy directly to Clipboard',
    'action-clipboard-desc': 'Skip the editor and copy the crop directly to your clipboard.',
    'action-save-title': 'Save directly to folder',
    'action-save-desc': 'Automatically save the file without prompt to your destination.',
    'card-language-title': 'Language',
    'card-language-desc': 'Select the display language for the application.',
    'language-auto': 'Auto (System Language)',
    'language-en': 'English',
    'language-pt': 'Português',
    'card-hotkey-title': 'Keyboard Hotkey',
    'card-hotkey-desc': 'Shortcut key to trigger region screen captures.',
    'btn-record-hotkey': 'Change Hotkey',
    'hotkey-hint': 'Click "Change Hotkey" to record a combo, or use the PrtSc button to set Print Screen directly.',
    'card-editor-behavior-title': 'Editor Behavior',
    'card-editor-behavior-desc': 'Configure how the image editor opens after capture.',
    'toggle-maximized-title': 'Always open editor maximized',
    'toggle-maximized-desc': 'The editor window will always open in fullscreen mode, regardless of the image size.',
    'card-startup-title': 'Startup',
    'card-startup-desc': 'Control whether the application launches automatically when Windows starts.',
    'toggle-startup-title': 'Start with Windows',
    'toggle-startup-desc': 'Feathershot will run in the system tray automatically when you log into Windows.',
    'card-storage-title': 'Storage & Naming',
    'card-storage-desc': 'Setup where screenshots are saved and how files are named.',
    'label-save-folder': 'Save Folder Path',
    'btn-browse-folder': 'Browse',
    'label-naming-template': 'File Naming Template',
    'naming-hint': 'Supported tokens: {yyyy}, {month}, {day}, {hour}, {min}, {sec}',
    'label-format': 'Format',
    'format-png': 'PNG (Lossless)',
    'format-jpeg': 'JPEG (Compressed)',
    'btn-save-settings': 'Save Configurations',
    'btn-cancel-settings': 'Cancel'
  },
  pt: {
    'app-title': 'Configurações do Feathershot',
    'card-default-action-title': 'Ação Padrão',
    'card-default-action-desc': 'Escolha o que acontece logo após você selecionar e recortar uma área da tela.',
    'action-editor-title': 'Abrir no Editor',
    'action-editor-desc': 'Adicione anotações, texto, desfoque e marcações dentro do editor visual.',
    'action-clipboard-title': 'Copiar diretamente para a Área de Transferência',
    'action-clipboard-desc': 'Pule o editor e copie o recorte diretamente para a área de transferência.',
    'action-save-title': 'Salvar diretamente na pasta',
    'action-save-desc': 'Salve o arquivo automaticamente na sua pasta de destino sem perguntar.',
    'card-language-title': 'Idioma',
    'card-language-desc': 'Selecione o idioma de exibição do aplicativo.',
    'language-auto': 'Automático (Idioma do Sistema)',
    'language-en': 'Inglês',
    'language-pt': 'Português',
    'card-hotkey-title': 'Atalho do Teclado',
    'card-hotkey-desc': 'Tecla de atalho para iniciar a captura de tela.',
    'btn-record-hotkey': 'Alterar Atalho',
    'hotkey-hint': 'Clique em "Alterar Atalho" para registrar uma combinação ou use o botão PrtSc para definir a tecla Print Screen.',
    'card-editor-behavior-title': 'Comportamento do Editor',
    'card-editor-behavior-desc': 'Configure como o editor de imagem abre após a captura.',
    'toggle-maximized-title': 'Sempre abrir o editor maximizado',
    'toggle-maximized-desc': 'A janela do editor sempre abrirá maximizada, independentemente do tamanho da imagem.',
    'card-startup-title': 'Inicialização',
    'card-startup-desc': 'Controle se o aplicativo inicia automaticamente quando o Windows é ligado.',
    'toggle-startup-title': 'Iniciar com o Windows',
    'toggle-startup-desc': 'O Feathershot será executado na bandeja do sistema automaticamente ao fazer login no Windows.',
    'card-storage-title': 'Armazenamento e Nomeação',
    'card-storage-desc': 'Configure onde as capturas de tela serão salvas e como os arquivos serão nomeados.',
    'label-save-folder': 'Caminho da Pasta de Salvamento',
    'btn-browse-folder': 'Procurar',
    'label-naming-template': 'Modelo de Nome de Arquivo',
    'naming-hint': 'Tokens suportados: {yyyy}, {month}, {day}, {hour}, {min}, {sec}',
    'label-format': 'Formato',
    'format-png': 'PNG (Sem Perdas)',
    'format-jpeg': 'JPEG (Compactado)',
    'btn-save-settings': 'Salvar Configurações',
    'btn-cancel-settings': 'Cancelar'
  }
};

function applyTranslations(lang) {
  const t = settingsTranslations[lang] || settingsTranslations.en;
  Object.keys(t).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = t[id];
    }
  });

  if (lang === 'pt') {
    hotkeyInput.placeholder = 'Pressione as teclas...';
    filenamePatternInput.placeholder = 'Captura_{yyyy}-{month}-{day}';
  } else {
    hotkeyInput.placeholder = 'Press a hotkey...';
    filenamePatternInput.placeholder = 'Screenshot_{yyyy}-{month}-{day}';
  }
}

let currentSettings = {};
let isRecordingHotkey = false;

// Initialize Settings
async function initSettings() {
  currentSettings = await window.api.getSettings();
  
  // Apply resolved translations
  applyTranslations(currentSettings.resolvedLanguage || 'en');
  
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
  languageSelect.value = currentSettings.language || 'auto';
  
  // Populate toggles
  toggleMaximized.checked = currentSettings.alwaysMaximized || false;
  toggleStartup.checked = currentSettings.startWithWindows || false;
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
    alwaysMaximized: toggleMaximized.checked,
    startWithWindows: toggleStartup.checked,
    language: languageSelect.value
  };
  
  await window.api.saveSettings(newSettings);
  window.api.closeWindow();
});

// Change Language Listener
languageSelect.addEventListener('change', () => {
  let lang = languageSelect.value;
  if (lang === 'auto') {
    lang = currentSettings.resolvedLanguage || 'en';
  }
  applyTranslations(lang);
});

// Start initialization
initSettings();
