#include "editorwindow.h"
#include "core/core.h"
#include <QPainter>
#include <QMouseEvent>
#include <QClipboard>
#include <QApplication>
#include <QFileDialog>
#include <QMessageBox>
#include <QInputDialog>
#include <QComboBox>
#include <QLabel>
#include <QToolBar>
#include <QAction>
#include <QPrinter>
#include <QPrintDialog>
#include <QScrollArea>
#include <QVBoxLayout>
#include <QColorDialog>
#include <QFileInfo>
#include <QtMath>

EditorWindow::EditorWindow(const QPixmap& screenshot, QWidget* parent)
    : QMainWindow(parent), m_originalPixmap(screenshot), m_currentPixmap(screenshot)
{
    setupUI();
    setupToolbar();
    showMaximized();
}

void EditorWindow::setupUI()
{
    m_centralWidget = new QWidget(this);
    setCentralWidget(m_centralWidget);

    auto* layout = new QVBoxLayout(m_centralWidget);
    layout->setContentsMargins(0, 0, 0, 0);

    m_canvasLabel = new QLabel(m_centralWidget);
    m_canvasLabel->setPixmap(m_currentPixmap);
    m_canvasLabel->setAlignment(Qt::AlignCenter);
    m_canvasLabel->setMouseTracking(true);
    m_centralWidget->setMouseTracking(true);
    setMouseTracking(true);

    auto* scrollArea = new QScrollArea(m_centralWidget);
    scrollArea->setWidget(m_canvasLabel);
    scrollArea->setAlignment(Qt::AlignCenter);
    scrollArea->setWidgetResizable(true);

    layout->addWidget(scrollArea);
}

void EditorWindow::setupToolbar()
{
    m_toolBar = addToolBar("Tools");
    m_toolBar->setMovable(false);

    auto* copyAction = m_toolBar->addAction("Copy");
    copyAction->setShortcut(QKeySequence::Copy);
    connect(copyAction, &QAction::triggered, this, &EditorWindow::onCopy);

    auto* saveAction = m_toolBar->addAction("Save");
    saveAction->setShortcut(QKeySequence::Save);
    connect(saveAction, &QAction::triggered, this, &EditorWindow::onSave);

    m_toolBar->addSeparator();

    auto* undoAction = m_toolBar->addAction("Undo");
    undoAction->setShortcut(QKeySequence::Undo);
    connect(undoAction, &QAction::triggered, this, &EditorWindow::onUndo);

    auto* redoAction = m_toolBar->addAction("Redo");
    redoAction->setShortcut(QKeySequence::Redo);
    connect(redoAction, &QAction::triggered, this, &EditorWindow::onRedo);

    m_toolBar->addSeparator();

    auto* penAction = m_toolBar->addAction("Pen");
    penAction->setCheckable(true);
    connect(penAction, &QAction::triggered, [this]() { m_currentTool = 1; });

    auto* arrowAction = m_toolBar->addAction("Arrow");
    arrowAction->setCheckable(true);
    connect(arrowAction, &QAction::triggered, [this]() { m_currentTool = 2; });

    auto* rectAction = m_toolBar->addAction("Rect");
    rectAction->setCheckable(true);
    connect(rectAction, &QAction::triggered, [this]() { m_currentTool = 3; });

    auto* circleAction = m_toolBar->addAction("Circle");
    circleAction->setCheckable(true);
    connect(circleAction, &QAction::triggered, [this]() { m_currentTool = 4; });

    auto* textAction = m_toolBar->addAction("Text");
    textAction->setCheckable(true);
    connect(textAction, &QAction::triggered, [this]() { m_currentTool = 5; });

    auto* markerAction = m_toolBar->addAction("Marker");
    markerAction->setCheckable(true);
    connect(markerAction, &QAction::triggered, [this]() { m_currentTool = 6; });

    m_toolBar->addSeparator();

    m_formatCombo = new QComboBox(m_toolBar);
    m_formatCombo->addItems({"PNG", "JPG", "WebP"});
    m_formatCombo->setCurrentText(SettingsManager::instance().imageFormat().toUpper());
    connect(m_formatCombo, &QComboBox::currentTextChanged, this, &EditorWindow::onFormatChanged);
    m_toolBar->addWidget(m_formatCombo);

    auto* colorAction = m_toolBar->addAction("Color");
    connect(colorAction, &QAction::triggered, [this]() {
        QColor c = QColorDialog::getColor(m_drawColor, this, "Pick Color");
        if (c.isValid()) m_drawColor = c;
    });

    m_toolBar->addSeparator();

    auto* ocrAction = m_toolBar->addAction("OCR");
    connect(ocrAction, &QAction::triggered, this, &EditorWindow::onOCR);

    auto* translateAction = m_toolBar->addAction("Translate");
    connect(translateAction, &QAction::triggered, this, &EditorWindow::onTranslate);

    auto* exportPdfAction = m_toolBar->addAction("Export PDF");
    connect(exportPdfAction, &QAction::triggered, this, &EditorWindow::onExportPDF);
}

