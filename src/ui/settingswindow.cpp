#include "settingswindow.h"
#include "core/core.h"
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QScrollArea>
#include <QRadioButton>
#include <QFrame>
#include <QFileDialog>
#include <QColorDialog>
#include <QStyleFactory>
#include <QApplication>
#include <QFont>
#include <QScreen>
#include <QCheckBox>

static QFrame* createCard(QWidget* parent) {
    QFrame* card = new QFrame(parent);
    card->setObjectName("card");
    card->setStyleSheet(
        "#card { background: rgba(255,255,255,6); border: 1px solid rgba(255,255,255,8); border-radius: 12px; padding: 20px; }"
    );
    return card;
}

static QLabel* createSectionLabel(const QString& text, QWidget* parent) {
    QLabel* label = new QLabel(text, parent);
    QFont font = label->font();
    font.setPointSize(11);
    font.setBold(true);
    label->setFont(font);
    label->setStyleSheet("color: rgba(255,255,255,200); margin-bottom: 4px;");
    return label;
}

static QLabel* createHintLabel(const QString& text, QWidget* parent) {
    QLabel* label = new QLabel(text, parent);
    label->setStyleSheet("color: rgba(255,255,255,120); font-size: 11px;");
    label->setWordWrap(true);
    return label;
}

SettingsWindow::SettingsWindow(QWidget* parent)
    : QDialog(parent)
{
    setWindowTitle("Settings");
    setMinimumSize(520, 600);
    setModal(true);
    setupUI();
    loadSettings();
}

