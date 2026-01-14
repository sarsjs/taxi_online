/* global clients */
import { precacheAndRoute } from 'workbox-precaching'
import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'

precacheAndRoute(self.__WB_MANIFEST)

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

initializeApp(firebaseConfig)
const messaging = getMessaging()

onBackgroundMessage(messaging, (payload) => {
  const title = payload?.notification?.title || 'Taxi Local'
  const options = {
    body: payload?.notification?.body || 'Tienes una nueva notificacion.',
    icon: '/pwa-icon.svg',
    data: payload?.data || {},
  }

  self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      if (clientsArr.length > 0) {
        const client = clientsArr[0]
        return client.focus()
      }
      return clients.openWindow('/')
    }),
  )
})
