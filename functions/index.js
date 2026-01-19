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

// Importar la función de procesamiento de pagos
import { processPayment } from './processPayment.js'

export const notifyDriversOnNewRide = onDocumentCreated(
  'rides/{rideId}',
  async (event) => {
    const ride = event.data?.data()
    if (!ride) return
    if (ride.estado !== 'pendiente') return

    // Obtener información de la ruta si existe
    let routeInfo = '';
    if (ride.routeId) {
      try {
        const routeDoc = await db.collection('routes').doc(ride.routeId).get();
        if (routeDoc.exists) {
          const routeData = routeDoc.data();
          routeInfo = ` (ruta: ${routeData.name})`;
        }
      } catch (error) {
        console.log('Error obteniendo información de ruta:', error);
      }
    }

    const driversSnapshot = await db
      .collection('drivers')
      .where('disponible', '==', true)
      .get()

    const tokens = driversSnapshot.docs.flatMap((doc) => doc.data().fcmTokens || [])
    await sendToTokens(tokens, {
      notification: {
        title: 'Nuevo viaje disponible',
        body: `Hay una solicitud pendiente cerca de ti.${routeInfo}`,
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



// Función para calcular tarifas basadas en rutas predefinidas
export const calculateRouteFare = onDocumentCreated(
  'tempFareCalculations/{calcId}',
  async (event) => {
    const calculation = event.data?.data()
    if (!calculation || !calculation.routeId) return

    try {
      // Obtener la ruta predefinida
      const routeDoc = await db.collection('routes').doc(calculation.routeId).get()
      if (!routeDoc.exists) return

      const routeData = routeDoc.data()
      const fixedPrice = routeData.fixedPrice

      // Actualizar el documento con el precio calculado
      await event.data.ref.update({
        calculatedFare: fixedPrice,
        calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
        routeName: routeData.name
      })
    } catch (error) {
      console.error('Error calculating route fare:', error)
    }
  }
)

// Función para actualizar automáticamente la información de landmarks
export const updateLandmarkStats = onDocumentUpdated(
  'landmarks/{landmarkId}',
  async (event) => {
    const after = event.data?.after?.data()
    if (!after) return

    // Actualizar contador de uso del landmark
    await event.data.after.ref.update({
      lastUsed: admin.firestore.FieldValue.serverTimestamp(),
      usageCount: admin.firestore.FieldValue.increment(1)
    })
  }
)

// Función para notificar al pasajero cuando se acepta un viaje
export const onTripAccepted = onDocumentUpdated(
  'rides/{rideId}',
  async (event) => {
    const before = event.data?.before?.data()
    const after = event.data?.after?.data()

    if (!before || !after) return
    // Solo procesar si el estado cambió a 'aceptado'
    if (before.estado !== 'pendiente' || after.estado !== 'aceptado') return
    if (!after.pasajeroUid) return

    // Obtener información del conductor
    const driverRef = db.collection('drivers').doc(after.driverUid)
    const driverSnap = await driverRef.get()
    const driverData = driverSnap.data()

    // Obtener tokens FCM del pasajero
    const passengerRef = db.collection('passengers').doc(after.pasajeroUid)
    const passengerSnap = await passengerRef.get()
    const tokens = passengerSnap.data()?.fcmTokens || []

    if (tokens.length === 0) return

    // Calcular tiempo estimado si es posible
    let etaMessage = 'está en camino';
    if (after.taxistaUbicacion && after.origen) {
      // Calcular distancia y tiempo estimado (simplificado)
      const distancia = calculateDistance(
        after.taxistaUbicacion.latitude,
        after.taxistaUbicacion.longitude,
        after.origen.latitude,
        after.origen.longitude
      );
      const tiempoEstimado = Math.round(distancia / 30 * 60); // Suponiendo 30 km/h
      etaMessage = `llega en ${tiempoEstimado} minutos`;
    }

    const vehicleInfo = `${driverData?.vehiculo?.modelo || 'su vehículo'} ${driverData?.vehiculo?.color || ''}`;
    const driverName = driverData?.nombre || driverData?.nombreCompleto || 'el conductor';

    await sendToTokens(tokens, {
      notification: {
        title: '¡Conductor encontrado!',
        body: `${driverName} ${etaMessage} en ${vehicleInfo}`,
      },
      data: {
        rideId: event.params.rideId,
        action: 'ver_detalles',
      },
    })
  }
)

// Función para notificar al pasajero cuando el conductor ha llegado
export const onDriverArrived = onDocumentUpdated(
  'rides/{rideId}',
  async (event) => {
    const before = event.data?.before?.data()
    const after = event.data?.after?.data()

    if (!before || !after) return
    // Detectar cuando el conductor está cerca del origen (menos de 100 metros)
    if (!after.taxistaUbicacion || !after.origen) return

    const distancia = calculateDistance(
      after.taxistaUbicacion.latitude,
      after.taxistaUbicacion.longitude,
      after.origen.latitude,
      after.origen.longitude
    );

    // Si está a menos de 100 metros y antes no estaba tan cerca
    const distanciaAnterior = before.taxistaUbicacion && before.origen ?
      calculateDistance(
        before.taxistaUbicacion.latitude,
        before.taxistaUbicacion.longitude,
        before.origen.latitude,
        before.origen.longitude
      ) : Infinity;

    // Solo notificar si antes estaba lejos y ahora está cerca
    if (distanciaAnterior <= 0.1 || distancia > 0.1) return

    // Obtener tokens FCM del pasajero
    const passengerRef = db.collection('passengers').doc(after.pasajeroUid)
    const passengerSnap = await passengerRef.get()
    const tokens = passengerSnap.data()?.fcmTokens || []

    if (tokens.length === 0) return

    // Obtener información del conductor
    const driverRef = db.collection('drivers').doc(after.driverUid)
    const driverSnap = await driverRef.get()
    const driverData = driverSnap.data()
    const driverName = driverData?.nombre || driverData?.nombreCompleto || 'su conductor';

    await sendToTokens(tokens, {
      notification: {
        title: 'Tu conductor ha llegado 🚗',
        body: `${driverName} está esperándote`,
      },
      data: {
        rideId: event.params.rideId,
        action: 'ubicacion_conductor',
      },
    })
  }
)

// Función para notificar al pasajero cuando inicia el viaje
export const onTripStarted = onDocumentUpdated(
  'rides/{rideId}',
  async (event) => {
    const before = event.data?.before?.data()
    const after = event.data?.after?.data()

    if (!before || !after) return
    // Solo procesar si el estado cambió a 'en_viaje' (o 'en curso' en el sistema actual)
    if (before.estado === after.estado) return
    if (before.estado === 'en curso' && after.estado === 'en curso') return // Evitar duplicados
    if (after.estado !== 'en curso') return
    if (!after.pasajeroUid) return

    // Obtener tokens FCM del pasajero
    const passengerRef = db.collection('passengers').doc(after.pasajeroUid)
    const passengerSnap = await passengerRef.get()
    const tokens = passengerSnap.data()?.fcmTokens || []

    if (tokens.length === 0) return

    const destination = after.destinoTexto || 'el destino';

    await sendToTokens(tokens, {
      notification: {
        title: 'Viaje iniciado',
        body: `Disfruta tu viaje hacia ${destination}`,
      },
      data: {
        rideId: event.params.rideId,
        action: 'seguimiento_viaje',
      },
    })
  }
)

// Función para notificar al pasajero cuando se completa el viaje
export const onTripCompleted = onDocumentUpdated(
  'rides/{rideId}',
  async (event) => {
    const before = event.data?.before?.data()
    const after = event.data?.after?.data()

    if (!before || !after) return
    // Solo procesar si el estado cambió a 'finalizado'
    if (before.estado === after.estado) return
    if (after.estado !== 'finalizado') return
    if (!after.pasajeroUid) return

    // Obtener tokens FCM del pasajero
    const passengerRef = db.collection('passengers').doc(after.pasajeroUid)
    const passengerSnap = await passengerRef.get()
    const tokens = passengerSnap.data()?.fcmTokens || []

    if (tokens.length === 0) return

    // Calcular tarifa si está disponible
    const fare = after.montoFinal ? `$${after.montoFinal}` : 'la tarifa';

    await sendToTokens(tokens, {
      notification: {
        title: 'Has llegado a tu destino',
        body: `Tarifa: ${fare} • Por favor califica tu viaje`,
      },
      data: {
        rideId: event.params.rideId,
        action: 'calificar',
      },
    })
  }
)

// Función auxiliar para calcular distancia entre dos puntos (en kilómetros)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distancia en km
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