void SettingsWindow::setupUI() {
    QVBoxLayout* mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(0, 0, 0, 0);
    mainLayout->setSpacing(0);

    QScrollArea* scrollArea = new QScrollArea(this);
    scrollArea->setWidgetResizable(true);
    scrollArea->setFrameShape(QFrame::NoFrame);
    scrollArea->setHorizontalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
    scrollArea->setStyleSheet("QScrollArea { background: transparent; } QScrollBar:vertical { width: 6px; background: transparent; } QScrollBar::handle:vertical { background: rgba(255,255,255,30); border-radius: 3px; min-height: 30px; } QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical { height: 0; }");

    QWidget* container = new QWidget(scrollArea);
    container->setStyleSheet("background: transparent;");
    QVBoxLayout* layout = new QVBoxLayout(container);
    layout->setContentsMargins(24, 24, 24, 24);
    layout->setSpacing(16);

    QLabel* title = new QLabel("Settings", container);
    QFont titleFont = title->font();
    titleFont.setPointSize(16);
    titleFont.setBold(true);
    title->setFont(titleFont);
    title->setStyleSheet("color: white; margin-bottom: 8px;");
    layout->addWidget(title);

    QFrame* hotkeyCard = createCard(container);
    QVBoxLayout* hotkeyLayout = new QVBoxLayout(hotkeyCard);
    hotkeyLayout->setContentsMargins(0, 0, 0, 0);
    hotkeyLayout->setSpacing(8);
    hotkeyLayout->addWidget(createSectionLabel("Global Hotkey", hotkeyCard));
    hotkeyLayout->addWidget(createHintLabel("Shortcut to take a screenshot from anywhere.", hotkeyCard));
    m_hotkeyEdit = new QLineEdit(hotkeyCard);
    m_hotkeyEdit->setPlaceholderText("e.g. CommandOrControl+Shift+S");
    m_hotkeyEdit->setStyleSheet("QLineEdit { background: rgba(255,255,255,6); border: 1px solid rgba(255,255,255,12); border-radius: 8px; padding: 8px 12px; color: white; font-size: 13px; } QLineEdit:focus { border-color: rgba(100,180,255,180); }");
    hotkeyLayout->addWidget(m_hotkeyEdit);
    layout->addWidget(hotkeyCard);

    QFrame* actionCard = createCard(container);
    QVBoxLayout* actionLayout = new QVBoxLayout(actionCard);
    actionLayout->setContentsMargins(0, 0, 0, 0);
    actionLayout->setSpacing(8);
    actionLayout->addWidget(createSectionLabel("Default Action", actionCard));
    actionLayout->addWidget(createHintLabel("What happens after a screenshot is captured.", actionCard));
    m_actionGroup = new QButtonGroup(actionCard);
    QRadioButton* editorRadio = new QRadioButton("Open in Editor", actionCard);
    QRadioButton* clipboardRadio = new QRadioButton("Copy to Clipboard", actionCard);
    QRadioButton* autoSaveRadio = new QRadioButton("Auto-save to file", actionCard);
    QString radioStyle = "QRadioButton { color: rgba(255,255,255,200); font-size: 13px; spacing: 8px; } QRadioButton::indicator { width: 16px; height: 16px; border-radius: 8px; border: 2px solid rgba(255,255,255,40); background: transparent; } QRadioButton::indicator:checked { background: #6CB4EE; border-color: #6CB4EE; }";
    editorRadio->setStyleSheet(radioStyle);
    clipboardRadio->setStyleSheet(radioStyle);
    autoSaveRadio->setStyleSheet(radioStyle);
    m_actionGroup->addButton(editorRadio, 0);
    m_actionGroup->addButton(clipboardRadio, 1);
    m_actionGroup->addButton(autoSaveRadio, 2);
    actionLayout->addWidget(editorRadio);
    actionLayout->addWidget(clipboardRadio);
    actionLayout->addWidget(autoSaveRadio);
    layout->addWidget(actionCard);

    QFrame* saveCard = createCard(container);
    QVBoxLayout* saveLayout = new QVBoxLayout(saveCard);
    saveLayout->setContentsMargins(0, 0, 0, 0);
    saveLayout->setSpacing(8);
    saveLayout->addWidget(createSectionLabel("Save", saveCard));
    saveLayout->addWidget(createHintLabel("Default location and format for saving screenshots.", saveCard));

    QHBoxLayout* folderRow = new QHBoxLayout();
    folderRow->setSpacing(8);
    m_folderEdit = new QLineEdit(saveCard);
    m_folderEdit->setPlaceholderText("Save folder...");
    m_folderEdit->setStyleSheet("QLineEdit { background: rgba(255,255,255,6); border: 1px solid rgba(255,255,255,12); border-radius: 8px; padding: 8px 12px; color: white; font-size: 13px; } QLineEdit:focus { border-color: rgba(100,180,255,180); }");
    folderRow->addWidget(m_folderEdit, 1);
    m_browseBtn = new QPushButton("Browse", saveCard);
    m_browseBtn->setStyleSheet("QPushButton { background: rgba(255,255,255,10); border: 1px solid rgba(255,255,255,15); border-radius: 8px; padding: 8px 16px; color: rgba(255,255,255,200); font-size: 13px; } QPushButton:hover { background: rgba(255,255,255,18); }");
    connect(m_browseBtn, &QPushButton::clicked, this, &SettingsWindow::onBrowseFolder);
    folderRow->addWidget(m_browseBtn);
    saveLayout->addLayout(folderRow);

    QHBoxLayout* formatRow = new QHBoxLayout();
    formatRow->setSpacing(12);
    QLabel* formatLabel = new QLabel("Format:", saveCard);
    formatLabel->setStyleSheet("color: rgba(255,255,255,160); font-size: 13px;");
    formatRow->addWidget(formatLabel);
    m_formatCombo = new QComboBox(saveCard);
    m_formatCombo->addItems({"PNG", "JPEG", "WebP", "BMP"});
    m_formatCombo->setStyleSheet("QComboBox { background: rgba(255,255,255,6); border: 1px solid rgba(255,255,255,12); border-radius: 8px; padding: 8px 12px; color: white; font-size: 13px; } QComboBox::drop-down { border: none; padding-right: 8px; } QComboBox::down-arrow { image: none; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 6px solid rgba(255,255,255,160); } QComboBox QAbstractItemView { background: #2a2a2a; border: 1px solid rgba(255,255,255,15); border-radius: 8px; color: white; selection-background-color: rgba(100,180,255,60); padding: 4px; }");
    formatRow->addWidget(m_formatCombo, 1);
    saveLayout->addLayout(formatRow);

    QHBoxLayout* patternRow = new QHBoxLayout();
    patternRow->setSpacing(12);
    QLabel* patternLabel = new QLabel("Pattern:", saveCard);
    patternLabel->setStyleSheet("color: rgba(255,255,255,160); font-size: 13px;");
    patternRow->addWidget(patternLabel);
    m_patternEdit = new QLineEdit(saveCard);
    m_patternEdit->setPlaceholderText("Screenshot_{yyyy}-{mm}-{dd}_{hh}-{mm}-{ss}");
    m_patternEdit->setStyleSheet("QLineEdit { background: rgba(255,255,255,6); border: 1px solid rgba(255,255,255,12); border-radius: 8px; padding: 8px 12px; color: white; font-size: 13px; } QLineEdit:focus { border-color: rgba(100,180,255,180); }");
    patternRow->addWidget(m_patternEdit, 1);
    saveLayout->addLayout(patternRow);
    layout->addWidget(saveCard);

    QFrame* startupCard = createCard(container);
    QVBoxLayout* startupLayout = new QVBoxLayout(startupCard);
    startupLayout->setContentsMargins(0, 0, 0, 0);
    startupLayout->setSpacing(8);
    startupLayout->addWidget(createSectionLabel("Startup", startupCard));
    QString checkStyle = "QCheckBox { color: rgba(255,255,255,200); font-size: 13px; spacing: 8px; } QCheckBox::indicator { width: 18px; height: 18px; border-radius: 4px; border: 2px solid rgba(255,255,255,40); background: transparent; } QCheckBox::indicator:checked { background: #6CB4EE; border-color: #6CB4EE; image: none; }";
    m_maximizedCheck = new QCheckBox("Start window maximized", startupCard);
    m_maximizedCheck->setStyleSheet(checkStyle);
    m_startupCheck = new QCheckBox("Start at login", startupCard);
    m_startupCheck->setStyleSheet(checkStyle);
    startupLayout->addWidget(m_maximizedCheck);
    startupLayout->addWidget(m_startupCheck);
    layout->addWidget(startupCard);

    QFrame* langCard = createCard(container);
    QVBoxLayout* langLayout = new QVBoxLayout(langCard);
    langLayout->setContentsMargins(0, 0, 0, 0);
    langLayout->setSpacing(8);
    langLayout->addWidget(createSectionLabel("Language", langCard));
    langLayout->addWidget(createHintLabel("Interface language. Changes take effect after restart.", langCard));
    m_languageCombo = new QComboBox(langCard);
    m_languageCombo->addItems({"English", "Portugues", "Espanol", "Francais", "Deutsch", "Japanese", "Korean", "Chinese"});
    m_languageCombo->setStyleSheet("QComboBox { background: rgba(255,255,255,6); border: 1px solid rgba(255,255,255,12); border-radius: 8px; padding: 8px 12px; color: white; font-size: 13px; } QComboBox::drop-down { border: none; padding-right: 8px; } QComboBox::down-arrow { image: none; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 6px solid rgba(255,255,255,160); } QComboBox QAbstractItemView { background: #2a2a2a; border: 1px solid rgba(255,255,255,15); border-radius: 8px; color: white; selection-background-color: rgba(100,180,255,60); padding: 4px; }");
    langLayout->addWidget(m_languageCombo);
    layout->addWidget(langCard);

    QFrame* themeCard = createCard(container);
    QVBoxLayout* themeLayout = new QVBoxLayout(themeCard);
    themeLayout->setContentsMargins(0, 0, 0, 0);
    themeLayout->setSpacing(8);
    themeLayout->addWidget(createSectionLabel("Theme", themeCard));
    m_themeCombo = new QComboBox(themeCard);
    m_themeCombo->addItems({"System", "Dark", "Light", "Hyprland", "macOS", "Custom"});
    m_themeCombo->setStyleSheet("QComboBox { background: rgba(255,255,255,6); border: 1px solid rgba(255,255,255,12); border-radius: 8px; padding: 8px 12px; color: white; font-size: 13px; } QComboBox::drop-down { border: none; padding-right: 8px; } QComboBox::down-arrow { image: none; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 6px solid rgba(255,255,255,160); } QComboBox QAbstractItemView { background: #2a2a2a; border: 1px solid rgba(255,255,255,15); border-radius: 8px; color: white; selection-background-color: rgba(100,180,255,60); padding: 4px; }");
    connect(m_themeCombo, QOverload<int>::of(&QComboBox::currentIndexChanged), this, &SettingsWindow::onThemeChanged);
    themeLayout->addWidget(m_themeCombo);

    m_customThemeWidget = new QWidget(themeCard);
    m_customThemeWidget->setStyleSheet("background: transparent;");
    QVBoxLayout* customLayout = new QVBoxLayout(m_customThemeWidget);
    customLayout->setContentsMargins(0, 8, 0, 0);
    customLayout->setSpacing(8);

    QString colorBtnStyle = "QPushButton { padding: 8px 14px; border-radius: 6px; font-size: 12px; color: white; } QPushButton:hover { opacity: 0.85; }";

    QHBoxLayout* bgMainRow = new QHBoxLayout();
    bgMainRow->setSpacing(12);
    QLabel* bgMainLabel = new QLabel("Background:", m_customThemeWidget);
    bgMainLabel->setStyleSheet("color: rgba(255,255,255,160); font-size: 12px;");
    bgMainRow->addWidget(bgMainLabel);
    m_customBgMainBtn = new QPushButton("Pick Color", m_customThemeWidget);
    m_customBgMainBtn->setStyleSheet(colorBtnStyle + "QPushButton { background: #3a3a3a; }");
    m_customBgMainBtn->setFixedWidth(100);
    bgMainRow->addWidget(m_customBgMainBtn);
    bgMainRow->addStretch();
    customLayout->addLayout(bgMainRow);

    QHBoxLayout* bgCardRow = new QHBoxLayout();
    bgCardRow->setSpacing(12);
    QLabel* bgCardLabel = new QLabel("Card:", m_customThemeWidget);
    bgCardLabel->setStyleSheet("color: rgba(255,255,255,160); font-size: 12px;");
    bgCardRow->addWidget(bgCardLabel);
    m_customBgCardBtn = new QPushButton("Pick Color", m_customThemeWidget);
    m_customBgCardBtn->setStyleSheet(colorBtnStyle + "QPushButton { background: #3a3a3a; }");
    m_customBgCardBtn->setFixedWidth(100);
    bgCardRow->addWidget(m_customBgCardBtn);
    bgCardRow->addStretch();
    customLayout->addLayout(bgCardRow);

    QHBoxLayout* accentRow = new QHBoxLayout();
    accentRow->setSpacing(12);
    QLabel* accentLabel = new QLabel("Accent:", m_customThemeWidget);
    accentLabel->setStyleSheet("color: rgba(255,255,255,160); font-size: 12px;");
    accentRow->addWidget(accentLabel);
    m_customAccentBtn = new QPushButton("Pick Color", m_customThemeWidget);
    m_customAccentBtn->setStyleSheet(colorBtnStyle + "QPushButton { background: #6CB4EE; }");
    m_customAccentBtn->setFixedWidth(100);
    accentRow->addWidget(m_customAccentBtn);
    accentRow->addStretch();
    customLayout->addLayout(accentRow);

    QHBoxLayout* textRow = new QHBoxLayout();
    textRow->setSpacing(12);
    QLabel* textLabel = new QLabel("Text:", m_customThemeWidget);
    textLabel->setStyleSheet("color: rgba(255,255,255,160); font-size: 12px;");
    textRow->addWidget(textLabel);
    m_customTextBtn = new QPushButton("Pick Color", m_customThemeWidget);
    m_customTextBtn->setStyleSheet(colorBtnStyle + "QPushButton { background: #e0e0e0; }");
    m_customTextBtn->setFixedWidth(100);
    textRow->addWidget(m_customTextBtn);
    textRow->addStretch();
    customLayout->addLayout(textRow);

    themeLayout->addWidget(m_customThemeWidget);
    m_customThemeWidget->hide();

    auto pickColor = [this](QPushButton* btn) {
        QColor current = btn->palette().color(QPalette::Button);
        QColor color = QColorDialog::getColor(current, this, "Choose Color", QColorDialog::ShowAlphaChannel);
        if (color.isValid()) {
            btn->setStyleSheet(QString("QPushButton { background: %1; padding: 8px 14px; border-radius: 6px; font-size: 12px; color: white; } QPushButton:hover { opacity: 0.85; }").arg(color.name()));
        }
    };
    connect(m_customBgMainBtn, &QPushButton::clicked, this, [this, pickColor]() { pickColor(m_customBgMainBtn); });
    connect(m_customBgCardBtn, &QPushButton::clicked, this, [this, pickColor]() { pickColor(m_customBgCardBtn); });
    connect(m_customAccentBtn, &QPushButton::clicked, this, [this, pickColor]() { pickColor(m_customAccentBtn); });
    connect(m_customTextBtn, &QPushButton::clicked, this, [this, pickColor]() { pickColor(m_customTextBtn); });

    layout->addWidget(themeCard);

    QFrame* watermarkCard = createCard(container);
    QVBoxLayout* watermarkLayout = new QVBoxLayout(watermarkCard);
    watermarkLayout->setContentsMargins(0, 0, 0, 0);
    watermarkLayout->setSpacing(8);
    watermarkLayout->addWidget(createSectionLabel("Watermark", watermarkCard));
    m_watermarkCheck = new QCheckBox("Enable watermark on screenshots", watermarkCard);
    m_watermarkCheck->setStyleSheet(checkStyle);
    connect(m_watermarkCheck, &QCheckBox::toggled, this, &SettingsWindow::onWatermarkToggled);
    watermarkLayout->addWidget(m_watermarkCheck);

    m_watermarkOptions = new QWidget(watermarkCard);
    m_watermarkOptions->setStyleSheet("background: transparent;");
    QVBoxLayout* wmOptLayout = new QVBoxLayout(m_watermarkOptions);
    wmOptLayout->setContentsMargins(0, 4, 0, 0);
    wmOptLayout->setSpacing(8);

    m_watermarkLogoOnly = new QCheckBox("Logo only (no text)", m_watermarkOptions);
    m_watermarkLogoOnly->setStyleSheet(checkStyle);
    connect(m_watermarkLogoOnly, &QCheckBox::toggled, this, &SettingsWindow::onWatermarkLogoOnlyToggled);
    wmOptLayout->addWidget(m_watermarkLogoOnly);

    m_watermarkText = new QLineEdit(m_watermarkOptions);
    m_watermarkText->setPlaceholderText("Watermark text...");
    m_watermarkText->setStyleSheet("QLineEdit { background: rgba(255,255,255,6); border: 1px solid rgba(255,255,255,12); border-radius: 8px; padding: 8px 12px; color: white; font-size: 13px; } QLineEdit:focus { border-color: rgba(100,180,255,180); }");
    wmOptLayout->addWidget(m_watermarkText);

    QHBoxLayout* posRow = new QHBoxLayout();
    posRow->setSpacing(12);
    QLabel* posLabel = new QLabel("Position:", m_watermarkOptions);
    posLabel->setStyleSheet("color: rgba(255,255,255,160); font-size: 13px;");
    posRow->addWidget(posLabel);
    m_watermarkPosition = new QComboBox(m_watermarkOptions);
    m_watermarkPosition->addItems({"Top-Left", "Top-Right", "Bottom-Left", "Bottom-Right", "Center"});
    m_watermarkPosition->setStyleSheet("QComboBox { background: rgba(255,255,255,6); border: 1px solid rgba(255,255,255,12); border-radius: 8px; padding: 8px 12px; color: white; font-size: 13px; } QComboBox::drop-down { border: none; padding-right: 8px; } QComboBox::down-arrow { image: none; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 6px solid rgba(255,255,255,160); } QComboBox QAbstractItemView { background: #2a2a2a; border: 1px solid rgba(255,255,255,15); border-radius: 8px; color: white; selection-background-color: rgba(100,180,255,60); padding: 4px; }");
    posRow->addWidget(m_watermarkPosition, 1);
    wmOptLayout->addLayout(posRow);

    QHBoxLayout* opacityRow = new QHBoxLayout();
    opacityRow->setSpacing(12);
    QLabel* opacityLbl = new QLabel("Opacity:", m_watermarkOptions);
    opacityLbl->setStyleSheet("color: rgba(255,255,255,160); font-size: 13px;");
    opacityRow->addWidget(opacityLbl);
    m_watermarkOpacity = new QSlider(Qt::Horizontal, m_watermarkOptions);
    m_watermarkOpacity->setRange(0, 100);
    m_watermarkOpacity->setStyleSheet("QSlider::groove:horizontal { height: 4px; background: rgba(255,255,255,20); border-radius: 2px; } QSlider::handle:horizontal { width: 16px; height: 16px; margin: -6px 0; background: #6CB4EE; border-radius: 8px; } QSlider::sub-page:horizontal { background: #6CB4EE; border-radius: 2px; }");
    connect(m_watermarkOpacity, &QSlider::valueChanged, this, &SettingsWindow::onOpacityChanged);
    opacityRow->addWidget(m_watermarkOpacity, 1);
    m_opacityLabel = new QLabel("30%", m_watermarkOptions);
    m_opacityLabel->setStyleSheet("color: rgba(255,255,255,160); font-size: 13px; min-width: 36px;");
    opacityRow->addWidget(m_opacityLabel);
    wmOptLayout->addLayout(opacityRow);

    watermarkLayout->addWidget(m_watermarkOptions);
    layout->addWidget(watermarkCard);

    layout->addStretch();

    m_saveBtn = new QPushButton("Save", container);
    m_saveBtn->setFixedHeight(44);
    m_saveBtn->setStyleSheet("QPushButton { background: #6CB4EE; color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: bold; } QPushButton:hover { background: #5aa0d8; } QPushButton:pressed { background: #4890c8; }");
    connect(m_saveBtn, &QPushButton::clicked, this, &SettingsWindow::onSave);
    layout->addWidget(m_saveBtn);

    scrollArea->setWidget(container);
    mainLayout->addWidget(scrollArea);

    applyTheme(SettingsManager::instance().theme());
}