void EditorWindow::onCopy()
{
    QPixmap result = m_currentPixmap;
    QPainter painter(&result);
    for (const auto& obj : m_objects) {
        QPen pen(obj.color, obj.width);
        painter.setPen(pen);
        if (obj.type == DrawObject::Freehand && obj.points.size() > 1) {
            for (int i = 1; i < obj.points.size(); ++i)
                painter.drawLine(obj.points[i - 1], obj.points[i]);
        } else if (obj.type == DrawObject::Arrow && obj.points.size() == 2) {
            painter.drawLine(obj.points[0], obj.points[1]);
            QPolygonF arrowHead;
            QPointF dir = obj.points[1] - obj.points[0];
            qreal len = std::sqrt(dir.x() * dir.x() + dir.y() * dir.y());
            if (len > 0) {
                QPointF norm = dir / len;
                QPointF perp(-norm.y(), norm.x());
                arrowHead << obj.points[1];
                arrowHead << obj.points[1] - norm * 15 + perp * 8;
                arrowHead << obj.points[1] - norm * 15 - perp * 8;
                painter.setBrush(obj.color);
                painter.drawPolygon(arrowHead);
            }
        } else if (obj.type == DrawObject::Rectangle && obj.points.size() == 2) {
            painter.drawRect(QRectF(obj.points[0], obj.points[1]).normalized());
        } else if (obj.type == DrawObject::Circle && obj.points.size() == 2) {
            painter.drawEllipse(QRectF(obj.points[0], obj.points[1]).normalized());
        } else if (obj.type == DrawObject::Text && !obj.points.isEmpty()) {
            painter.drawText(obj.points[0], obj.text);
        } else if (obj.type == DrawObject::Marker && obj.points.size() > 1) {
            QPen markerPen(obj.color, obj.width * 3);
            markerPen.setCapStyle(Qt::RoundCap);
            painter.setPen(markerPen);
            for (int i = 1; i < obj.points.size(); ++i)
                painter.drawLine(obj.points[i - 1], obj.points[i]);
        }
    }
    painter.end();
    QApplication::clipboard()->setPixmap(result);
}

void EditorWindow::onSave()
{
    QString defaultSuffix = m_formatCombo->currentText().toLower();
    QString filter;
    if (defaultSuffix == "png") filter = "PNG (*.png)";
    else if (defaultSuffix == "jpg") filter = "JPEG (*.jpg)";
    else filter = "WebP (*.webp)";

    QString path = QFileDialog::getSaveFileName(this, "Save Image",
        SettingsManager::instance().saveFolder() + "/" + SettingsManager::instance().generateFileName() + "." + defaultSuffix,
        filter);
    if (!path.isEmpty())
        saveToFile(path);
}

