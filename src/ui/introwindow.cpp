#include "introwindow.h"
#include <QPainter>
#include <QTimer>
#include <QScreen>
#include <QGuiApplication>

IntroWindow::IntroWindow(QWidget* parent)
    : QWidget(parent)
    , m_logo(":/icons/main-hyprland.png")
{
    setWindowFlags(Qt::FramelessWindowHint | Qt::WindowStaysOnTopHint);
    setAttribute(Qt::WA_TranslucentBackground);
    setFixedSize(400, 300);

    if (QScreen* screen = QGuiApplication::primaryScreen()) {
        QRect screenGeometry = screen->availableGeometry();
        move((screenGeometry.width() - width()) / 2,
             (screenGeometry.height() - height()) / 2);
    }

    m_fadeIn = new QPropertyAnimation(this, "opacity", this);
    m_fadeIn->setDuration(1000);
    m_fadeIn->setStartValue(0.0);
    m_fadeIn->setEndValue(1.0);

    m_fadeOut = new QPropertyAnimation(this, "opacity", this);
    m_fadeOut->setDuration(800);
    m_fadeOut->setStartValue(1.0);
    m_fadeOut->setEndValue(0.0);

    m_timer = new QTimer(this);
    m_timer->setSingleShot(true);

    connect(m_fadeIn, &QPropertyAnimation::finished, this, [this]() {
        m_timer->start();
    });
    connect(m_timer, &QTimer::timeout, this, [this]() {
        m_fadeOut->start();
    });
    connect(m_fadeOut, &QPropertyAnimation::finished, this, &IntroWindow::introFinished);
    connect(m_fadeOut, &QPropertyAnimation::finished, this, &QWidget::close);
}

void IntroWindow::showEvent(QShowEvent*)
{
    setOpacity(0.0);
    m_fadeIn->start();
}

void IntroWindow::paintEvent(QPaintEvent*)
{
    QPainter painter(this);
    painter.setRenderHint(QPainter::Antialiasing);

    int logoSize = qMin(m_logo.width(), m_logo.height());
    QPixmap scaled = m_logo.scaled(logoSize, logoSize, Qt::KeepAspectRatio, Qt::SmoothTransformation);

    int x = (width() - scaled.width()) / 2;
    int y = 30;
    painter.drawPixmap(x, y, scaled);

    QFont titleFont("Segoe UI", 18, QFont::Bold);
    painter.setFont(titleFont);
    painter.setPen(Qt::white);
    painter.drawText(QRect(0, y + scaled.height() + 20, width(), 30),
                     Qt::AlignCenter, "Feathershot");

    QFont subFont("Segoe UI", 11);
    painter.setFont(subFont);
    painter.setPen(QColor(200, 200, 200));
    painter.drawText(QRect(0, y + scaled.height() + 50, width(), 25),
                     Qt::AlignCenter, "Hyprland Theme");
}