void SettingsWindow::loadSettings() {
    SettingsManager& s = SettingsManager::instance();

    m_hotkeyEdit->setText(s.shortcut());

    QString action = s.defaultAction();
    if (action == "editor") m_actionGroup->button(0)->setChecked(true);
    else if (action == "clipboard") m_actionGroup->button(1)->setChecked(true);
    else m_actionGroup->button(2)->setChecked(true);

    m_folderEdit->setText(s.saveFolder());

    int fmtIndex = m_formatCombo->findText(s.imageFormat().toUpper());
    if (fmtIndex >= 0) m_formatCombo->setCurrentIndex(fmtIndex);

    m_patternEdit->setText(s.fileNamePattern());
    m_maximizedCheck->setChecked(s.alwaysMaximized());
    m_startupCheck->setChecked(s.startAtLogin());

    QStringList langs = {"en", "pt", "es", "fr", "de", "ja", "ko", "zh"};
    int langIndex = langs.indexOf(s.language());
    if (langIndex >= 0) m_languageCombo->setCurrentIndex(langIndex);

    QString theme = s.theme();
    QStringList themes = {"system", "dark", "light", "hyprland", "macos", "custom"};
    int themeIndex = themes.indexOf(theme);
    if (themeIndex >= 0) m_themeCombo->setCurrentIndex(themeIndex);

    auto loadColor = [](QPushButton* btn, const QString& color) {
        if (!color.isEmpty()) {
            btn->setStyleSheet(QString("QPushButton { background: %1; padding: 8px 14px; border-radius: 6px; font-size: 12px; color: white; } QPushButton:hover { opacity: 0.85; }").arg(color));
        }
    };
    loadColor(m_customBgMainBtn, s.customBgMain());
    loadColor(m_customBgCardBtn, s.customBgCard());
    loadColor(m_customAccentBtn, s.customAccent());
    loadColor(m_customTextBtn, s.customTextPrimary());

    m_watermarkCheck->setChecked(s.watermarkEnabled());
    m_watermarkOptions->setVisible(s.watermarkEnabled());
    m_watermarkText->setText(s.watermarkText());
    m_watermarkLogoOnly->setChecked(s.watermarkLogoOnly());
    m_watermarkText->setVisible(!s.watermarkLogoOnly());

    QStringList positions = {"Top-Left", "Top-Right", "Bottom-Left", "Bottom-Right", "Center"};
    int posIndex = positions.indexOf(s.watermarkPosition());
    if (posIndex >= 0) m_watermarkPosition->setCurrentIndex(posIndex);

    m_watermarkOpacity->setValue(static_cast<int>(s.watermarkOpacity() * 100));
    m_opacityLabel->setText(QString::number(m_watermarkOpacity->value()) + "%");
}

