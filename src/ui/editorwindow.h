#pragma once
#include <QMainWindow>
#include <QPixmap>
#include <QImage>
#include <QVector>
#include <QPointF>
#include <QColor>
#include <QString>

class QToolBar;
class QAction;
class QLabel;
class QComboBox;
class QVBoxLayout;

class EditorWindow : public QMainWindow {
    Q_OBJECT
public:
    explicit EditorWindow(const QPixmap& screenshot, QWidget* parent = nullptr);

private slots:
    void onCopy();
    void onSave();
    void onUndo();
    void onRedo();
    void onOCR();
    void onTranslate();
    void onExportPDF();
    void onFormatChanged(const QString&);

private:
    void setupUI();
    void setupToolbar();
    void applyWatermark();
    void saveToFile(const QString& filePath);

    QPixmap m_originalPixmap;
    QPixmap m_currentPixmap;

    struct DrawObject {
        enum Type { Freehand, Arrow, Rectangle, Circle, Text, Marker };
        Type type;
        QVector<QPointF> points;
        QColor color;
        int width;
        QString text;
    };
    QVector<DrawObject> m_objects;
    QVector<DrawObject> m_undoStack;
    int m_currentTool = 0;
    QColor m_drawColor = Qt::red;
    int m_drawWidth = 3;
    bool m_drawing = false;
    DrawObject m_currentObject;

    QWidget* m_centralWidget;
    QLabel* m_canvasLabel;
    QToolBar* m_toolBar;
    QComboBox* m_formatCombo;

protected:
    void paintEvent(QPaintEvent*) override;
    void mousePressEvent(QMouseEvent*) override;
    void mouseMoveEvent(QMouseEvent*) override;
    void mouseReleaseEvent(QMouseEvent*) override;
};
