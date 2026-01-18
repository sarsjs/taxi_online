/**
 * Servicio de pagos con Conekta
 */

class ConektaService {
  constructor() {
    // La llave pública se debe configurar en el entorno
    this.publicKey = import.meta.env.VITE_CONEKTA_PUBLIC_KEY;
    if (!this.publicKey) {
      console.warn('La llave pública de Conekta no está configurada');
    }
  }

  // Inicializar Conekta
  init() {
    if (window.Conekta) {
      window.Conekta.api_key = this.publicKey;
    } else {
      console.error('Conekta no está cargado');
    }
  }

  // Crear token de tarjeta
  async createToken(cardData) {
    return new Promise((resolve, reject) => {
      if (!window.Conekta) {
        reject(new Error('Conekta no está disponible'));
        return;
      }

      window.Conekta.token.create(cardData, (token) => {
        if (token.id) {
          resolve(token);
        } else {
          reject(new Error(token.error.message || 'Error al crear token'));
        }
      });
    });
  }

  // Procesar pago
  async processPayment(tokenId, amount, currency = 'MXN') {
    // Este método se llama desde el backend (Cloud Functions)
    // Aquí solo se prepara la información para enviar al backend
    const paymentData = {
      token: tokenId,
      amount: Math.round(amount * 100), // Convertir a centavos
      currency: currency,
      description: 'Pago de taxi',
    };

    return paymentData;
  }

  // Validar datos de tarjeta
  validateCardData(cardData) {
    const errors = [];

    if (!cardData.number || cardData.number.replace(/\s+/g, '').length < 13) {
      errors.push('Número de tarjeta inválido');
    }

    if (!cardData.name || cardData.name.trim() === '') {
      errors.push('Nombre del titular requerido');
    }

    const month = parseInt(cardData.exp_month, 10);
    const year = parseInt(cardData.exp_year, 10);

    if (month < 1 || month > 12) {
      errors.push('Mes de expiración inválido');
    }

    const currentYear = new Date().getFullYear() % 100;
    if (year < currentYear || year > currentYear + 20) {
      errors.push('Año de expiración inválido');
    }

    if (!cardData.cvc || cardData.cvc.length < 3 || cardData.cvc.length > 4) {
      errors.push('CVC inválido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new ConektaService();