void SettingsWindow::onSave() {
    SettingsManager& s = SettingsManager::instance();

    s.setShortcut(m_hotkeyEdit->text());

    int checkedId = m_actionGroup->checkedId();
    if (checkedId == 0) s.setDefaultAction("editor");
    else if (checkedId == 1) s.setDefaultAction("clipboard");
    else s.setDefaultAction("autosave");

    s.setSaveFolder(m_folderEdit->text());
    s.setImageFormat(m_formatCombo->currentText().toLower());
    s.setFileNamePattern(m_patternEdit->text());
    s.setAlwaysMaximized(m_maximizedCheck->isChecked());
    s.setStartAtLogin(m_startupCheck->isChecked());

    QStringList langs = {"en", "pt", "es", "fr", "de", "ja", "ko", "zh"};
    int langIdx = m_languageCombo->currentIndex();
    if (langIdx >= 0 && langIdx < langs.size()) s.setLanguage(langs[langIdx]);

    QStringList themes = {"system", "dark", "light", "hyprland", "macos", "custom"};
    int themeIdx = m_themeCombo->currentIndex();
    if (themeIdx >= 0 && themeIdx < themes.size()) s.setTheme(themes[themeIdx]);

    auto pickBtnColor = [](QPushButton* btn) -> QString {
        QString ss = btn->styleSheet();
        int idx = ss.indexOf("background: ");
        if (idx < 0) return "";
        int start = idx + 12;
        int end = ss.indexOf(";", start);
        if (end < 0) end = ss.indexOf(";", start);
        return ss.mid(start, end - start).trimmed();
    };
    s.setCustomThemeColors(pickBtnColor(m_customBgMainBtn), pickBtnColor(m_customBgCardBtn), pickBtnColor(m_customAccentBtn), pickBtnColor(m_customTextBtn));

    s.setWatermarkEnabled(m_watermarkCheck->isChecked());
    s.setWatermarkText(m_watermarkText->text());
    s.setWatermarkLogoOnly(m_watermarkLogoOnly->isChecked());

    QStringList positions = {"Top-Left", "Top-Right", "Bottom-Left", "Bottom-Right", "Center"};
    int posIdx = m_watermarkPosition->currentIndex();
    if (posIdx >= 0 && posIdx < positions.size()) s.setWatermarkPosition(positions[posIdx]);

    s.setWatermarkOpacity(m_watermarkOpacity->value() / 100.0);

    s.save();
    emit settingsSaved();
    accept();
}

