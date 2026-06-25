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
  const toggleWatermark = document.getElementById("toggle-watermark");
  const watermarkOptions = document.getElementById("watermark-options");
  const watermarkText = document.getElementById("watermark-text");
  const watermarkPosition = document.getElementById("watermark-position");
  const watermarkOpacity = document.getElementById("watermark-opacity");
  const watermarkOpacityVal = document.getElementById("watermark-opacity-val");
  const toggleWatermarkLogoOnly = document.getElementById("toggle-watermark-logo-only");
  const customThemeOptions = document.getElementById("custom-theme-options");
  const customBgMain = document.getElementById("custom-bg-main");
  const customBgMainHex = document.getElementById("custom-bg-main-hex");
  const customBgCard = document.getElementById("custom-bg-card");
  const customBgCardHex = document.getElementById("custom-bg-card-hex");
  const customAccent = document.getElementById("custom-accent");
  const customAccentHex = document.getElementById("custom-accent-hex");
  const customText = document.getElementById("custom-text");
  const customTextHex = document.getElementById("custom-text-hex");
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
      "language-es": "Espa\xF1ol",
      "language-fr": "Fran\xE7ais",
      "language-de": "Deutsch",
      "language-ja": "\u65E5\u672C\u8A9E",
      "language-ko": "\uD55C\uAD6D\uC5B4",
      "language-zh": "\u4E2D\u6587",
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
      "theme-custom": "Custom Theme",
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
      "language-es": "Espanhol",
      "language-fr": "Franc\xEAs",
      "language-de": "Alem\xE3o",
      "language-ja": "Japon\xEAs",
      "language-ko": "Coreano",
      "language-zh": "Chin\xEAs",
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
      "theme-custom": "Tema Personalizado",
      "btn-save-settings": "Salvar Configura\xE7\xF5es",
      "btn-cancel-settings": "Cancelar"
    },
    es: {
      "app-title": "Configuraci\xF3n de Feathershot",
      "card-default-action-title": "Acci\xF3n Predeterminada",
      "card-default-action-desc": "Elija qu\xE9 sucede despu\xE9s de seleccionar y recortar un \xE1rea de pantalla.",
      "action-editor-title": "Abrir en Editor",
      "action-editor-desc": "A\xF1adir anotaciones, texto, desenfoque y marcado en el editor visual.",
      "action-clipboard-title": "Copiar directamente al Portapapeles",
      "action-clipboard-desc": "Omitir el editor y copiar el recorte directamente al portapapeles.",
      "action-save-title": "Guardar directamente en carpeta",
      "action-save-desc": "Guardar autom\xE1ticamente el archivo sin preguntar en su destino.",
      "card-language-title": "Idioma",
      "card-language-desc": "Seleccione el idioma de visualizaci\xF3n de la aplicaci\xF3n.",
      "language-auto": "Autom\xE1tico (Idioma del Sistema)",
      "language-en": "Ingl\xE9s",
      "language-pt": "Portugu\xE9s",
      "language-es": "Espa\xF1ol",
      "language-fr": "Franc\xE9s",
      "language-de": "Alem\xE1n",
      "language-ja": "Japon\xE9s",
      "language-ko": "Coreano",
      "language-zh": "Chino",
      "card-hotkey-title": "Atajo de Teclado",
      "card-hotkey-desc": "Tecla de acceso r\xE1pido para iniciar la captura de pantalla.",
      "btn-record-hotkey": "Cambiar Atajo",
      "card-theme-title": "Tema de Interfaz",
      "card-theme-desc": "Seleccione el tema de apariencia de la aplicaci\xF3n.",
      "theme-system": "Predeterminado del Sistema",
      "theme-dark": "Modo Oscuro",
      "theme-light": "Modo Claro",
      "theme-linux": "Hyprland",
      "theme-macos": "MacOS",
      "theme-custom": "Tema Personalizado",
      "btn-save-settings": "Guardar Configuraciones",
      "btn-cancel-settings": "Cancelar"
    },
    fr: {
      "app-title": "Param\xE8tres Feathershot",
      "card-default-action-title": "Action par D\xE9faut",
      "card-default-action-desc": "Choisissez ce qui se passe apr\xE8s la s\xE9lection et le recadrage d'une zone.",
      "action-editor-title": "Ouvrir dans l'\xC9diteur",
      "action-editor-desc": "Ajouter des annotations, du texte, du flou et du markup.",
      "action-clipboard-title": "Copier directement dans le Presse-papiers",
      "action-clipboard-desc": "Ignorer l'\xE9diteur et copier directement le recadrage.",
      "action-save-title": "Enregistrer directement dans le dossier",
      "action-save-desc": "Enregistrer automatiquement le fichier sans demander.",
      "card-language-title": "Langue",
      "card-language-desc": "S\xE9lectionnez la langue d'affichage de l'application.",
      "language-auto": "Automatique (Langue du Syst\xE8me)",
      "language-en": "Anglais",
      "language-pt": "Portugais",
      "language-es": "Espagnol",
      "language-fr": "Fran\xE7ais",
      "language-de": "Allemand",
      "language-ja": "Japonais",
      "language-ko": "Cor\xE9en",
      "language-zh": "Chinois",
      "card-theme-title": "Th\xE8me de l'Interface",
      "card-theme-desc": "S\xE9lectionnez le th\xE8me d'apparence de l'application.",
      "theme-system": "Par D\xE9faut du Syst\xE8me",
      "theme-dark": "Mode Sombre",
      "theme-light": "Mode Clair",
      "theme-linux": "Hyprland",
      "theme-macos": "MacOS",
      "theme-custom": "Th\xE8me Personnalis\xE9",
      "btn-save-settings": "Enregistrer",
      "btn-cancel-settings": "Annuler"
    },
    de: {
      "app-title": "Feathershot Einstellungen",
      "card-default-action-title": "Standardaktion",
      "card-default-action-desc": "W\xE4hlen Sie, was nach dem Ausw\xE4hlen und Zuschneiden passiert.",
      "action-editor-title": "Im Editor \xF6ffnen",
      "action-editor-desc": "Anmerkungen, Text, Unsch\xE4rfe und Markup hinzuf\xFCgen.",
      "action-clipboard-title": "Direkt in Zwischenablage kopieren",
      "action-clipboard-desc": "Editor \xFCberspringen und Zuschnitt direkt kopieren.",
      "action-save-title": "Direkt in Ordner speichern",
      "action-save-desc": "Datei automatisch ohne Nachfrage speichern.",
      "card-language-title": "Sprache",
      "card-language-desc": "W\xE4hlen Sie die Anzeigesprache der Anwendung.",
      "language-auto": "Automatisch (Systemsprache)",
      "language-en": "Englisch",
      "language-pt": "Portugiesisch",
      "language-es": "Spanisch",
      "language-fr": "Franz\xF6sisch",
      "language-de": "Deutsch",
      "language-ja": "Japanisch",
      "language-ko": "Koreanisch",
      "language-zh": "Chinesisch",
      "card-theme-title": "Oberfl\xE4chenthema",
      "card-theme-desc": "W\xE4hlen Sie das Aussehens-Thema der Anwendung.",
      "theme-system": "Systemstandard",
      "theme-dark": "Dunkelmodus",
      "theme-light": "Hellmodus",
      "theme-linux": "Hyprland",
      "theme-macos": "MacOS",
      "theme-custom": "Benutzerdefiniertes Thema",
      "btn-save-settings": "Einstellungen Speichern",
      "btn-cancel-settings": "Abbrechen"
    },
    ja: {
      "app-title": "Feathershot \u8A2D\u5B9A",
      "card-default-action-title": "\u30C7\u30D5\u30A9\u30EB\u30C8\u30A2\u30AF\u30B7\u30E7\u30F3",
      "card-default-action-desc": "\u753B\u9762\u9818\u57DF\u3092\u9078\u629E\u3057\u3066\u30AD\u30E3\u30D7\u30C1\u30E3\u3057\u305F\u5F8C\u306E\u52D5\u4F5C\u3092\u9078\u629E\u3057\u307E\u3059\u3002",
      "action-editor-title": "\u30A8\u30C7\u30A3\u30BF\u3067\u958B\u304F",
      "action-clipboard-title": "\u30AF\u30EA\u30C3\u30D7\u30DC\u30FC\u30C9\u306B\u76F4\u63A5\u30B3\u30D4\u30FC",
      "action-save-title": "\u30D5\u30A9\u30EB\u30C0\u306B\u76F4\u63A5\u4FDD\u5B58",
      "card-language-title": "\u8A00\u8A9E",
      "card-language-desc": "\u30A2\u30D7\u30EA\u306E\u8868\u793A\u8A00\u8A9E\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
      "language-auto": "\u81EA\u52D5\uFF08\u30B7\u30B9\u30C6\u30E0\u8A00\u8A9E\uFF09",
      "language-en": "\u82F1\u8A9E",
      "language-pt": "\u30DD\u30EB\u30C8\u30AC\u30EB\u8A9E",
      "language-es": "\u30B9\u30DA\u30A4\u30F3\u8A9E",
      "language-fr": "\u30D5\u30E9\u30F3\u30B9\u8A9E",
      "language-de": "\u30C9\u30A4\u30C4\u8A9E",
      "language-ja": "\u65E5\u672C\u8A9E",
      "language-ko": "\u97D3\u56FD\u8A9E",
      "language-zh": "\u4E2D\u56FD\u8A9E",
      "card-theme-title": "\u30A4\u30F3\u30BF\u30FC\u30D5\u30A7\u30FC\u30B9\u30C6\u30FC\u30DE",
      "theme-system": "\u30B7\u30B9\u30C6\u30E0\u30C7\u30D5\u30A9\u30EB\u30C8",
      "theme-dark": "\u30C0\u30FC\u30AF\u30E2\u30FC\u30C9",
      "theme-light": "\u30E9\u30A4\u30C8\u30E2\u30FC\u30C9",
      "theme-linux": "Hyprland",
      "theme-macos": "MacOS",
      "theme-custom": "\u30AB\u30B9\u30BF\u30E0\u30C6\u30FC\u30DE",
      "btn-save-settings": "\u8A2D\u5B9A\u3092\u4FDD\u5B58",
      "btn-cancel-settings": "\u30AD\u30E3\u30F3\u30BB\u30EB"
    },
    ko: {
      "app-title": "Feathershot \uC124\uC815",
      "card-default-action-title": "\uAE30\uBCF8 \uB3D9\uC791",
      "card-default-action-desc": "\uD654\uBA74 \uC601\uC5ED\uC744 \uC120\uD0DD\uD558\uACE0 \uCEA1\uCC98\uD55C \uD6C4\uC758 \uB3D9\uC791\uC744 \uC120\uD0DD\uD569\uB2C8\uB2E4.",
      "action-editor-title": "\uD3B8\uC9D1\uAE30\uC5D0\uC11C \uC5F4\uAE30",
      "action-clipboard-title": "\uD074\uB9BD\uBCF4\uB4DC\uC5D0 \uC9C1\uC811 \uBCF5\uC0AC",
      "action-save-title": "\uD3F4\uB354\uC5D0 \uC9C1\uC811 \uC800\uC7A5",
      "card-language-title": "\uC5B8\uC5B4",
      "card-language-desc": "\uC571\uC758 \uD45C\uC2DC \uC5B8\uC5B4\uB97C \uC120\uD0DD\uD558\uC138\uC694.",
      "language-auto": "\uC790\uB3D9 (\uC2DC\uC2A4\uD15C \uC5B8\uC5B4)",
      "language-en": "\uC601\uC5B4",
      "language-pt": "\uD3EC\uB974\uD22C\uAC08\uC5B4",
      "language-es": "\uC2A4\uD398\uC778\uC5B4",
      "language-fr": "\uD504\uB791\uC2A4\uC5B4",
      "language-de": "\uB3C5\uC77C\uC5B4",
      "language-ja": "\uC77C\uBCF8\uC5B4",
      "language-ko": "\uD55C\uAD6D\uC5B4",
      "language-zh": "\uC911\uAD6D\uC5B4",
      "card-theme-title": "\uC778\uD130\uD398\uC774\uC2A4 \uD14C\uB9C8",
      "theme-system": "\uC2DC\uC2A4\uD15C \uAE30\uBCF8\uAC12",
      "theme-dark": "\uB2E4\uD06C \uBAA8\uB4DC",
      "theme-light": "\uB77C\uC774\uD2B8 \uBAA8\uB4DC",
      "theme-linux": "Hyprland",
      "theme-macos": "MacOS",
      "theme-custom": "\uC0AC\uC6A9\uC790 \uC9C0\uC815 \uD14C\uB9C8",
      "btn-save-settings": "\uC124\uC815 \uC800\uC7A5",
      "btn-cancel-settings": "\uCDE8\uC18C"
    },
    zh: {
      "app-title": "Feathershot \u8BBE\u7F6E",
      "card-default-action-title": "\u9ED8\u8BA4\u64CD\u4F5C",
      "card-default-action-desc": "\u9009\u62E9\u622A\u56FE\u540E\u7684\u64CD\u4F5C\u3002",
      "action-editor-title": "\u5728\u7F16\u8F91\u5668\u4E2D\u6253\u5F00",
      "action-clipboard-title": "\u76F4\u63A5\u590D\u5236\u5230\u526A\u8D34\u677F",
      "action-save-title": "\u76F4\u63A5\u4FDD\u5B58\u5230\u6587\u4EF6\u5939",
      "card-language-title": "\u8BED\u8A00",
      "card-language-desc": "\u9009\u62E9\u5E94\u7528\u7684\u663E\u793A\u8BED\u8A00\u3002",
      "language-auto": "\u81EA\u52A8\uFF08\u7CFB\u7EDF\u8BED\u8A00\uFF09",
      "language-en": "\u82F1\u8BED",
      "language-pt": "\u8461\u8404\u7259\u8BED",
      "language-es": "\u897F\u73ED\u7259\u8BED",
      "language-fr": "\u6CD5\u8BED",
      "language-de": "\u5FB7\u8BED",
      "language-ja": "\u65E5\u8BED",
      "language-ko": "\u97E9\u8BED",
      "language-zh": "\u4E2D\u6587",
      "card-theme-title": "\u754C\u9762\u4E3B\u9898",
      "theme-system": "\u7CFB\u7EDF\u9ED8\u8BA4",
      "theme-dark": "\u6DF1\u8272\u6A21\u5F0F",
      "theme-light": "\u6D45\u8272\u6A21\u5F0F",
      "theme-linux": "Hyprland",
      "theme-macos": "MacOS",
      "theme-custom": "\u81EA\u5B9A\u4E49\u4E3B\u9898",
      "btn-save-settings": "\u4FDD\u5B58\u8BBE\u7F6E",
      "btn-cancel-settings": "\u53D6\u6D88"
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
      theme: themeSelect.value,
      watermarkEnabled: toggleWatermark ? toggleWatermark.checked : false,
      watermarkText: watermarkText ? watermarkText.value : "Feathershot",
      watermarkPosition: watermarkPosition ? watermarkPosition.value : "bottom-right",
      watermarkOpacity: watermarkOpacity ? watermarkOpacity.value / 100 : 0.3,
      watermarkLogoOnly: toggleWatermarkLogoOnly ? toggleWatermarkLogoOnly.checked : false,
      customThemeColors: themeSelect.value === "custom" ? {
        bgMain: customBgMain ? customBgMain.value : "#121214",
        bgCard: customBgCard ? customBgCard.value : "#1c1c21",
        accentColor: customAccent ? customAccent.value : "#13BE9E",
        textPrimary: customText ? customText.value : "#f5f5f7"
      } : null
    };
    await window.api.saveSettings(newSettings);
    window.api.closeWindow();
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
  if (window.api && window.api.onUpdateStatus) {
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
  toggleWatermark.addEventListener("change", () => {
    watermarkOptions.style.display = toggleWatermark.checked ? "block" : "none";
  });
  watermarkOpacity.addEventListener("input", () => {
    watermarkOpacityVal.textContent = watermarkOpacity.value + "%";
  });
  themeSelect.addEventListener("change", () => {
    const theme = themeSelect.value;
    applyTheme(theme);
    customThemeOptions.style.display = theme === "custom" ? "block" : "none";
    if (theme === "custom") {
      applyCustomThemeToPage();
    } else {
      const root = document.documentElement;
      root.style.removeProperty("--bg-main");
      root.style.removeProperty("--bg-card");
      root.style.removeProperty("--accent-color");
      root.style.removeProperty("--text-primary");
    }
  });
  function applyCustomThemeToPage() {
    const root = document.documentElement;
    root.style.setProperty("--bg-main", customBgMain.value);
    root.style.setProperty("--bg-card", customBgCard.value);
    root.style.setProperty("--accent-color", customAccent.value);
    root.style.setProperty("--text-primary", customText.value);
  }
  function syncColorInputs(colorInput, hexInput) {
    colorInput.addEventListener("input", () => {
      hexInput.value = colorInput.value;
      applyCustomThemeToPage();
    });
    hexInput.addEventListener("input", () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) {
        colorInput.value = hexInput.value;
        applyCustomThemeToPage();
      }
    });
  }
  syncColorInputs(customBgMain, customBgMainHex);
  syncColorInputs(customBgCard, customBgCardHex);
  syncColorInputs(customAccent, customAccentHex);
  syncColorInputs(customText, customTextHex);
  async function loadAdvancedSettings() {
    try {
      const s = await window.api.getSettings();
      if (toggleWatermark) toggleWatermark.checked = s.watermarkEnabled || false;
      if (watermarkOptions) watermarkOptions.style.display = s.watermarkEnabled ? "block" : "none";
      if (watermarkText) watermarkText.value = s.watermarkText || "Feathershot";
      if (watermarkPosition) watermarkPosition.value = s.watermarkPosition || "bottom-right";
      if (watermarkOpacity) {
        watermarkOpacity.value = s.watermarkOpacity * 100 || 30;
        watermarkOpacityVal.textContent = (s.watermarkOpacity * 100 || 30) + "%";
      }
      if (toggleWatermarkLogoOnly) toggleWatermarkLogoOnly.checked = s.watermarkLogoOnly || false;
      if (s.customThemeColors) {
        if (customBgMain) customBgMain.value = s.customThemeColors.bgMain || "#121214";
        if (customBgMainHex) customBgMainHex.value = s.customThemeColors.bgMain || "#121214";
        if (customBgCard) customBgCard.value = s.customThemeColors.bgCard || "#1c1c21";
        if (customBgCardHex) customBgCardHex.value = s.customThemeColors.bgCard || "#1c1c21";
        if (customAccent) customAccent.value = s.customThemeColors.accentColor || "#13BE9E";
        if (customAccentHex) customAccentHex.value = s.customThemeColors.accentColor || "#13BE9E";
        if (customText) customText.value = s.customThemeColors.textPrimary || "#f5f5f7";
        if (customTextHex) customTextHex.value = s.customThemeColors.textPrimary || "#f5f5f7";
      }
      customThemeOptions.style.display = s.theme === "custom" ? "block" : "none";
    } catch (err) {
      console.error("Failed to load advanced settings:", err);
    }
  }
  loadAdvancedSettings();
})();
