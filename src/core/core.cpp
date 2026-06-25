#include "core.h"
#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QStandardPaths>
#include <QDir>
#include <QScreen>
#include <QGuiApplication>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QUrlQuery>
#include <QBuffer>
#include <QDateTime>
#include <QPainter>
#include <QLocale>

static QString settingsPath() {
    QString base = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    QDir().mkpath(base);
    return base + "/config.json";
}

SettingsManager& SettingsManager::instance() {
    static SettingsManager mgr;
    return mgr;
}

SettingsManager::SettingsManager() {
    load();
}

void SettingsManager::load() {
    QFile f(settingsPath());
    if (f.exists() && f.open(QIODevice::ReadOnly)) {
        m_data = QJsonDocument::fromJson(f.readAll()).object();
        f.close();
    }

    QJsonObject defaults;
    defaults["shortcut"] = "CommandOrControl+Shift+S";
    defaults["defaultAction"] = "editor";
    defaults["saveFolder"] = QStandardPaths::writableLocation(QStandardPaths::PicturesLocation) + "/Feathershot";
    defaults["imageFormat"] = "png";
    defaults["fileNamePattern"] = "Screenshot_{yyyy}-{mm}-{dd}_{hh}-{mm}-{ss}";
    defaults["language"] = "auto";
    defaults["theme"] = "dark";
    defaults["alwaysMaximized"] = false;
    defaults["startAtLogin"] = false;
    defaults["watermarkEnabled"] = false;
    defaults["watermarkText"] = "Feathershot";
    defaults["watermarkPosition"] = "bottom-right";
    defaults["watermarkOpacity"] = 0.3;
    defaults["watermarkLogoOnly"] = false;
    defaults["customBgMain"] = "";
    defaults["customBgCard"] = "";
    defaults["customAccent"] = "";
    defaults["customTextPrimary"] = "";

    for (auto it = defaults.begin(); it != defaults.end(); ++it) {
        if (!m_data.contains(it.key())) {
            m_data[it.key()] = it.value();
        }
    }
}

void SettingsManager::save() {
    QDir().mkpath(QFileInfo(settingsPath()).absolutePath());
    QFile f(settingsPath());
    if (f.open(QIODevice::WriteOnly)) {
        f.write(QJsonDocument(m_data).toJson());
        f.close();
    }
}

QString SettingsManager::shortcut() const { return m_data["shortcut"].toString(); }
QString SettingsManager::defaultAction() const { return m_data["defaultAction"].toString(); }
QString SettingsManager::saveFolder() const { return m_data["saveFolder"].toString(); }
QString SettingsManager::imageFormat() const { return m_data["imageFormat"].toString(); }
QString SettingsManager::fileNamePattern() const { return m_data["fileNamePattern"].toString(); }
bool SettingsManager::alwaysMaximized() const { return m_data["alwaysMaximized"].toBool(); }
bool SettingsManager::startAtLogin() const { return m_data["startAtLogin"].toBool(); }
QString SettingsManager::language() const { return m_data["language"].toString(); }
QString SettingsManager::theme() const { return m_data["theme"].toString(); }
bool SettingsManager::watermarkEnabled() const { return m_data["watermarkEnabled"].toBool(); }
QString SettingsManager::watermarkText() const { return m_data["watermarkText"].toString(); }
QString SettingsManager::watermarkPosition() const { return m_data["watermarkPosition"].toString(); }
double SettingsManager::watermarkOpacity() const { return m_data["watermarkOpacity"].toDouble(); }
bool SettingsManager::watermarkLogoOnly() const { return m_data["watermarkLogoOnly"].toBool(); }
QString SettingsManager::customBgMain() const { return m_data["customBgMain"].toString(); }
QString SettingsManager::customBgCard() const { return m_data["customBgCard"].toString(); }
QString SettingsManager::customAccent() const { return m_data["customAccent"].toString(); }
QString SettingsManager::customTextPrimary() const { return m_data["customTextPrimary"].toString(); }

