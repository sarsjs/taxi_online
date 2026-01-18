import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import ConektaService from '../services/conektaService';

const PaymentMethods = ({ userId }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    exp_month: '',
    exp_year: '',
    cvc: ''
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPaymentMethods();
  }, [userId]);

  const loadPaymentMethods = async () => {
    if (!userId) return;

    try {
      const userDoc = await getDoc(doc(db, 'passengers', userId));
      const userData = userDoc.data();
      setPaymentMethods(userData?.paymentMethods || []);
    } catch (error) {
      console.error('Error al cargar métodos de pago:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    
    // Validar datos de tarjeta
    const validation = ConektaService.validateCardData(cardData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      // Crear token de Conekta
      const token = await ConektaService.createToken(cardData);
      
      // Crear objeto de método de pago
      const newPaymentMethod = {
        id: `card_${Date.now()}`,
        tipo: 'tarjeta',
        proveedor: 'conekta',
        tokenId: token.id,
        ultimos4Digitos: cardData.number.slice(-4),
        marca: detectCardBrand(cardData.number),
        predeterminado: paymentMethods.length === 0, // Primera tarjeta es predeterminada
        nombreTitular: cardData.name,
        expiracion: `${cardData.exp_month}/${cardData.exp_year}`
      };

      // Actualizar Firestore
      await updateDoc(doc(db, 'passengers', userId), {
        paymentMethods: arrayUnion(newPaymentMethod)
      });

      // Actualizar estado local
      setPaymentMethods([...paymentMethods, newPaymentMethod]);
      setCardData({ number: '', name: '', exp_month: '', exp_year: '', cvc: '' });
      setErrors({});
      setMessage('Tarjeta agregada exitosamente');
      setShowAddForm(false);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error al agregar tarjeta:', error);
      setErrors({ general: error.message });
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await updateDoc(doc(db, 'passengers', userId), {
        paymentMethods: arrayRemove(paymentMethods.find(pm => pm.id === cardId))
      });

      setPaymentMethods(paymentMethods.filter(pm => pm.id !== cardId));
      setMessage('Tarjeta eliminada exitosamente');
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error al eliminar tarjeta:', error);
      setErrors({ general: error.message });
    }
  };

  const handleSetDefault = async (cardId) => {
    try {
      const updatedMethods = paymentMethods.map(method => ({
        ...method,
        predeterminado: method.id === cardId
      }));

      await updateDoc(doc(db, 'passengers', userId), {
        paymentMethods: updatedMethods
      });

      setPaymentMethods(updatedMethods);
      setMessage('Método de pago predeterminado actualizado');
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error al actualizar método predeterminado:', error);
      setErrors({ general: error.message });
    }
  };

  const detectCardBrand = (number) => {
    const cleanedNumber = number.replace(/\s+/g, '');
    
    if (/^4/.test(cleanedNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanedNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanedNumber)) return 'amex';
    if (/^3[0-9]/.test(cleanedNumber)) return 'diners';
    
    return 'desconocida';
  };

  const formatCardNumber = (number) => {
    const cleaned = number.replace(/\s+/g, '');
    const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})$/);
    if (!match) return number;
    
    return match[1] + (match[2] ? ' ' + match[2] : '') + 
           (match[3] ? ' ' + match[3] : '') + 
           (match[4] ? ' ' + match[4] : '');
  };

  if (loading) {
    return (
      <div className="payment-methods">
        <h3>Métodos de Pago</h3>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="payment-methods">
      <h3>Métodos de Pago</h3>
      
      {message && (
        <div className="alert alert-success">
          {message}
        </div>
      )}
      
      {errors.general && (
        <div className="alert alert-error">
          {errors.general}
        </div>
      )}
      
      <div className="payment-methods-list">
        {paymentMethods.length === 0 ? (
          <p>No tienes métodos de pago registrados.</p>
        ) : (
          paymentMethods.map((method) => (
            <div key={method.id} className={`payment-method ${method.predeterminado ? 'default' : ''}`}>
              <div className="method-info">
                <div className="method-icon">
                  {method.tipo === 'tarjeta' ? '💳' : '💵'}
                </div>
                <div className="method-details">
                  <h4>
                    {method.marca.charAt(0).toUpperCase() + method.marca.slice(1)} 
                    {' •••• '}{method.ultimos4Digitos}
                  </h4>
                  <p>{method.nombreTitular}</p>
                  <p className="exp-date">{method.expiracion}</p>
                  {method.predeterminado && (
                    <span className="default-badge">Predeterminado</span>
                  )}
                </div>
              </div>
              <div className="method-actions">
                {!method.predeterminado && (
                  <button 
                    className="btn-secondary" 
                    onClick={() => handleSetDefault(method.id)}
                  >
                    Predeterminar
                  </button>
                )}
                <button 
                  className="btn-danger" 
                  onClick={() => handleDeleteCard(method.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="payment-actions">
        <button 
          className="btn-primary" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancelar' : 'Agregar Tarjeta'}
        </button>
        
        <button className="btn-secondary">
          Efectivo
        </button>
      </div>
      
      {showAddForm && (
        <form className="add-payment-form" onSubmit={handleAddCard}>
          <h4>Agregar Nueva Tarjeta</h4>
          
          <div className="form-group">
            <label htmlFor="card-number">Número de Tarjeta</label>
            <input
              id="card-number"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={formatCardNumber(cardData.number)}
              onChange={(e) => setCardData({...cardData, number: e.target.value.replace(/\s/g, '')})}
              maxLength="19"
            />
            {errors.number && <span className="error">{errors.number}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="card-name">Nombre del Titular</label>
            <input
              id="card-name"
              type="text"
              placeholder="Nombre completo"
              value={cardData.name}
              onChange={(e) => setCardData({...cardData, name: e.target.value})}
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="exp-month">Mes de Expiración</label>
              <input
                id="exp-month"
                type="text"
                placeholder="MM"
                value={cardData.exp_month}
                onChange={(e) => setCardData({...cardData, exp_month: e.target.value})}
                maxLength="2"
              />
              {errors.exp_month && <span className="error">{errors.exp_month}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="exp-year">Año de Expiración</label>
              <input
                id="exp-year"
                type="text"
                placeholder="AA"
                value={cardData.exp_year}
                onChange={(e) => setCardData({...cardData, exp_year: e.target.value})}
                maxLength="2"
              />
              {errors.exp_year && <span className="error">{errors.exp_year}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="cvc">CVC</label>
              <input
                id="cvc"
                type="text"
                placeholder="123"
                value={cardData.cvc}
                onChange={(e) => setCardData({...cardData, cvc: e.target.value})}
                maxLength="4"
              />
              {errors.cvc && <span className="error">{errors.cvc}</span>}
            </div>
          </div>
          
          <button type="submit" className="btn-primary">
            Agregar Tarjeta
          </button>
        </form>
      )}
    </div>
  );
};

export default PaymentMethods;