import { getToken, onMessage } from 'firebase/messaging'
import { arrayUnion, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, messaging } from '../firebase'

export async function ensureNotificationPermission() {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

export async function registerFcmToken({ user, collectionName }) {
  if (!user) return null
  const permission = await ensureNotificationPermission()
  if (permission !== 'granted') return null

  const registration = await navigator.serviceWorker.ready
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  })

  if (!token) return null

  await setDoc(
    doc(db, collectionName, user.uid),
    {
      fcmTokens: arrayUnion(token),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return token
}

export function listenForegroundMessages(onNotify) {
  return onMessage(messaging, (payload) => {
    if (onNotify) {
      onNotify(payload)
      return
    }
    const title = payload?.notification?.title || 'Taxi Local'
    const body = payload?.notification?.body || 'Tienes una nueva notificacion.'
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
  })
}
