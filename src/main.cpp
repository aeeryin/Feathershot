#include <QApplication>
#include <QSystemTrayIcon>
#include <QMenu>
#include <QAction>
#include <QShortcut>
#include <QKeySequence>
#include <QScreen>
#include <QPixmap>
#include <QClipboard>
#include <QMessageBox>
#include <QSharedMemory>
#include <QTimer>
#include <QTranslator>
#include <QDir>
#include <QStandardPaths>
#include "core/core.h"
#include "ui/cropperwindow.h"
#include "ui/editorwindow.h"
#include "ui/settingswindow.h"
#include "ui/introwindow.h"

static QString buildThemeStylesheet(const QString& theme) {
    auto& s = SettingsManager::instance();
    if (theme == "dark") {
        return QStringLiteral(
            "QWidget { background-color: #121214; color: #f5f5f7; font-family: 'Segoe UI', 'SF Pro Text', sans-serif; }"
            "QDialog, QMessageBox { background-color: #1c1c21; }"
            "QGroupBox { border: 1px solid #2a2a2f; border-radius: 8px; margin-top: 12px; padding-top: 16px; font-weight: 600; }"
            "QGroupBox::title { subcontrol-origin: margin; left: 12px; padding: 0 6px; }"
            "QLineEdit, QComboBox, QSpinBox { background-color: #242428; border: 1px solid #3a3a3f; border-radius: 6px; padding: 6px 10px; color: #f5f5f7; selection-background-color: #13BE9E; }"
            "QLineEdit:focus, QComboBox:focus { border-color: #13BE9E; }"
            "QComboBox::drop-down { subcontrol-origin: padding; subcontrol-position: center right; width: 24px; border: none; }"
            "QComboBox QAbstractItemView { background-color: #242428; border: 1px solid #3a3a3f; selection-background-color: #13BE9E; color: #f5f5f7; }"
            "QPushButton { background-color: #13BE9E; color: #121214; border: none; border-radius: 6px; padding: 8px 18px; font-weight: 600; }"
            "QPushButton:hover { background-color: #15d4b0; }"
            "QPushButton:pressed { background-color: #10a88a; }"
            "QPushButton[flat=\"true\"] { background-color: transparent; color: #13BE9E; }"
            "QPushButton[flat=\"true\"]:hover { background-color: #1c1c21; }"
            "QCheckBox { spacing: 8px; }"
            "QCheckBox::indicator { width: 18px; height: 18px; border-radius: 4px; border: 2px solid #3a3a3f; background-color: #242428; }"
            "QCheckBox::indicator:checked { background-color: #13BE9E; border-color: #13BE9E; }"
            "QSlider::groove:horizontal { height: 4px; background: #2a2a2f; border-radius: 2px; }"
            "QSlider::handle:horizontal { width: 16px; height: 16px; margin: -6px 0; background: #13BE9E; border-radius: 8px; }"
            "QSlider::sub-page:horizontal { background: #13BE9E; border-radius: 2px; }"
            "QToolBar { background-color: #1c1c21; border: none; spacing: 4px; padding: 4px; }"
            "QToolBar QToolButton { background-color: transparent; border: none; border-radius: 4px; padding: 6px; color: #f5f5f7; }"
            "QToolBar QToolButton:hover { background-color: #2a2a2f; }"
            "QToolBar QToolButton:checked { background-color: #13BE9E; color: #121214; }"
            "QLabel { color: #f5f5f7; }"
            "QMainWindow { background-color: #121214; }"
            "QStatusBar { background-color: #1c1c21; color: #8e8e93; }"
        );
    }
    if (theme == "light") {
        return QStringLiteral(
            "QWidget { background-color: #f5f5f7; color: #1d1d1f; font-family: 'Segoe UI', 'SF Pro Text', sans-serif; }"
            "QDialog, QMessageBox { background-color: #ffffff; }"
            "QGroupBox { border: 1px solid #d2d2d7; border-radius: 8px; margin-top: 12px; padding-top: 16px; font-weight: 600; }"
            "QGroupBox::title { subcontrol-origin: margin; left: 12px; padding: 0 6px; }"
            "QLineEdit, QComboBox, QSpinBox { background-color: #ffffff; border: 1px solid #d2d2d7; border-radius: 6px; padding: 6px 10px; color: #1d1d1f; selection-background-color: #007AFF; }"
            "QLineEdit:focus, QComboBox:focus { border-color: #007AFF; }"
            "QComboBox::drop-down { subcontrol-origin: padding; subcontrol-position: center right; width: 24px; border: none; }"
            "QComboBox QAbstractItemView { background-color: #ffffff; border: 1px solid #d2d2d7; selection-background-color: #007AFF; color: #1d1d1f; }"
            "QPushButton { background-color: #007AFF; color: #ffffff; border: none; border-radius: 6px; padding: 8px 18px; font-weight: 600; }"
            "QPushButton:hover { background-color: #1a8cff; }"
            "QPushButton:pressed { background-color: #0062cc; }"
            "QPushButton[flat=\"true\"] { background-color: transparent; color: #007AFF; }"
            "QPushButton[flat=\"true\"]:hover { background-color: #e8e8ed; }"
            "QCheckBox { spacing: 8px; }"
            "QCheckBox::indicator { width: 18px; height: 18px; border-radius: 4px; border: 2px solid #d2d2d7; background-color: #ffffff; }"
            "QCheckBox::indicator:checked { background-color: #007AFF; border-color: #007AFF; }"
            "QSlider::groove:horizontal { height: 4px; background: #d2d2d7; border-radius: 2px; }"
            "QSlider::handle:horizontal { width: 16px; height: 16px; margin: -6px 0; background: #007AFF; border-radius: 8px; }"
            "QSlider::sub-page:horizontal { background: #007AFF; border-radius: 2px; }"
            "QToolBar { background-color: #ffffff; border: none; spacing: 4px; padding: 4px; }"
            "QToolBar QToolButton { background-color: transparent; border: none; border-radius: 4px; padding: 6px; color: #1d1d1f; }"
            "QToolBar QToolButton:hover { background-color: #e8e8ed; }"
            "QToolBar QToolButton:checked { background-color: #007AFF; color: #ffffff; }"
            "QLabel { color: #1d1d1f; }"
            "QMainWindow { background-color: #f5f5f7; }"
            "QStatusBar { background-color: #ffffff; color: #86868b; }"
        );
    }
    if (theme == "hyprland" || theme == "linux") {
        return QStringLiteral(
            "QWidget { background-color: transparent; color: #cdd6f4; font-family: 'JetBrains Mono', 'Fira Code', monospace; }"
            "QDialog, QMessageBox { background-color: rgba(30, 30, 35, 0.7); }"
            "QGroupBox { border: 1px solid rgba(137, 180, 250, 0.3); border-radius: 8px; margin-top: 12px; padding-top: 16px; font-weight: 600; }"
            "QGroupBox::title { subcontrol-origin: margin; left: 12px; padding: 0 6px; }"
            "QLineEdit, QComboBox, QSpinBox { background-color: rgba(49, 50, 68, 0.6); border: 1px solid rgba(137, 180, 250, 0.3); border-radius: 6px; padding: 6px 10px; color: #cdd6f4; selection-background-color: #89b4fa; }"
            "QLineEdit:focus, QComboBox:focus { border-color: #89b4fa; }"
            "QComboBox::drop-down { subcontrol-origin: padding; subcontrol-position: center right; width: 24px; border: none; }"
            "QComboBox QAbstractItemView { background-color: rgba(49, 50, 68, 0.8); border: 1px solid rgba(137, 180, 250, 0.3); selection-background-color: #89b4fa; color: #cdd6f4; }"
            "QPushButton { background-color: #89b4fa; color: #1e1e2e; border: none; border-radius: 6px; padding: 8px 18px; font-weight: 600; }"
            "QPushButton:hover { background-color: #a0c4ff; }"
            "QPushButton:pressed { background-color: #74a8f0; }"
            "QPushButton[flat=\"true\"] { background-color: transparent; color: #89b4fa; }"
            "QPushButton[flat=\"true\"]:hover { background-color: rgba(49, 50, 68, 0.6); }"
            "QCheckBox { spacing: 8px; }"
            "QCheckBox::indicator { width: 18px; height: 18px; border-radius: 4px; border: 2px solid rgba(137, 180, 250, 0.3); background-color: rgba(49, 50, 68, 0.6); }"
            "QCheckBox::indicator:checked { background-color: #89b4fa; border-color: #89b4fa; }"
            "QSlider::groove:horizontal { height: 4px; background: rgba(137, 180, 250, 0.3); border-radius: 2px; }"
            "QSlider::handle:horizontal { width: 16px; height: 16px; margin: -6px 0; background: #89b4fa; border-radius: 8px; }"
            "QSlider::sub-page:horizontal { background: #89b4fa; border-radius: 2px; }"
            "QToolBar { background-color: rgba(30, 30, 35, 0.5); border: none; spacing: 4px; padding: 4px; }"
            "QToolBar QToolButton { background-color: transparent; border: none; border-radius: 4px; padding: 6px; color: #cdd6f4; }"
            "QToolBar QToolButton:hover { background-color: rgba(49, 50, 68, 0.6); }"
            "QToolBar QToolButton:checked { background-color: #89b4fa; color: #1e1e2e; }"
            "QLabel { color: #cdd6f4; }"
            "QMainWindow { background-color: transparent; }"
            "QStatusBar { background-color: rgba(30, 30, 35, 0.5); color: #6c7086; }"
        );
    }
    if (theme == "macos") {
        return QStringLiteral(
            "QWidget { background-color: #1e1e1e; color: #ffffff; font-family: 'SF Pro Text', 'Helvetica Neue', sans-serif; }"
            "QDialog, QMessageBox { background-color: #2d2d2d; }"
            "QGroupBox { border: 1px solid #3d3d3d; border-radius: 8px; margin-top: 12px; padding-top: 16px; font-weight: 600; }"
            "QGroupBox::title { subcontrol-origin: margin; left: 12px; padding: 0 6px; }"
            "QLineEdit, QComboBox, QSpinBox { background-color: #383838; border: 1px solid #4d4d4d; border-radius: 6px; padding: 6px 10px; color: #ffffff; selection-background-color: #007AFF; }"
            "QLineEdit:focus, QComboBox:focus { border-color: #007AFF; }"
            "QComboBox::drop-down { subcontrol-origin: padding; subcontrol-position: center right; width: 24px; border: none; }"
            "QComboBox QAbstractItemView { background-color: #383838; border: 1px solid #4d4d4d; selection-background-color: #007AFF; color: #ffffff; }"
            "QPushButton { background-color: #007AFF; color: #ffffff; border: none; border-radius: 6px; padding: 8px 18px; font-weight: 600; }"
            "QPushButton:hover { background-color: #1a8cff; }"
            "QPushButton:pressed { background-color: #0062cc; }"
            "QPushButton[flat=\"true\"] { background-color: transparent; color: #007AFF; }"
            "QPushButton[flat=\"true\"]:hover { background-color: #383838; }"
            "QCheckBox { spacing: 8px; }"
            "QCheckBox::indicator { width: 18px; height: 18px; border-radius: 4px; border: 2px solid #4d4d4d; background-color: #383838; }"
            "QCheckBox::indicator:checked { background-color: #007AFF; border-color: #007AFF; }"
            "QSlider::groove:horizontal { height: 4px; background: #4d4d4d; border-radius: 2px; }"
            "QSlider::handle:horizontal { width: 16px; height: 16px; margin: -6px 0; background: #007AFF; border-radius: 8px; }"
            "QSlider::sub-page:horizontal { background: #007AFF; border-radius: 2px; }"
            "QToolBar { background-color: #2d2d2d; border: none; spacing: 4px; padding: 4px; }"
            "QToolBar QToolButton { background-color: transparent; border: none; border-radius: 4px; padding: 6px; color: #ffffff; }"
            "QToolBar QToolButton:hover { background-color: #383838; }"
            "QToolBar QToolButton:checked { background-color: #007AFF; color: #ffffff; }"
            "QLabel { color: #ffffff; }"
            "QMainWindow { background-color: #1e1e1e; }"
            "QStatusBar { background-color: #2d2d2d; color: #808080; }"
        );
    }
    if (theme == "custom") {
        QString bg = s.customBgMain().isEmpty() ? "#121214" : s.customBgMain();
        QString card = s.customBgCard().isEmpty() ? "#1c1c21" : s.customBgCard();
        QString accent = s.customAccent().isEmpty() ? "#13BE9E" : s.customAccent();
        QString text = s.customTextPrimary().isEmpty() ? "#f5f5f7" : s.customTextPrimary();
        QString hoverAccent = accent;
        if (accent.startsWith('#') && accent.length() == 7) {
            int r = accent.mid(1, 2).toInt(nullptr, 16);
            int g = accent.mid(3, 2).toInt(nullptr, 16);
            int b = accent.mid(5, 2).toInt(nullptr, 16);
            r = qMin(255, r + 20);
            g = qMin(255, g + 20);
            b = qMin(255, b + 20);
            hoverAccent = QString("#%1%2%3").arg(r, 2, 16, QChar('0'))
                                            .arg(g, 2, 16, QChar('0'))
                                            .arg(b, 2, 16, QChar('0'));
        }
        return QStringLiteral(
            "QWidget { background-color: %1; color: %4; font-family: 'Segoe UI', 'SF Pro Text', sans-serif; }"
            "QDialog, QMessageBox { background-color: %2; }"
            "QGroupBox { border: 1px solid %4; border-radius: 8px; margin-top: 12px; padding-top: 16px; font-weight: 600; opacity: 0.5; }"
            "QGroupBox::title { subcontrol-origin: margin; left: 12px; padding: 0 6px; }"
            "QLineEdit, QComboBox, QSpinBox { background-color: %2; border: 1px solid %4; border-radius: 6px; padding: 6px 10px; color: %4; selection-background-color: %3; }"
            "QLineEdit:focus, QComboBox:focus { border-color: %3; }"
            "QComboBox::drop-down { subcontrol-origin: padding; subcontrol-position: center right; width: 24px; border: none; }"
            "QComboBox QAbstractItemView { background-color: %2; border: 1px solid %4; selection-background-color: %3; color: %4; }"
            "QPushButton { background-color: %3; color: %1; border: none; border-radius: 6px; padding: 8px 18px; font-weight: 600; }"
            "QPushButton:hover { background-color: %5; }"
            "QPushButton:pressed { background-color: %3; }"
            "QPushButton[flat=\"true\"] { background-color: transparent; color: %3; }"
            "QPushButton[flat=\"true\"]:hover { background-color: %2; }"
            "QCheckBox { spacing: 8px; }"
            "QCheckBox::indicator { width: 18px; height: 18px; border-radius: 4px; border: 2px solid %4; background-color: %2; }"
            "QCheckBox::indicator:checked { background-color: %3; border-color: %3; }"
            "QSlider::groove:horizontal { height: 4px; background: %4; border-radius: 2px; opacity: 0.5; }"
            "QSlider::handle:horizontal { width: 16px; height: 16px; margin: -6px 0; background: %3; border-radius: 8px; }"
            "QSlider::sub-page:horizontal { background: %3; border-radius: 2px; }"
            "QToolBar { background-color: %2; border: none; spacing: 4px; padding: 4px; }"
            "QToolBar QToolButton { background-color: transparent; border: none; border-radius: 4px; padding: 6px; color: %4; }"
            "QToolBar QToolButton:hover { background-color: %2; opacity: 0.7; }"
            "QToolBar QToolButton:checked { background-color: %3; color: %1; }"
            "QLabel { color: %4; }"
            "QMainWindow { background-color: %1; }"
            "QStatusBar { background-color: %2; color: %4; opacity: 0.7; }"
        ).arg(bg, card, accent, text, hoverAccent);
    }
    return buildThemeStylesheet("dark");
}

