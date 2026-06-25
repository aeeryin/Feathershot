#pragma once
#include <QDialog>
#include <QLineEdit>
#include <QComboBox>
#include <QCheckBox>
#include <QSlider>
#include <QLabel>
#include <QPushButton>
#include <QGroupBox>
#include <QButtonGroup>

class SettingsWindow : public QDialog {
    Q_OBJECT
public:
    explicit SettingsWindow(QWidget* parent = nullptr);
    
signals:
    void settingsSaved();
    
private slots:
    void onSave();
    void onThemeChanged(int index);
    void onWatermarkToggled(bool checked);
    void onWatermarkLogoOnlyToggled(bool checked);
    void onOpacityChanged(int value);
    void onBrowseFolder();
    
private:
    void setupUI();
    void loadSettings();
    void applyTheme(const QString& theme);
    void applyCustomTheme();
    
    QLineEdit* m_hotkeyEdit;
    
    QButtonGroup* m_actionGroup;
    
    QLineEdit* m_folderEdit;
    QPushButton* m_browseBtn;
    QComboBox* m_formatCombo;
    QLineEdit* m_patternEdit;
    
    QCheckBox* m_maximizedCheck;
    QCheckBox* m_startupCheck;
    
    QComboBox* m_languageCombo;
    
    QComboBox* m_themeCombo;
    QWidget* m_customThemeWidget;
    QPushButton* m_customBgMainBtn;
    QPushButton* m_customBgCardBtn;
    QPushButton* m_customAccentBtn;
    QPushButton* m_customTextBtn;
    
    QCheckBox* m_watermarkCheck;
    QWidget* m_watermarkOptions;
    QLineEdit* m_watermarkText;
    QComboBox* m_watermarkPosition;
    QSlider* m_watermarkOpacity;
    QLabel* m_opacityLabel;
    QCheckBox* m_watermarkLogoOnly;
    
    QPushButton* m_saveBtn;
};