void SettingsManager::setShortcut(const QString& v) { m_data["shortcut"] = v; emit settingsChanged(); }
void SettingsManager::setDefaultAction(const QString& v) { m_data["defaultAction"] = v; emit settingsChanged(); }
void SettingsManager::setSaveFolder(const QString& v) { m_data["saveFolder"] = v; emit settingsChanged(); }
void SettingsManager::setImageFormat(const QString& v) { m_data["imageFormat"] = v; emit settingsChanged(); }
void SettingsManager::setFileNamePattern(const QString& v) { m_data["fileNamePattern"] = v; emit settingsChanged(); }
void SettingsManager::setAlwaysMaximized(bool v) { m_data["alwaysMaximized"] = v; emit settingsChanged(); }
void SettingsManager::setStartAtLogin(bool v) { m_data["startAtLogin"] = v; emit settingsChanged(); }
void SettingsManager::setLanguage(const QString& v) { m_data["language"] = v; emit settingsChanged(); }
void SettingsManager::setTheme(const QString& v) { m_data["theme"] = v; emit settingsChanged(); }
void SettingsManager::setWatermarkEnabled(bool v) { m_data["watermarkEnabled"] = v; emit settingsChanged(); }
void SettingsManager::setWatermarkText(const QString& v) { m_data["watermarkText"] = v; emit settingsChanged(); }
void SettingsManager::setWatermarkPosition(const QString& v) { m_data["watermarkPosition"] = v; emit settingsChanged(); }
void SettingsManager::setWatermarkOpacity(double v) { m_data["watermarkOpacity"] = v; emit settingsChanged(); }
void SettingsManager::setWatermarkLogoOnly(bool v) { m_data["watermarkLogoOnly"] = v; emit settingsChanged(); }

void SettingsManager::setCustomThemeColors(const QString& bg, const QString& card, const QString& accent, const QString& text) {
    m_data["customBgMain"] = bg;
    m_data["customBgCard"] = card;
    m_data["customAccent"] = accent;
    m_data["customTextPrimary"] = text;
    emit settingsChanged();
}

QString SettingsManager::resolvedLanguage() const {
    if (m_data["language"].toString() == "auto") {
        return QLocale::system().name().left(2);
    }
    return m_data["language"].toString();
}

QString SettingsManager::generateFileName() const {
    QDateTime now = QDateTime::currentDateTime();
    QString pattern = m_data["fileNamePattern"].toString();
    pattern.replace("{yyyy}", now.toString("yyyy"));
    pattern.replace("{mm}", now.toString("MM"));
    pattern.replace("{dd}", now.toString("dd"));
    pattern.replace("{hh}", now.toString("hh"));
    pattern.replace("{mm}", now.toString("mm"));
    pattern.replace("{ss}", now.toString("ss"));
    return pattern;
}

QString SettingsManager::logoPath() const {
    QString t = theme();
    if (t == "hyprland") return ":/icons/main-hyprland.png";
    if (t == "macos") return ":/icons/main-macos.png";
    return ":/icons/main.png";
}

ScreenshotManager& ScreenshotManager::instance() {
    static ScreenshotManager mgr;
    return mgr;
}

ScreenshotManager::ScreenshotManager() {}

QImage ScreenshotManager::captureScreen(int screenIndex) {
    QList<QScreen*> screens = QGuiApplication::screens();
    if (screens.isEmpty()) return QImage();

    if (screenIndex >= 0 && screenIndex < screens.size()) {
        QScreen* screen = screens.at(screenIndex);
        QPixmap pixmap = screen->grabWindow(0);
        return pixmap.toImage();
    }

    int totalWidth = 0, totalHeight = 0;
    for (QScreen* screen : screens) {
        totalWidth += screen->geometry().width();
        totalHeight = qMax(totalHeight, screen->geometry().height());
    }

    QImage composite(totalWidth, totalHeight, QImage::Format_ARGB32);
    composite.fill(Qt::black);
    QPainter painter(&composite);

    int xOffset = 0;
    for (QScreen* screen : screens) {
        QPixmap pixmap = screen->grabWindow(0);
        painter.drawPixmap(xOffset, 0, pixmap);
        xOffset += screen->geometry().width();
    }
    painter.end();
    return composite;
}