int main(int argc, char* argv[]) {
    QSharedMemory sharedMemory("Feathershot_SingleInstance");
    if (!sharedMemory.create(1)) {
        QMessageBox::warning(nullptr, "Feathershot", "Feathershot is already running.");
        return 0;
    }

    QApplication app(argc, argv);
    app.setApplicationName("Feathershot");
    app.setOrganizationName("Feathershot");
    app.setApplicationDisplayName("Feathershot");
    app.setQuitOnLastWindowClosed(false);

    QApplication::setHighDpiScaleFactorRoundingPolicy(
        Qt::HighDpiScaleFactorRoundingPolicy::PassThrough);

    auto& settings = SettingsManager::instance();
    settings.load();

    QString lang = settings.resolvedLanguage();
    QTranslator translator;
    if (lang != "en") {
        QString qmPath = QString(":/translations/%1.qm").arg(lang);
        if (translator.load(qmPath)) {
            app.installTranslator(&translator);
        }
    }

    QString theme = settings.theme();
    app.setStyleSheet(buildThemeStylesheet(theme));

    QSystemTrayIcon trayIcon(&app);
    trayIcon.setIcon(QIcon(settings.logoPath()));
    trayIcon.setToolTip("Feathershot");

    QMenu trayMenu;
    QAction settingsAction("Settings", &trayMenu);
    QAction updatesAction("Check for Updates", &trayMenu);
    QAction quitAction("Quit", &trayMenu);
    trayMenu.addAction(&settingsAction);
    trayMenu.addAction(&updatesAction);
    trayMenu.addSeparator();
    trayMenu.addAction(&quitAction);
    trayIcon.setContextMenu(&trayMenu);

    trayIcon.show();

    QShortcut* globalShortcut = nullptr;

    auto registerShortcut = [&]() {
        if (globalShortcut) {
            globalShortcut->disconnect();
            globalShortcut->deleteLater();
            globalShortcut = nullptr;
        }
        QString key = settings.shortcut();
        if (!key.isEmpty()) {
            globalShortcut = new QShortcut(QKeySequence(key), nullptr);
            globalShortcut->setContext(Qt::ApplicationShortcut);
        }
    };

    registerShortcut();

    auto captureAndProcess = [&]() {
        QImage screenshot = ScreenshotManager::instance().captureScreen();
        if (screenshot.isNull()) return;
        QPixmap pixmap = QPixmap::fromImage(screenshot);
        QString action = settings.defaultAction();

        if (action == "editor") {
            CropperWindow* cropper = new CropperWindow(pixmap);
            cropper->showFullScreen();
            QObject::connect(cropper, &CropperWindow::regionSelected, [pixmap](const QRect& region) {
                QPixmap cropped = pixmap.copy(region);
                EditorWindow* editor = new EditorWindow(cropped);
                editor->setAttribute(Qt::WA_DeleteOnClose);
                editor->show();
            });
            QObject::connect(cropper, &CropperWindow::cancelled, cropper, &QObject::deleteLater);
            QObject::connect(cropper, &CropperWindow::regionSelected, cropper, &QObject::deleteLater);
        } else if (action == "clipboard") {
            QApplication::clipboard()->setPixmap(pixmap);
        } else if (action == "save") {
            QString savePath = settings.saveFolder();
            QDir().mkpath(savePath);
            QString fileName = settings.generateFileName();
            QString format = settings.imageFormat();
            QString filePath = savePath + "/" + fileName + "." + format;
            pixmap.save(filePath, format.toUtf8().constData());
        }
    };

    if (globalShortcut) {
        QObject::connect(globalShortcut, &QShortcut::activated, captureAndProcess);
    }

    SettingsWindow* settingsWindow = nullptr;

    QObject::connect(&settingsAction, &QAction::triggered, [&]() {
        if (!settingsWindow) {
            settingsWindow = new SettingsWindow();
            settingsWindow->setAttribute(Qt::WA_DeleteOnClose);
            QObject::connect(settingsWindow, &SettingsWindow::settingsSaved, [&]() {
                QString newTheme = settings.theme();
                app.setStyleSheet(buildThemeStylesheet(newTheme));
                trayIcon.setIcon(QIcon(settings.logoPath()));
                registerShortcut();
            });
            QObject::connect(settingsWindow, &SettingsWindow::destroyed, [&]() {
                settingsWindow = nullptr;
            });
        }
        settingsWindow->raise();
        settingsWindow->activateWindow();
        settingsWindow->show();
    });

    QObject::connect(&updatesAction, &QAction::triggered, [&]() {
        QMessageBox::information(nullptr, "Feathershot", "You are running the latest version.");
    });

    QObject::connect(&quitAction, &QAction::triggered, [&]() {
        trayIcon.hide();
        QApplication::quit();
    });

    QObject::connect(&trayIcon, &QSystemTrayIcon::activated, [&](QSystemTrayIcon::ActivationReason reason) {
        if (reason == QSystemTrayIcon::Trigger) {
            captureAndProcess();
        }
    });

    if (theme == "linux" || theme == "hyprland") {
        IntroWindow* intro = new IntroWindow();
        intro->show();
        QObject::connect(intro, &IntroWindow::introFinished, intro, &QWidget::deleteLater);
    }

    return app.exec();
}
