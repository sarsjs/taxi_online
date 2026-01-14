import admin from 'firebase-admin'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'

admin.initializeApp()

const db = admin.firestore()
const messaging = admin.messaging()

async function sendToTokens(tokens, payload) {
  if (!tokens || tokens.length === 0) return
  await messaging.sendEachForMulticast({
    tokens,
    notification: payload.notification,
    data: payload.data || {},
  })
}

export const notifyDriversOnNewRide = onDocumentCreated(
  'rides/{rideId}',
  async (event) => {
    const ride = event.data?.data()
    if (!ride) return
    if (ride.estado !== 'pendiente') return

    const driversSnapshot = await db
      .collection('drivers')
      .where('disponible', '==', true)
      .get()

    const tokens = driversSnapshot.docs.flatMap((doc) => doc.data().fcmTokens || [])
    await sendToTokens(tokens, {
      notification: {
        title: 'Nuevo viaje disponible',
        body: 'Hay una solicitud pendiente cerca de ti.',
      },
      data: {
        rideId: event.params.rideId,
      },
    })
  },
)

export const notifyPassengerOnAccept = onDocumentUpdated(
  'rides/{rideId}',
  async (event) => {
    const before = event.data?.before?.data()
    const after = event.data?.after?.data()
    if (!before || !after) return
    if (before.estado === after.estado && before.driverUid === after.driverUid) return
    if (!after.pasajeroUid) return
    if (!['aceptado', 'en curso', 'finalizado'].includes(after.estado)) return

    const passengerRef = db.collection('passengers').doc(after.pasajeroUid)
    const passengerSnap = await passengerRef.get()
    const tokens = passengerSnap.data()?.fcmTokens || []

    if (after.estado === 'aceptado') {
      await sendToTokens(tokens, {
        notification: {
          title: 'Taxi asignado',
          body: 'Un taxista acepto tu solicitud.',
        },
        data: {
          rideId: event.params.rideId,
        },
      })
    }

    if (after.estado === 'en curso') {
      await sendToTokens(tokens, {
        notification: {
          title: 'Viaje en curso',
          body: 'Tu viaje ha iniciado.',
        },
        data: {
          rideId: event.params.rideId,
        },
      })
    }

    if (after.estado === 'finalizado') {
      await sendToTokens(tokens, {
        notification: {
          title: 'Viaje finalizado',
          body: 'Gracias por viajar con nosotros.',
        },
        data: {
          rideId: event.params.rideId,
        },
      })
    }
  },
)

export const notifyDriverOnStatusChange = onDocumentUpdated(
  'rides/{rideId}',
  async (event) => {
    const before = event.data?.before?.data()
    const after = event.data?.after?.data()
    if (!before || !after) return
    if (!after.driverUid) return
    if (before.estado === after.estado) return

    const driverRef = db.collection('drivers').doc(after.driverUid)
    const driverSnap = await driverRef.get()
    const tokens = driverSnap.data()?.fcmTokens || []

    if (after.estado === 'cancelado') {
      await sendToTokens(tokens, {
        notification: {
          title: 'Viaje cancelado',
          body: 'El pasajero canceló la solicitud.',
        },
        data: {
          rideId: event.params.rideId,
        },
      })
    }

    if (after.estado === 'en curso') {
      await sendToTokens(tokens, {
        notification: {
          title: 'Viaje iniciado',
          body: 'El viaje cambió a estado en curso.',
        },
        data: {
          rideId: event.params.rideId,
        },
      })
    }
  },
)

export const weeklyBilling = onSchedule(
  {
    schedule: '59 23 * * 0',
    timeZone: 'America/Mexico_City',
  },
  async () => {
    const billingSnap = await db.collection('settings').doc('billing').get()
    const billing = billingSnap.exists ? billingSnap.data() : {}
    const weeklyPercent = Number(billing.weeklyPercent ?? 10)

    const now = new Date()
    const day = now.getDay()
    const diffToMonday = (day + 6) % 7
    const periodEnd = new Date(now)
    periodEnd.setHours(23, 59, 59, 999)
    const periodStart = new Date(now)
    periodStart.setDate(now.getDate() - diffToMonday)
    periodStart.setHours(0, 0, 0, 0)

    const driversSnap = await db.collection('drivers').get()

    for (const driver of driversSnap.docs) {
      const ridesSnap = await db
        .collection('rides')
        .where('driverUid', '==', driver.id)
        .where('estado', '==', 'finalizado')
        .where('finalizadoAt', '>=', periodStart)
        .where('finalizadoAt', '<=', periodEnd)
        .get()

      const total = ridesSnap.docs.reduce(
        (sum, ride) => sum + Number(ride.data().montoFinal || 0),
        0,
      )
      const fee = (total * weeklyPercent) / 100

      await db.collection('drivers').doc(driver.id).set(
        {
          weeklyTotal: total,
          weeklyFee: fee,
          paymentStatus: 'pendiente',
          bloqueadoPorPago: true,
          billingPeriodStart: admin.firestore.Timestamp.fromDate(periodStart),
          billingPeriodEnd: admin.firestore.Timestamp.fromDate(periodEnd),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
    }
  },
)