QImage ScreenshotManager::captureRegion(const QRect& region, int screenIndex) {
    QImage full = captureScreen(screenIndex);
    if (full.isNull()) return QImage();
    return full.copy(region);
}

QRect ScreenshotManager::screenGeometry(int screenIndex) {
    QList<QScreen*> screens = QGuiApplication::screens();
    if (screens.isEmpty()) return QRect();
    if (screenIndex >= 0 && screenIndex < screens.size()) {
        return screens.at(screenIndex)->geometry();
    }
    int totalWidth = 0, maxHeight = 0;
    for (QScreen* screen : screens) {
        totalWidth += screen->geometry().width();
        maxHeight = qMax(maxHeight, screen->geometry().height());
    }
    return QRect(0, 0, totalWidth, maxHeight);
}

int ScreenshotManager::screenCount() {
    return QGuiApplication::screens().size();
}

ApiManager& ApiManager::instance() {
    static ApiManager mgr;
    return mgr;
}

ApiManager::ApiManager() : m_networkManager(new QNetworkAccessManager(this)) {}

void ApiManager::ocrExtract(const QImage& image, const QString& lang, std::function<void(const QString&, bool)> callback) {
    QByteArray ba;
    QBuffer buffer(&ba);
    buffer.open(QIODevice::WriteOnly);
    image.save(&buffer, "PNG");
    QString base64 = ba.toBase64();

    QUrl url("https://api.ocr.space/parse/image");
    QUrlQuery params;
    params.addQueryItem("apikey", "K85587724388957");
    params.addQueryItem("base64Image", "data:image/png;base64," + base64);
    params.addQueryItem("language", lang);
    params.addQueryItem("isOverlayRequired", "false");

    QNetworkRequest request(url);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/x-www-form-urlencoded");

    QNetworkReply* reply = m_networkManager->post(request, params.toString(QUrl::FullyEncoded).toUtf8());
    connect(reply, &QNetworkReply::finished, [reply, callback]() {
        reply->deleteLater();
        if (reply->error() != QNetworkReply::NoError) {
            callback(reply->errorString(), false);
            return;
        }
        QByteArray data = reply->readAll();
        QJsonDocument doc = QJsonDocument::fromJson(data);
        QJsonObject obj = doc.object();
        QJsonArray results = obj["ParsedResults"].toArray();
        if (!results.isEmpty()) {
            QString text = results[0].toObject()["ParsedText"].toString();
            callback(text, true);
        } else {
            callback(obj["ErrorMessage"].toString(), false);
        }
    });
}

void ApiManager::translateText(const QString& text, const QString& fromLang, const QString& toLang, std::function<void(const QString&, bool)> callback) {
    QUrl url("https://api.mymemory.translated.net/get");
    QUrlQuery params;
    params.addQueryItem("q", text);
    params.addQueryItem("langpair", fromLang + "|" + toLang);
    url.setQuery(params);

    QNetworkRequest request(url);
    QNetworkReply* reply = m_networkManager->get(request);
    connect(reply, &QNetworkReply::finished, [reply, callback]() {
        reply->deleteLater();
        if (reply->error() != QNetworkReply::NoError) {
            callback(reply->errorString(), false);
            return;
        }
        QByteArray data = reply->readAll();
        QJsonDocument doc = QJsonDocument::fromJson(data);
        QJsonObject obj = doc.object();
        QString translated = obj["responseData"].toObject()["translatedText"].toString();
        callback(translated, true);
    });
}
