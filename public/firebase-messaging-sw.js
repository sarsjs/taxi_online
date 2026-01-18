// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Inicializar Firebase en el service worker
firebase.initializeApp({
  apiKey: "AIzaSyCuCIw8iTybaaAKYXSuMnwLiq5nGOQgI8U",
  authDomain: "taxi-online-52593.firebaseapp.com",
  projectId: "taxi-online-52593",
  storageBucket: "taxi-online-52593.firebasestorage.app",
  messagingSenderId: "401292406878",
  appId: "1:401292406878:web:3d013a8addfd0fcc89c4cf"
});

const messaging = firebase.messaging();

// Escuchar mensajes cuando la app está en background
messaging.onBackgroundMessage(function(payload) {
  console.log('Mensaje recibido en background:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-icon.svg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', function(event) {
  console.log('Notificación clickeada:', event);
  
  // Cerrar la notificación
  event.notification.close();
  
  // Abrir la ventana principal de la aplicación
  const promiseChain = clients.openWindow('/');
  event.waitUntil(promiseChain);
});