import admin from 'firebase-admin';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

admin.initializeApp();

const db = admin.firestore();
const conekta = require('conekta'); // Asegúrate de instalar conekta: npm install conekta

// Configurar Conekta con la llave privada
conekta.api_key = process.env.CONEKTA_PRIVATE_KEY;
conekta.locale = 'es';

// Función para procesar pagos cuando se completa un viaje
export const processPayment = onDocumentUpdated(
  'rides/{rideId}',
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) return;

    // Solo procesar si el estado cambió a 'finalizado' y no estaba pagado antes
    if (before.estado === after.estado) return;
    if (after.estado !== 'finalizado') return;
    if (after.pagado === true) return;
    if (!after.montoFinal) return;

    try {
      // Obtener el método de pago del pasajero
      const passengerRef = db.collection('passengers').doc(after.pasajeroUid);
      const passengerSnap = await passengerRef.get();
      const passengerData = passengerSnap.data();

      if (!passengerData?.paymentMethods || passengerData.paymentMethods.length === 0) {
        console.log('El pasajero no tiene métodos de pago registrados');
        // Actualizar el viaje para indicar que se necesita pago manual
        await event.data.after.ref.update({
          pagoPendiente: true,
          estado: 'pago_pendiente',
          motivoPagoPendiente: 'sin_metodo_pago'
        });
        return;
      }

      // Encontrar el método de pago predeterminado o el primero
      const defaultPaymentMethod = passengerData.paymentMethods.find(pm => pm.predeterminado) || 
                                   passengerData.paymentMethods[0];

      if (!defaultPaymentMethod || defaultPaymentMethod.tipo !== 'tarjeta') {
        console.log('No se encontró un método de pago válido');
        // Actualizar el viaje para indicar que se necesita pago manual
        await event.data.after.ref.update({
          pagoPendiente: true,
          estado: 'pago_pendiente',
          motivoPagoPendiente: 'metodo_no_valido'
        });
        return;
      }

      // Procesar el pago con Conekta
      const charge = await conekta.Order.create({
        line_items: [{
          name: 'Servicio de taxi',
          unit_price: Math.round(after.montoFinal * 100), // Convertir a centavos
          quantity: 1
        }],
        charges: [{
          payment_method: {
            type: 'card',
            token_id: defaultPaymentMethod.tokenId
          },
          amount: Math.round(after.montoFinal * 100) // Convertir a centavos
        }],
        currency: 'MXN'
      });

      // Verificar si el cargo fue exitoso
      if (charge.charges[0].status === 'paid') {
        // Actualizar el viaje con la información de pago
        await event.data.after.ref.update({
          pagado: true,
          metodoPago: 'tarjeta',
          transactionId: charge.charges[0].id,
          paymentProvider: 'conekta',
          fechaPago: admin.firestore.FieldValue.serverTimestamp()
        });

        // Enviar notificación de pago exitoso
        await sendPaymentSuccessNotification(after.pasajeroUid, after.id, after.montoFinal);
      } else {
        // El pago falló
        await event.data.after.ref.update({
          pagoPendiente: true,
          estado: 'pago_pendiente',
          motivoPagoPendiente: 'pago_rechazado'
        });

        // Enviar notificación de pago fallido
        await sendPaymentFailureNotification(after.pasajeroUid, after.id);
      }
    } catch (error) {
      console.error('Error al procesar pago:', error);
      
      // Actualizar el viaje para indicar error en el pago
      await event.data.after.ref.update({
        pagoPendiente: true,
        estado: 'pago_pendiente',
        motivoPagoPendiente: 'error_procesamiento',
        errorPago: error.message
      });

      // Enviar notificación de error
      await sendPaymentErrorNotification(after.pasajeroUid, after.id, error.message);
    }
  }
);

// Función para enviar notificación de pago exitoso
async function sendPaymentSuccessNotification(userId, rideId, amount) {
  try {
    const passengerRef = db.collection('passengers').doc(userId);
    const passengerSnap = await passengerRef.get();
    const tokens = passengerSnap.data()?.fcmTokens || [];

    if (tokens.length > 0) {
      const payload = {
        notification: {
          title: 'Pago procesado exitosamente',
          body: `Tu pago de $${amount} por el viaje ha sido procesado correctamente.`
        },
        data: {
          rideId,
          action: 'ver_recibo'
        }
      };

      await admin.messaging().sendMulticast({
        tokens,
        ...payload
      });
    }
  } catch (error) {
    console.error('Error al enviar notificación de pago exitoso:', error);
  }
}

// Función para enviar notificación de pago fallido
async function sendPaymentFailureNotification(userId, rideId) {
  try {
    const passengerRef = db.collection('passengers').doc(userId);
    const passengerSnap = await passengerRef.get();
    const tokens = passengerSnap.data()?.fcmTokens || [];

    if (tokens.length > 0) {
      const payload = {
        notification: {
          title: 'Pago rechazado',
          body: 'Tu pago fue rechazado. Por favor actualiza tu método de pago.'
        },
        data: {
          rideId,
          action: 'actualizar_pago'
        }
      };

      await admin.messaging().sendMulticast({
        tokens,
        ...payload
      });
    }
  } catch (error) {
    console.error('Error al enviar notificación de pago fallido:', error);
  }
}

// Función para enviar notificación de error de procesamiento
async function sendPaymentErrorNotification(userId, rideId, errorMessage) {
  try {
    const passengerRef = db.collection('passengers').doc(userId);
    const passengerSnap = await passengerRef.get();
    const tokens = passengerSnap.data()?.fcmTokens || [];

    if (tokens.length > 0) {
      const payload = {
        notification: {
          title: 'Error al procesar pago',
          body: `Hubo un error al procesar tu pago. Inténtalo de nuevo.`
        },
        data: {
          rideId,
          action: 'reintentar_pago',
          error: errorMessage
        }
      };

      await admin.messaging().sendMulticast({
        tokens,
        ...payload
      });
    }
  } catch (error) {
    console.error('Error al enviar notificación de error de pago:', error);
  }
}