void EditorWindow::saveToFile(const QString& filePath)
{
    if (filePath.endsWith(".pdf", Qt::CaseInsensitive)) {
        QPrinter printer(QPrinter::HighResolution);
        printer.setOutputFormat(QPrinter::PdfFormat);
        printer.setOutputFileName(filePath);
        QPainter painter(&printer);
        painter.drawPixmap(0, 0, m_currentPixmap);
        painter.end();
        return;
    }

    QPixmap result = m_currentPixmap;
    QPainter painter(&result);
    for (const auto& obj : m_objects) {
        QPen pen(obj.color, obj.width);
        painter.setPen(pen);
        if (obj.type == DrawObject::Freehand && obj.points.size() > 1) {
            for (int i = 1; i < obj.points.size(); ++i)
                painter.drawLine(obj.points[i - 1], obj.points[i]);
        } else if (obj.type == DrawObject::Arrow && obj.points.size() == 2) {
            painter.drawLine(obj.points[0], obj.points[1]);
            QPolygonF arrowHead;
            QPointF dir = obj.points[1] - obj.points[0];
            qreal len = std::sqrt(dir.x() * dir.x() + dir.y() * dir.y());
            if (len > 0) {
                QPointF norm = dir / len;
                QPointF perp(-norm.y(), norm.x());
                arrowHead << obj.points[1];
                arrowHead << obj.points[1] - norm * 15 + perp * 8;
                arrowHead << obj.points[1] - norm * 15 - perp * 8;
                painter.setBrush(obj.color);
                painter.drawPolygon(arrowHead);
            }
        } else if (obj.type == DrawObject::Rectangle && obj.points.size() == 2) {
            painter.drawRect(QRectF(obj.points[0], obj.points[1]).normalized());
        } else if (obj.type == DrawObject::Circle && obj.points.size() == 2) {
            painter.drawEllipse(QRectF(obj.points[0], obj.points[1]).normalized());
        } else if (obj.type == DrawObject::Text && !obj.points.isEmpty()) {
            painter.drawText(obj.points[0], obj.text);
        } else if (obj.type == DrawObject::Marker && obj.points.size() > 1) {
            QPen markerPen(obj.color, obj.width * 3);
            markerPen.setCapStyle(Qt::RoundCap);
            painter.setPen(markerPen);
            for (int i = 1; i < obj.points.size(); ++i)
                painter.drawLine(obj.points[i - 1], obj.points[i]);
        }
    }
    painter.end();

    QString suffix = QFileInfo(filePath).suffix().toLower();
    if (suffix == "jpg" || suffix == "jpeg")
        result.save(filePath, "JPEG", 95);
    else if (suffix == "webp")
        result.save(filePath, "WEBP", 95);
    else
        result.save(filePath, "PNG");
}

void EditorWindow::onUndo()
{
    if (!m_objects.isEmpty()) {
        m_undoStack.append(m_objects.takeLast());
        m_currentPixmap = m_originalPixmap;
        m_canvasLabel->setPixmap(m_currentPixmap);
        update();
    }
}

void EditorWindow::onRedo()
{
    if (!m_undoStack.isEmpty()) {
        m_objects.append(m_undoStack.takeLast());
        m_currentPixmap = m_originalPixmap;
        m_canvasLabel->setPixmap(m_currentPixmap);
        update();
    }
}

void EditorWindow::onOCR()
{
    bool ok;
    QString lang = QInputDialog::getText(this, "OCR", "Language (e.g. eng):", QLineEdit::Normal, "eng", &ok);
    if (!ok || lang.isEmpty()) return;

    QImage img = m_currentPixmap.toImage();
    ApiManager::instance().ocrExtract(img, lang, [this](const QString& text, bool success) {
        if (success)
            QMessageBox::information(this, "OCR Result", text);
        else
            QMessageBox::warning(this, "OCR Failed", "Could not extract text.");
    });
}

void EditorWindow::onTranslate()
{
    bool ok;
    QString toLang = QInputDialog::getText(this, "Translate", "Target language (e.g. es):", QLineEdit::Normal, "es", &ok);
    if (!ok || toLang.isEmpty()) return;

    bool ok2;
    QString fromLang = QInputDialog::getText(this, "Translate", "Source language:", QLineEdit::Normal, "auto", &ok2);
    if (!ok2) return;

    QImage img = m_currentPixmap.toImage();
    ApiManager::instance().ocrExtract(img, fromLang, [this, fromLang, toLang](const QString& text, bool success) {
        if (!success || text.isEmpty()) {
            QMessageBox::warning(this, "OCR Failed", "Could not extract text for translation.");
            return;
        }
        ApiManager::instance().translateText(text, fromLang, toLang, [this](const QString& translated, bool ok) {
            if (ok)
                QMessageBox::information(this, "Translation", translated);
            else
                QMessageBox::warning(this, "Translation Failed", "Could not translate text.");
        });
    });
}

void EditorWindow::onExportPDF()
{
    QString path = QFileDialog::getSaveFileName(this, "Export PDF",
        SettingsManager::instance().saveFolder() + "/" + SettingsManager::instance().generateFileName() + ".pdf",
        "PDF (*.pdf)");
    if (!path.isEmpty())
        saveToFile(path);
}