void SettingsWindow::onThemeChanged(int index) {
    m_customThemeWidget->setVisible(index == 5);
    QStringList themes = {"system", "dark", "light", "hyprland", "macos", "custom"};
    if (index >= 0 && index < themes.size()) {
        applyTheme(themes[index]);
    }
}

void SettingsWindow::onWatermarkToggled(bool checked) {
    m_watermarkOptions->setVisible(checked);
}

void SettingsWindow::onWatermarkLogoOnlyToggled(bool checked) {
    m_watermarkText->setVisible(!checked);
}

void SettingsWindow::onOpacityChanged(int value) {
    m_opacityLabel->setText(QString::number(value) + "%");
}

void SettingsWindow::onBrowseFolder() {
    QString folder = QFileDialog::getExistingDirectory(this, "Select Save Folder", m_folderEdit->text());
    if (!folder.isEmpty()) {
        m_folderEdit->setText(folder);
    }
}

void SettingsWindow::applyTheme(const QString& theme) {
    if (theme == "system") {
        if (QApplication::style()->objectName() == "fusion") {
            qApp->setStyle(QStyleFactory::create("Fusion"));
        }
        qApp->setPalette(qApp->style()->standardPalette());
        return;
    }

    qApp->setStyle(QStyleFactory::create("Fusion"));
    QPalette palette;

    if (theme == "dark" || theme == "hyprland" || theme == "macos") {
        palette.setColor(QPalette::Window, QColor(30, 30, 30));
        palette.setColor(QPalette::WindowText, Qt::white);
        palette.setColor(QPalette::Base, QColor(35, 35, 35));
        palette.setColor(QPalette::AlternateBase, QColor(40, 40, 40));
        palette.setColor(QPalette::Text, Qt::white);
        palette.setColor(QPalette::Button, QColor(45, 45, 45));
        palette.setColor(QPalette::ButtonText, Qt::white);
        palette.setColor(QPalette::Highlight, QColor(108, 180, 238));
        palette.setColor(QPalette::HighlightedText, Qt::white);
    } else if (theme == "light") {
        palette.setColor(QPalette::Window, QColor(245, 245, 245));
        palette.setColor(QPalette::WindowText, Qt::black);
        palette.setColor(QPalette::Base, Qt::white);
        palette.setColor(QPalette::AlternateBase, QColor(235, 235, 235));
        palette.setColor(QPalette::Text, Qt::black);
        palette.setColor(QPalette::Button, QColor(240, 240, 240));
        palette.setColor(QPalette::ButtonText, Qt::black);
        palette.setColor(QPalette::Highlight, QColor(108, 180, 238));
        palette.setColor(QPalette::HighlightedText, Qt::white);
    } else if (theme == "custom") {
        applyCustomTheme();
        return;
    }

    qApp->setPalette(palette);
}

