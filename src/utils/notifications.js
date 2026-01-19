import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebase';

/**
 * Solicita permiso para enviar notificaciones y obtiene el token FCM
 * @returns {Promise<string|null>} Token FCM o null si no se concedió permiso
 */
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Obtiene el token de registro de FCM
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      return token;
    } else {
      console.log('Permiso para notificaciones denegado.');
      return null;
    }
  } catch (error) {
    console.error('Error al solicitar permiso de notificaciones:', error);
    return null;
  }
};

/**
 * Guarda el token FCM en Firestore para el usuario
 * @param {string} userId - ID del usuario
 * @param {string} token - Token FCM
 * @param {string} collectionName - Nombre de la colección ('passengers' o 'drivers')
 */
export const saveFcmToken = async (userId, token, collectionName) => {
  if (!token) return;
  
  try {
    const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
    const { db } = await import( '../firebase');
    
    const userRef = doc(db, collectionName, userId);
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token)
    });
  } catch (error) {
    console.error('Error al guardar el token FCM:', error);
  }
};

/**
 * Registra el token FCM para el usuario
 * @param {object} params - Parámetros
 * @param {object} params.user - Objeto de usuario de Firebase Auth
 * @param {string} params.collectionName - Nombre de la colección ('passengers' o 'drivers')
 * @returns {Promise<string|null>} Token FCM o null
 */
export const registerFcmToken = async ({ user, collectionName }) => {
  if (!user) return null;
  
  try {
    const token = await requestNotificationPermission();
    if (token) {
      await saveFcmToken(user.uid, token, collectionName);
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error al registrar token FCM:', error);
    return null;
  }
};

/**
 * Escucha mensajes cuando la app está en primer plano
 * @param {Function} handleMessage - Función para manejar mensajes recibidos
 * @returns {Function} Función para desuscribirse
 */
export const listenForegroundMessages = (handleMessage) => {
  return onMessage(messaging, (payload) => {
    console.log('Mensaje recibido en primer plano:', payload);
    
    // Si se proporciona una función de manejo personalizada
    if (handleMessage) {
      handleMessage(payload);
    } else {
      // Mostrar notificación en la app
      showInAppNotification(payload);
    }
  });
};

/**
 * Muestra notificación dentro de la app
 * @param {object} payload - Payload del mensaje
 */
const showInAppNotification = (payload) => {
  const { title, body } = payload.notification || {};
  const data = payload.data || {};
  
  // Crear un elemento de notificación en la UI
  const notificationDiv = document.createElement('div');
  notificationDiv.className = 'in-app-notification';
  notificationDiv.innerHTML = `
    <div class="notification-content">
      <h4>${title}</h4>
      <p>${body}</p>
    </div>
    <button class="close-notification">&times;</button>
  `;
  
  // Añadir estilos básicos si no existen
  addNotificationStyles();
  
  // Añadir a la página
  document.body.appendChild(notificationDiv);
  
  // Configurar cierre automático
  setTimeout(() => {
    if (notificationDiv.parentNode) {
      notificationDiv.remove();
    }
  }, 5000);
  
  // Configurar botón de cierre
  const closeBtn = notificationDiv.querySelector('.close-notification');
  closeBtn.onclick = () => {
    if (notificationDiv.parentNode) {
      notificationDiv.remove();
    }
  };
};

/**
 * Añade estilos básicos para las notificaciones en la app
 */
const addNotificationStyles = () => {
  if (document.getElementById('in-app-notification-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'in-app-notification-styles';
  style.textContent = `
    .in-app-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      min-width: 300px;
      max-width: 400px;
      overflow: hidden;
    }
    
    .notification-content {
      padding: 15px;
    }
    
    .notification-content h4 {
      margin: 0 0 8px 0;
      color: #333;
    }
    
    .notification-content p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
    
    .close-notification {
      position: absolute;
      top: 5px;
      right: 5px;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #999;
    }
    
    .close-notification:hover {
      color: #333;
    }
  `;
  
  document.head.appendChild(style);
};
