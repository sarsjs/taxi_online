import { useState, useEffect } from 'react';
import { onMessage } from 'firebase/messaging';
import { messaging } from '../firebase';

const useNotifications = () => {
  const [notification, setNotification] = useState(null);
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Mensaje recibido en primer plano:', payload);
      setNotification({
        title: payload.notification?.title,
        body: payload.notification?.body,
        data: payload.data,
      });
    });

    return () => unsubscribe();
  }, []);

  const requestPermission = async () => {
    if (permission === 'granted') return true;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error al solicitar permiso de notificación:', error);
      return false;
    }
  };

  const clearNotification = () => {
    setNotification(null);
  };

  return {
    notification,
    permission,
    requestPermission,
    clearNotification,
  };
};

export default useNotifications;