void SettingsWindow::applyCustomTheme() {
    qApp->setStyle(QStyleFactory::create("Fusion"));
    auto pickBtnColor = [](QPushButton* btn) -> QString {
        QString ss = btn->styleSheet();
        int idx = ss.indexOf("background: ");
        if (idx < 0) return "";
        int start = idx + 12;
        int end = ss.indexOf(";", start);
        return ss.mid(start, end - start).trimmed();
    };

    QString bgMain = pickBtnColor(m_customBgMainBtn);
    QString bgCard = pickBtnColor(m_customBgCardBtn);
    QString accent = pickBtnColor(m_customAccentBtn);
    QString text = pickBtnColor(m_customTextBtn);

    QPalette palette;
    QColor bgColor = QColor(bgMain.isEmpty() ? "#1e1e1e" : bgMain);
    QColor cardColor = QColor(bgCard.isEmpty() ? "#2a2a2a" : bgCard);
    QColor accentColor = QColor(accent.isEmpty() ? "#6CB4EE" : accent);
    QColor textColor = QColor(text.isEmpty() ? "#ffffff" : text);

    palette.setColor(QPalette::Window, bgColor);
    palette.setColor(QPalette::WindowText, textColor);
    palette.setColor(QPalette::Base, cardColor);
    palette.setColor(QPalette::AlternateBase, bgColor);
    palette.setColor(QPalette::Text, textColor);
    palette.setColor(QPalette::Button, cardColor);
    palette.setColor(QPalette::ButtonText, textColor);
    palette.setColor(QPalette::Highlight, accentColor);
    palette.setColor(QPalette::HighlightedText, textColor);

    qApp->setPalette(palette);
}