void EditorWindow::onFormatChanged(const QString& format)
{
    SettingsManager::instance().setImageFormat(format.toLower());
}

void EditorWindow::applyWatermark()
{
    auto& settings = SettingsManager::instance();
    if (!settings.watermarkEnabled()) return;

    QPainter painter(&m_currentPixmap);
    painter.setRenderHint(QPainter::Antialiasing);

    QString logoPath = settings.logoPath();
    if (!logoPath.isEmpty()) {
        QPixmap logo(logoPath);
        if (!logo.isNull()) {
            double opacity = settings.watermarkOpacity();
            painter.setOpacity(opacity);

            QString pos = settings.watermarkPosition();
            int x = 0, y = 0;
            int imgW = m_currentPixmap.width();
            int imgH = m_currentPixmap.height();
            int logoW = logo.width();
            int logoH = logo.height();

            if (pos.contains("right")) x = imgW - logoW - 20;
            else if (pos.contains("center")) x = (imgW - logoW) / 2;
            else x = 20;

            if (pos.contains("bottom")) y = imgH - logoH - 20;
            else if (pos.contains("middle")) y = (imgH - logoH) / 2;
            else y = 20;

            painter.drawPixmap(x, y, logo);

            if (!settings.watermarkLogoOnly()) {
                QFont font;
                font.setPixelSize(16);
                painter.setFont(font);
                painter.setPen(QColor(255, 255, 255, (int)(opacity * 255)));
                painter.drawText(x, y + logoH + 20, settings.watermarkText());
            }
        }
    } else if (!settings.watermarkLogoOnly()) {
        double opacity = settings.watermarkOpacity();
        painter.setOpacity(opacity);
        QFont font;
        font.setPixelSize(24);
        painter.setFont(font);
        painter.setPen(QColor(255, 255, 255, (int)(opacity * 255)));

        QString pos = settings.watermarkPosition();
        int x = 0, y = 0;
        int imgW = m_currentPixmap.width();
        int imgH = m_currentPixmap.height();
        QFontMetrics fm(font);
        int textW = fm.horizontalAdvance(settings.watermarkText());
        int textH = fm.height();

        if (pos.contains("right")) x = imgW - textW - 20;
        else if (pos.contains("center")) x = (imgW - textW) / 2;
        else x = 20;

        if (pos.contains("bottom")) y = imgH - textH - 20;
        else if (pos.contains("middle")) y = (imgH - textH) / 2;
        else y = textH + 20;

        painter.drawText(x, y, settings.watermarkText());
    }
    painter.end();
}

void EditorWindow::paintEvent(QPaintEvent*)
{
    QPainter painter(this);
    painter.drawPixmap(0, 0, m_currentPixmap);

    for (const auto& obj : m_objects) {
        QPen pen(obj.color, obj.width);
        painter.setPen(pen);
        painter.setRenderHint(QPainter::Antialiasing);

        if (obj.type == DrawObject::Freehand && obj.points.size() > 1) {
            for (int i = 1; i < obj.points.size(); ++i)
                painter.drawLine(obj.points[i - 1], obj.points[i]);
        } else if (obj.type == DrawObject::Arrow && obj.points.size() == 2) {
            painter.drawLine(obj.points[0], obj.points[1]);
            QPolygonF arrowHead;
            QPointF dir = obj.points[1] - obj.points[0];
            qreal len = std::sqrt(dir.x() * dir.x() + dir.y() * dir.y());
            if (len > 0) {
                QPointF norm = dir / len;
                QPointF perp(-norm.y(), norm.x());
                arrowHead << obj.points[1];
                arrowHead << obj.points[1] - norm * 15 + perp * 8;
                arrowHead << obj.points[1] - norm * 15 - perp * 8;
                painter.setBrush(obj.color);
                painter.drawPolygon(arrowHead);
            }
        } else if (obj.type == DrawObject::Rectangle && obj.points.size() == 2) {
            painter.drawRect(QRectF(obj.points[0], obj.points[1]).normalized());
        } else if (obj.type == DrawObject::Circle && obj.points.size() == 2) {
            painter.drawEllipse(QRectF(obj.points[0], obj.points[1]).normalized());
        } else if (obj.type == DrawObject::Text && !obj.points.isEmpty()) {
            QFont font;
            font.setPixelSize(obj.width * 4);
            painter.setFont(font);
            painter.drawText(obj.points[0], obj.text);
        } else if (obj.type == DrawObject::Marker && obj.points.size() > 1) {
            QPen markerPen(obj.color, obj.width * 3);
            markerPen.setCapStyle(Qt::RoundCap);
            painter.setPen(markerPen);
            painter.setOpacity(0.4);
            for (int i = 1; i < obj.points.size(); ++i)
                painter.drawLine(obj.points[i - 1], obj.points[i]);
            painter.setOpacity(1.0);
        }
    }
}

void EditorWindow::mousePressEvent(QMouseEvent* event)
{
    if (event->button() != Qt::LeftButton || m_currentTool == 0) return;

    m_drawing = true;
    m_currentObject = DrawObject{};
    m_currentObject.color = m_drawColor;
    m_currentObject.width = m_drawWidth;
    m_currentObject.points.append(event->pos());

    if (m_currentTool == 5) {
        bool ok;
        QString text = QInputDialog::getText(this, "Text", "Enter text:", QLineEdit::Normal, "", &ok);
        if (ok && !text.isEmpty()) {
            m_currentObject.type = DrawObject::Text;
            m_currentObject.text = text;
            m_objects.append(m_currentObject);
            m_currentPixmap = m_originalPixmap;
            m_canvasLabel->setPixmap(m_currentPixmap);
            update();
        }
        m_drawing = false;
    }

    switch (m_currentTool) {
        case 1: m_currentObject.type = DrawObject::Freehand; break;
        case 2: m_currentObject.type = DrawObject::Arrow; break;
        case 3: m_currentObject.type = DrawObject::Rectangle; break;
        case 4: m_currentObject.type = DrawObject::Circle; break;
        case 6: m_currentObject.type = DrawObject::Marker; break;
    }
}

void EditorWindow::mouseMoveEvent(QMouseEvent* event)
{
    if (!m_drawing) return;
    m_currentObject.points.append(event->pos());

    QPixmap temp = m_currentPixmap;
    QPainter painter(&temp);
    painter.setRenderHint(QPainter::Antialiasing);
    QPen pen(m_currentObject.color, m_currentObject.width);
    painter.setPen(pen);

    const auto& pts = m_currentObject.points;
    if (m_currentObject.type == DrawObject::Freehand || m_currentObject.type == DrawObject::Marker) {
        QPen drawPen = pen;
        if (m_currentObject.type == DrawObject::Marker) {
            drawPen.setWidth(m_currentObject.width * 3);
            drawPen.setCapStyle(Qt::RoundCap);
            painter.setOpacity(0.4);
        }
        painter.setPen(drawPen);
        for (int i = 1; i < pts.size(); ++i)
            painter.drawLine(pts[i - 1], pts[i]);
    } else if ((m_currentObject.type == DrawObject::Arrow || m_currentObject.type == DrawObject::Rectangle || m_currentObject.type == DrawObject::Circle) && pts.size() >= 2) {
        if (m_currentObject.type == DrawObject::Arrow) {
            painter.drawLine(pts[0], pts.back());
            QPolygonF arrowHead;
            QPointF dir = pts.back() - pts[0];
            qreal len = std::sqrt(dir.x() * dir.x() + dir.y() * dir.y());
            if (len > 0) {
                QPointF norm = dir / len;
                QPointF perp(-norm.y(), norm.x());
                arrowHead << pts.back();
                arrowHead << pts.back() - norm * 15 + perp * 8;
                arrowHead << pts.back() - norm * 15 - perp * 8;
                painter.setBrush(m_currentObject.color);
                painter.drawPolygon(arrowHead);
            }
        } else if (m_currentObject.type == DrawObject::Rectangle) {
            painter.drawRect(QRectF(pts[0], pts.back()).normalized());
        } else {
            painter.drawEllipse(QRectF(pts[0], pts.back()).normalized());
        }
    }
    painter.end();
    m_canvasLabel->setPixmap(temp);
}

void EditorWindow::mouseReleaseEvent(QMouseEvent* event)
{
    if (event->button() != Qt::LeftButton || !m_drawing) return;
    m_drawing = false;

    if (m_currentObject.type != DrawObject::Text) {
        m_objects.append(m_currentObject);
    }
    m_undoStack.clear();
    m_currentPixmap = m_originalPixmap;
    m_canvasLabel->setPixmap(m_currentPixmap);
    update();
}
