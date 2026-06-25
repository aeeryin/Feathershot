#pragma once

#include <QObject>
#include <QString>
#include <QJsonObject>
#include <QKeySequence>
#include <QImage>
#include <functional>

class QNetworkAccessManager;
class QRect;

class SettingsManager : public QObject {
    Q_OBJECT
public:
    static SettingsManager& instance();

    void load();
    void save();

    QString shortcut() const;
    QString defaultAction() const;
    QString saveFolder() const;
    QString imageFormat() const;
    QString fileNamePattern() const;
    bool alwaysMaximized() const;
    bool startAtLogin() const;
    QString language() const;
    QString theme() const;

    bool watermarkEnabled() const;
    QString watermarkText() const;
    QString watermarkPosition() const;
    double watermarkOpacity() const;
    bool watermarkLogoOnly() const;

    QString customBgMain() const;
    QString customBgCard() const;
    QString customAccent() const;
    QString customTextPrimary() const;

    void setShortcut(const QString&);
    void setDefaultAction(const QString&);
    void setSaveFolder(const QString&);
    void setImageFormat(const QString&);
    void setFileNamePattern(const QString&);
    void setAlwaysMaximized(bool);
    void setStartAtLogin(bool);
    void setLanguage(const QString&);
    void setTheme(const QString&);
    void setWatermarkEnabled(bool);
    void setWatermarkText(const QString&);
    void setWatermarkPosition(const QString&);
    void setWatermarkOpacity(double);
    void setWatermarkLogoOnly(bool);
    void setCustomThemeColors(const QString& bg, const QString& card, const QString& accent, const QString& text);

    QString resolvedLanguage() const;
    QString generateFileName() const;
    QString logoPath() const;

signals:
    void settingsChanged();

private:
    SettingsManager();
    QJsonObject m_data;
};

class ScreenshotManager : public QObject {
    Q_OBJECT
public:
    static ScreenshotManager& instance();

    QImage captureScreen(int screenIndex = -1);
    QImage captureRegion(const QRect& region, int screenIndex = -1);

    QRect screenGeometry(int screenIndex = -1);
    int screenCount();

private:
    ScreenshotManager();
};

class ApiManager : public QObject {
    Q_OBJECT
public:
    static ApiManager& instance();

    void ocrExtract(const QImage& image, const QString& lang, std::function<void(const QString&, bool)> callback);
    void translateText(const QString& text, const QString& fromLang, const QString& toLang, std::function<void(const QString&, bool)> callback);

private:
    ApiManager();
    QNetworkAccessManager* m_networkManager;
};
