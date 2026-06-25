(() => {
  const winClose = document.getElementById("win-close");
  const hotkeyInput = document.getElementById("hotkey-input");
  const recordBtn = document.getElementById("btn-record-hotkey");
  const printScreenBtn = document.getElementById("btn-set-printscreen");
  const toggleMaximized = document.getElementById("toggle-maximized");
  const toggleStartup = document.getElementById("toggle-startup");
  const togglePrintscreen = document.getElementById("toggle-printscreen");
  const folderInput = document.getElementById("folder-input");
  const browseBtn = document.getElementById("btn-browse-folder");
  const filenamePatternInput = document.getElementById("filename-pattern");
  const formatSelect = document.getElementById("format-select");
  const languageSelect = document.getElementById("language-select");
  const btnSave = document.getElementById("btn-save-settings");
  const btnCancel = document.getElementById("btn-cancel-settings");
  const themeSelect = document.getElementById("theme-select");
  const themePreviews = document.getElementById("theme-previews");
  const hotkeyWarning = document.getElementById("hotkey-warning");
  const updateBanner = document.getElementById("update-banner");
  const updateBannerTitle = document.getElementById("update-banner-title");
  const updateBannerDesc = document.getElementById("update-banner-desc");
  const updateProgressContainer = document.getElementById("update-progress-container");
  const updateProgressFill = document.getElementById("update-progress-fill");
  const updateProgressText = document.getElementById("update-progress-text");
  const btnUpdateAction = document.getElementById("btn-update-action");
  let updateState = "idle";
  let pendingUpdateVersion = null;
  const settingsTranslations = {
    en: {
      "app-title": "Feathershot Settings",
      "card-default-action-title": "Default Action",
      "card-default-action-desc": "Choose what happens right after you select and crop a screen area.",
      "action-editor-title": "Open in Editor",
      "action-editor-desc": "Add annotations, text, blur, and markup inside the visual editor.",
      "action-clipboard-title": "Copy directly to Clipboard",
      "action-clipboard-desc": "Skip the editor and copy the crop directly to your clipboard.",
      "action-save-title": "Save directly to folder",
      "action-save-desc": "Automatically save the file without prompt to your destination.",
      "card-language-title": "Language",
      "card-language-desc": "Select the display language for the application.",
      "language-auto": "Auto (System Language)",
      "language-en": "English",
      "language-pt": "Portugu\xEAs",
      "card-hotkey-title": "Keyboard Hotkey",
      "card-hotkey-desc": "Shortcut key to trigger region screen captures.",
      "btn-record-hotkey": "Change Hotkey",
      "hotkey-hint": 'Click "Change Hotkey" to record a combo, or use the PrtSc button to set Print Screen directly.',
      "hotkey-warning": "If Windows still opens the built-in screenshot tool when you press Print Screen, use Ctrl+Shift+S or disable Print Screen snipping in Windows Settings.",
      "card-printscreen-title": "Windows Print Screen",
      "card-printscreen-desc": "Enable or disable Windows built-in Print Screen snipping.",
      "toggle-printscreen-title": "Enable Windows Print Screen snip",
      "toggle-printscreen-desc": "Turn this off to let Feathershot handle Print Screen directly.",
      "toggle-printscreen-unsupported-desc": "This feature is only available on Windows.",
      "card-editor-behavior-title": "Editor Behavior",
      "card-editor-behavior-desc": "Configure how the image editor opens after capture.",
      "toggle-maximized-title": "Always open editor maximized",
      "toggle-maximized-desc": "The editor window will always open in fullscreen mode, regardless of the image size.",
      "card-startup-title": "Startup",
      "card-startup-desc": "Control whether the application launches automatically when you sign in.",
      "toggle-startup-title": "Start with system",
      "toggle-startup-desc": "Feathershot will run in the system tray automatically when you sign in.",
      "toggle-startup-unsupported-desc": "Auto-launch must be configured through your Linux desktop environment.",
      "card-storage-title": "Storage & Naming",
      "card-storage-desc": "Setup where screenshots are saved and how files are named.",
      "label-save-folder": "Save Folder Path",
      "btn-browse-folder": "Browse",
      "label-naming-template": "File Naming Template",
      "naming-hint": "Supported tokens: {yyyy}, {month}, {day}, {hour}, {min}, {sec}, {ss}",
      "label-format": "Format",
      "format-png": "PNG (Lossless)",
      "format-jpeg": "JPEG (Compressed)",
      "format-webp": "WebP (Modern)",
      "format-gif": "GIF (Static)",
      "card-theme-title": "Interface Theme",
      "card-theme-desc": "Select the appearance theme for the application.",
      "theme-system": "System Default",
      "theme-dark": "Dark Mode",
      "theme-light": "Light Mode",
      "theme-linux": "Hyprland",
      "theme-macos": "MacOS",
      "btn-save-settings": "Save Configurations",
      "btn-cancel-settings": "Cancel"
    },
    pt: {
      "app-title": "Configura\xE7\xF5es do Feathershot",
      "card-default-action-title": "A\xE7\xE3o Padr\xE3o",
      "card-default-action-desc": "Escolha o que acontece logo ap\xF3s voc\xEA selecionar e recortar uma \xE1rea da tela.",
      "action-editor-title": "Abrir no Editor",
      "action-editor-desc": "Adicione anota\xE7\xF5es, texto, desfoque e marca\xE7\xF5es dentro do editor visual.",
      "action-clipboard-title": "Copiar diretamente para a \xC1rea de Transfer\xEAncia",
      "action-clipboard-desc": "Pule o editor e copie o recorte diretamente para a \xE1rea de transfer\xEAncia.",
      "action-save-title": "Salvar diretamente na pasta",
      "action-save-desc": "Salve o arquivo automaticamente na sua pasta de destino sem perguntar.",
      "card-language-title": "Idioma",
      "card-language-desc": "Selecione o idioma de exibi\xE7\xE3o do aplicativo.",
      "language-auto": "Autom\xE1tico (Idioma do Sistema)",
      "language-en": "Ingl\xEAs",
      "language-pt": "Portugu\xEAs",
      "card-hotkey-title": "Atalho do Teclado",
      "card-hotkey-desc": "Tecla de atalho para iniciar a captura de tela.",
      "btn-record-hotkey": "Alterar Atalho",
      "hotkey-hint": 'Clique em "Alterar Atalho" para registrar uma combina\xE7\xE3o ou use o bot\xE3o PrtSc para definir a tecla Print Screen.',
      "hotkey-warning": "Se o Windows continuar abrindo a ferramenta de captura nativa ao pressionar Print Screen, use Ctrl+Shift+S ou desative a captura do Print Screen nas configura\xE7\xF5es do Windows.",
      "card-printscreen-title": "Print Screen do Windows",
      "card-printscreen-desc": "Ative ou desative a captura nativa via Print Screen do Windows.",
      "toggle-printscreen-title": "Ativar captura do Print Screen do Windows",
      "toggle-printscreen-desc": "Desative isso para deixar o Feathershot controlar o Print Screen diretamente.",
      "toggle-printscreen-unsupported-desc": "Este recurso est\xE1 dispon\xEDvel apenas no Windows.",
      "card-editor-behavior-title": "Comportamento do Editor",
      "card-editor-behavior-desc": "Configure como o editor de imagem abre ap\xF3s a captura.",
      "toggle-maximized-title": "Sempre abrir o editor maximizado",
      "toggle-maximized-desc": "A janela do editor sempre abrir\xE1 maximizada, independentemente do tamanho da imagem.",
      "card-startup-title": "Inicializa\xE7\xE3o",
      "card-startup-desc": "Controle se o aplicativo inicia automaticamente ao fazer login.",
      "toggle-startup-title": "Iniciar com o sistema",
      "toggle-startup-desc": "O Feathershot ser\xE1 executado na bandeja do sistema automaticamente ao fazer login.",
      "toggle-startup-unsupported-desc": "No Linux, configure a inicializa\xE7\xE3o autom\xE1tica pelo seu ambiente gr\xE1fico.",
      "card-storage-title": "Armazenamento e Nomea\xE7\xE3o",
      "card-storage-desc": "Configure onde as capturas de tela ser\xE3o salvas e como os arquivos ser\xE3o nomeados.",
      "label-save-folder": "Caminho da Pasta de Salvamento",
      "btn-browse-folder": "Procurar",
      "label-naming-template": "Modelo de Nome de Arquivo",
      "naming-hint": "Tokens suportados: {yyyy}, {month}, {day}, {hour}, {min}, {sec}, {ss}",
      "label-format": "Formato",
      "format-png": "PNG (Sem Perdas)",
      "format-jpeg": "JPEG (Compactado)",
      "format-webp": "WebP (Moderno)",
      "format-gif": "GIF (Est\xE1tico)",
      "card-theme-title": "Tema da Interface",
      "card-theme-desc": "Selecione o tema de apar\xEAncia para o aplicativo.",
      "theme-system": "Padr\xE3o do Sistema",
      "theme-dark": "Modo Escuro",
      "theme-light": "Modo Claro",
      "theme-linux": "Hyprland",
      "theme-macos": "MacOS",
      "btn-save-settings": "Salvar Configura\xE7\xF5es",
      "btn-cancel-settings": "Cancelar"
    }
  };
  function applyTranslations(lang) {
    const t = settingsTranslations[lang] || settingsTranslations.en;
    Object.keys(t).forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = t[id];
      }
    });
    if (currentSettings.supportsAutoLaunch === false) {
      const startupDesc = document.getElementById("toggle-startup-desc");
      if (startupDesc && t["toggle-startup-unsupported-desc"]) {
        startupDesc.textContent = t["toggle-startup-unsupported-desc"];
      }
    }
    if (lang === "pt") {
      hotkeyInput.placeholder = "Pressione as teclas...";
      filenamePatternInput.placeholder = "Captura_{yyyy}-{month}-{day}";
    } else {
      hotkeyInput.placeholder = "Press a hotkey...";
      filenamePatternInput.placeholder = "Screenshot_{yyyy}-{month}-{day}";
    }
  }
  let currentSettings = {};
  let isRecordingHotkey = false;
  function updateHotkeyWarning() {
    if (!hotkeyWarning) return;
    const shortcut = hotkeyInput.value;
    if (shortcut === "PrintScreen") {
      hotkeyWarning.style.display = "block";
      hotkeyWarning.textContent = settingsTranslations[currentSettings.resolvedLanguage || "en"]?.["hotkey-warning"] || settingsTranslations.en["hotkey-warning"];
    } else {
      hotkeyWarning.style.display = "none";
      hotkeyWarning.textContent = "";
    }
  }
  function applyTheme(theme) {
    const effectiveTheme = theme === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" : theme;
    document.documentElement.setAttribute("data-theme", effectiveTheme);
    const logoIcons = document.querySelectorAll(".logo-icon");
    logoIcons.forEach((logo) => {
      if (effectiveTheme === "linux") {
        logo.src = "../assets/icons/main-hyprland.png";
      } else if (effectiveTheme === "macos") {
        logo.src = "../assets/icons/main-macos.png";
      } else {
        logo.src = "../assets/icons/main.png";
      }
    });
    if (themePreviews) {
      const btns = themePreviews.querySelectorAll(".theme-btn");
      btns.forEach((b) => b.classList.toggle("active", b.dataset.theme === theme));
    }
  }
  async function initSettings() {
    currentSettings = await window.api.getSettings();
    applyTranslations(currentSettings.resolvedLanguage || "en");
    const versionLabel = document.getElementById("app-version");
    if (versionLabel) {
      versionLabel.textContent = currentSettings.appVersion || "";
    }
    const radio = document.querySelector(`input[name="default-action"][value="${currentSettings.defaultAction}"]`);
    if (radio) {
      radio.checked = true;
    }
    hotkeyInput.value = currentSettings.shortcut;
    folderInput.value = currentSettings.saveFolder;
    updateHotkeyWarning();
    filenamePatternInput.value = currentSettings.fileNamePattern;
    formatSelect.value = currentSettings.imageFormat;
    languageSelect.value = currentSettings.language || "auto";
    toggleMaximized.checked = currentSettings.alwaysMaximized || false;
    toggleStartup.checked = currentSettings.startAtLogin || currentSettings.startWithWindows || false;
    if (currentSettings.supportsAutoLaunch === false) {
      toggleStartup.checked = false;
      toggleStartup.disabled = true;
      const startupDesc = document.getElementById("toggle-startup-desc");
      const t = settingsTranslations[currentSettings.resolvedLanguage || "en"] || settingsTranslations.en;
      if (startupDesc && t["toggle-startup-unsupported-desc"]) {
        startupDesc.textContent = t["toggle-startup-unsupported-desc"];
      }
    }
    if (togglePrintscreen) {
      togglePrintscreen.checked = currentSettings.windowsPrintScreenSnip !== false;
      if (!currentSettings.supportsWindowsPrintScreenToggle) {
        togglePrintscreen.checked = false;
        togglePrintscreen.disabled = true;
        const printDesc = document.getElementById("toggle-printscreen-unsupported-desc");
        const t = settingsTranslations[currentSettings.resolvedLanguage || "en"] || settingsTranslations.en;
        if (printDesc && t["toggle-printscreen-unsupported-desc"]) {
          printDesc.textContent = t["toggle-printscreen-unsupported-desc"];
        }
      }
    }
    themeSelect.value = currentSettings.theme || "dark";
    applyTheme(currentSettings.theme || "dark");
    if (currentSettings.updateVersion) {
      showUpdateBanner("available", currentSettings.updateVersion);
    }
    if (window.api.sendUpdateAction) {
      window.api.sendUpdateAction("check");
    }
  }
  winClose.addEventListener("click", () => window.api.closeWindow());
  btnCancel.addEventListener("click", () => window.api.closeWindow());
  browseBtn.addEventListener("click", async () => {
    const selectedPath = await window.api.selectFolder();
    if (selectedPath) {
      folderInput.value = selectedPath;
    }
  });
  printScreenBtn.addEventListener("click", () => {
    if (isRecordingHotkey) {
      isRecordingHotkey = false;
      recordBtn.textContent = "Change Hotkey";
      hotkeyInput.classList.remove("recording");
    }
    hotkeyInput.value = "PrintScreen";
    currentSettings.shortcut = "PrintScreen";
    if (togglePrintscreen) {
      togglePrintscreen.checked = false;
    }
    updateHotkeyWarning();
    printScreenBtn.style.backgroundColor = "rgba(19, 190, 158, 0.2)";
    setTimeout(() => {
      printScreenBtn.style.backgroundColor = "";
    }, 400);
  });
  recordBtn.addEventListener("click", () => {
    isRecordingHotkey = !isRecordingHotkey;
    if (isRecordingHotkey) {
      recordBtn.textContent = "Cancel...";
      hotkeyInput.value = "Press key combo...";
      hotkeyInput.classList.add("recording");
    } else {
      recordBtn.textContent = "Change Hotkey";
      hotkeyInput.value = currentSettings.shortcut;
      hotkeyInput.classList.remove("recording");
      updateHotkeyWarning();
    }
  });
  hotkeyInput.addEventListener("click", () => recordBtn.click());
  window.addEventListener("keydown", (e) => {
    if (!isRecordingHotkey) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.key === "Escape") {
      isRecordingHotkey = false;
      recordBtn.textContent = "Change Hotkey";
      hotkeyInput.value = currentSettings.shortcut;
      hotkeyInput.classList.remove("recording");
      return;
    }
    const keys = [];
    if (e.ctrlKey || e.metaKey) keys.push("CommandOrControl");
    if (e.shiftKey) keys.push("Shift");
    if (e.altKey) keys.push("Alt");
    const keyName = e.key;
    if (["Control", "Shift", "Alt", "Meta"].includes(keyName)) {
      return;
    }
    let baseKey = keyName;
    if (keyName === " ") baseKey = "Space";
    else if (keyName === "ArrowUp") baseKey = "Up";
    else if (keyName === "ArrowDown") baseKey = "Down";
    else if (keyName === "ArrowLeft") baseKey = "Left";
    else if (keyName === "ArrowRight") baseKey = "Right";
    else if (keyName === "PrintScreen" || keyName === "Snapshot") baseKey = "PrintScreen";
    else if (keyName === "PageUp") baseKey = "PageUp";
    else if (keyName === "PageDown") baseKey = "PageDown";
    else if (keyName === "Delete") baseKey = "Delete";
    else if (keyName === "Insert") baseKey = "Insert";
    else if (keyName === "Home") baseKey = "Home";
    else if (keyName === "End") baseKey = "End";
    else if (keyName.startsWith("F") && keyName.length > 1 && !isNaN(keyName.substring(1))) baseKey = keyName;
    else if (keyName.length === 1) baseKey = keyName.toUpperCase();
    const hasModifier = e.ctrlKey || e.shiftKey || e.altKey || e.metaKey;
    const isSpecialKey = baseKey.length > 1;
    if (!hasModifier && !isSpecialKey) {
      return;
    }
    keys.push(baseKey);
    const shortcutString = keys.join("+");
    hotkeyInput.value = shortcutString;
    currentSettings.shortcut = shortcutString;
    if (shortcutString === "PrintScreen" && togglePrintscreen) {
      togglePrintscreen.checked = false;
    }
    isRecordingHotkey = false;
    recordBtn.textContent = "Change Hotkey";
    hotkeyInput.classList.remove("recording");
    updateHotkeyWarning();
  });
  btnSave.addEventListener("click", async () => {
    const selectedAction = document.querySelector('input[name="default-action"]:checked').value;
    let shortcutValue = hotkeyInput.value;
    if (isRecordingHotkey || shortcutValue === "Press key combo..." || shortcutValue === "Pressione as teclas...") {
      shortcutValue = currentSettings.shortcut || "CommandOrControl+Shift+S";
      isRecordingHotkey = false;
      recordBtn.textContent = "Change Hotkey";
      hotkeyInput.classList.remove("recording");
    }
    const newSettings = {
      shortcut: shortcutValue,
      defaultAction: selectedAction,
      saveFolder: folderInput.value,
      fileNamePattern: filenamePatternInput.value,
      imageFormat: formatSelect.value,
      alwaysMaximized: toggleMaximized.checked,
      startAtLogin: toggleStartup.checked,
      windowsPrintScreenSnip: shortcutValue === "PrintScreen" ? false : togglePrintscreen ? togglePrintscreen.checked : true,
      language: languageSelect.value,
      theme: themeSelect.value
    };
    await window.api.saveSettings(newSettings);
    window.api.closeWindow();
  });
  themeSelect.addEventListener("change", () => {
    const theme = themeSelect.value;
    applyTheme(theme);
  });
  languageSelect.addEventListener("change", () => {
    let lang = languageSelect.value;
    if (lang === "auto") {
      lang = currentSettings.resolvedLanguage || "en";
    }
    applyTranslations(lang);
  });
  const updateTranslations = {
    en: {
      available_title: "Update Available \u2014 v{version}",
      available_desc: "A new version of Feathershot is available. Click to download.",
      downloading_title: "Downloading Update \u2014 v{version}",
      downloading_desc: "Please wait while the update is being downloaded...",
      downloaded_title: "Update Ready \u2014 v{version}",
      downloaded_desc: "The update has been downloaded. Restart to apply.",
      btn_download: "Download",
      btn_downloading: "Downloading...",
      btn_restart: "Restart Now",
      current_version: "Current version: v{version}"
    },
    pt: {
      available_title: "Atualiza\xE7\xE3o Dispon\xEDvel \u2014 v{version}",
      available_desc: "Uma nova vers\xE3o do Feathershot est\xE1 dispon\xEDvel. Clique para baixar.",
      downloading_title: "Baixando Atualiza\xE7\xE3o \u2014 v{version}",
      downloading_desc: "Aguarde enquanto a atualiza\xE7\xE3o est\xE1 sendo baixada...",
      downloaded_title: "Atualiza\xE7\xE3o Pronta \u2014 v{version}",
      downloaded_desc: "A atualiza\xE7\xE3o foi baixada. Reinicie para aplicar.",
      btn_download: "Baixar",
      btn_downloading: "Baixando...",
      btn_restart: "Reiniciar Agora",
      current_version: "Vers\xE3o atual: v{version}"
    }
  };
  function getUpdateLang() {
    let lang = languageSelect.value;
    if (lang === "auto") lang = currentSettings.resolvedLanguage || "en";
    return updateTranslations[lang] || updateTranslations.en;
  }
  function showUpdateBanner(state, version) {
    updateState = state;
    pendingUpdateVersion = version;
    const t = getUpdateLang();
    updateBanner.style.display = "flex";
    updateBanner.classList.remove("downloaded");
    updateProgressContainer.style.display = "none";
    btnUpdateAction.className = "update-btn";
    if (state === "available") {
      updateBannerTitle.textContent = t.available_title.replace("{version}", version);
      updateBannerDesc.textContent = t.available_desc;
      btnUpdateAction.textContent = t.btn_download;
      btnUpdateAction.className = "update-btn";
    } else if (state === "downloading") {
      updateBannerTitle.textContent = t.downloading_title.replace("{version}", version);
      updateBannerDesc.textContent = t.downloading_desc;
      btnUpdateAction.textContent = t.btn_downloading;
      btnUpdateAction.className = "update-btn downloading";
      updateProgressContainer.style.display = "flex";
    } else if (state === "downloaded") {
      updateBannerTitle.textContent = t.downloaded_title.replace("{version}", version);
      updateBannerDesc.textContent = t.downloaded_desc;
      btnUpdateAction.textContent = t.btn_restart;
      btnUpdateAction.className = "update-btn restart";
      updateBanner.classList.add("downloaded");
      updateProgressContainer.style.display = "none";
    }
  }
  if (window.api.onUpdateStatus) {
    window.api.onUpdateStatus((data) => {
      if (data.type === "available") {
        showUpdateBanner("available", data.version);
      } else if (data.type === "progress") {
        if (updateState !== "downloading") {
          showUpdateBanner("downloading", pendingUpdateVersion);
        }
        const percent = Math.round(data.percent);
        updateProgressFill.style.width = percent + "%";
        updateProgressText.textContent = percent + "%";
      } else if (data.type === "downloaded") {
        showUpdateBanner("downloaded", data.version);
      } else if (data.type === "error") {
        if (pendingUpdateVersion) {
          showUpdateBanner("available", pendingUpdateVersion);
        }
      }
    });
  }
  initSettings();
  if (window.api.onReloadSettings) {
    window.api.onReloadSettings(() => {
      initSettings();
    });
  }
})();
