import React, { useEffect } from 'react';

const NotificationBanner = ({ message, type = 'info', duration = 5000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  const bannerClasses = `notification-banner ${type}`;

  return (
    <div className={bannerClasses}>
      <div className="notification-content">
        <span className="notification-message">{message}</span>
        {onClose && (
          <button className="notification-close" onClick={onClose}>
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationBanner;