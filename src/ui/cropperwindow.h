#pragma once
#include <QWidget>
#include <QPixmap>
#include <QRect>
#include <QPoint>

class CropperWindow : public QWidget {
    Q_OBJECT
public:
    explicit CropperWindow(const QPixmap& screenshot, QWidget* parent = nullptr);
    
signals:
    void regionSelected(const QRect& region);
    void cancelled();
    
protected:
    void paintEvent(QPaintEvent*) override;
    void mousePressEvent(QMouseEvent*) override;
    void mouseMoveEvent(QMouseEvent*) override;
    void mouseReleaseEvent(QMouseEvent*) override;
    void keyPressEvent(QKeyEvent*) override;
    
private:
    QPixmap m_screenshot;
    QRect m_selection;
    QPoint m_origin;
    bool m_selecting = false;
};
