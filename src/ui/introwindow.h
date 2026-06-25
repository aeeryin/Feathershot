#pragma once
#include <QWidget>
#include <QPixmap>
#include <QPropertyAnimation>
#include <QTimer>

class IntroWindow : public QWidget {
    Q_OBJECT
    Q_PROPERTY(qreal opacity READ opacity WRITE setOpacity)
public:
    explicit IntroWindow(QWidget* parent = nullptr);
    qreal opacity() const { return m_opacity; }
    void setOpacity(qreal o) { m_opacity = o; setWindowOpacity(o); update(); }
    
signals:
    void introFinished();
    
protected:
    void paintEvent(QPaintEvent*) override;
    void showEvent(QShowEvent*) override;
    
private:
    QPixmap m_logo;
    qreal m_opacity = 0.0;
    QPropertyAnimation* m_fadeIn;
    QPropertyAnimation* m_fadeOut;
    QTimer* m_timer;
};
