#include "cropperwindow.h"
#include <QPainter>
#include <QMouseEvent>
#include <QKeyEvent>

CropperWindow::CropperWindow(const QPixmap& screenshot, QWidget* parent)
    : QWidget(parent), m_screenshot(screenshot)
{
    setWindowFlags(Qt::FramelessWindowHint | Qt::WindowStaysOnTopHint);
    setAttribute(Qt::WA_TranslucentBackground);
    setCursor(Qt::CrossCursor);
    showMaximized();
}

void CropperWindow::paintEvent(QPaintEvent*)
{
    QPainter painter(this);
    painter.drawPixmap(0, 0, m_screenshot);
    painter.fillRect(rect(), QColor(0, 0, 0, 128));

    if (!m_selection.isNull()) {
        painter.drawPixmap(m_selection, m_screenshot, m_selection);
        QPen pen(QColor(255, 255, 255, 255), 2);
        painter.setPen(pen);
        painter.setBrush(QColor(255, 255, 255, 30));
        painter.drawRect(m_selection);
    }
}

void CropperWindow::mousePressEvent(QMouseEvent* event)
{
    if (event->button() == Qt::LeftButton) {
        m_origin = event->pos();
        m_selecting = true;
        m_selection = QRect();
    }
}

void CropperWindow::mouseMoveEvent(QMouseEvent* event)
{
    if (m_selecting) {
        m_selection = QRect(m_origin, event->pos()).normalized();
        update();
    }
}

void CropperWindow::mouseReleaseEvent(QMouseEvent* event)
{
    if (event->button() == Qt::LeftButton && m_selecting) {
        m_selecting = false;
        if (m_selection.width() > 10 && m_selection.height() > 10) {
            emit regionSelected(m_selection);
        } else {
            emit cancelled();
        }
        close();
    }
}

void CropperWindow::keyPressEvent(QKeyEvent* event)
{
    if (event->key() == Qt::Key_Escape) {
        emit cancelled();
        close();
    }
}
