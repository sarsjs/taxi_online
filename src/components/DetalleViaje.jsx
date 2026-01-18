import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ReciboViaje from './ReciboViaje';

const DetalleViaje = ({ viaje, onClose }) => {
  const [driverData, setDriverData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showRepeatOption, setShowRepeatOption] = useState(false);

  useEffect(() => {
    if (viaje?.driverUid) {
      cargarDatosConductor();
    } else {
      setLoading(false);
    }
  }, [viaje]);

  const cargarDatosConductor = async () => {
    try {
      const driverDoc = await getDoc(doc(db, 'drivers', viaje.driverUid));
      if (driverDoc.exists()) {
        setDriverData(driverDoc.data());
      }
    } catch (error) {
      console.error('Error al cargar datos del conductor:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp) return '';
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return fecha.toLocaleString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularDesgloseTarifa = () => {
    if (!viaje) return null;
    
    const tarifaBase = 30;
    const distancia = viaje.distancia ? parseFloat(viaje.distancia) : 0;
    const tiempo = viaje.duracion ? parseFloat(viaje.duracion) : 0;
    
    const porDistancia = distancia * 8;
    const porTiempo = tiempo * 2;
    const subtotal = tarifaBase + porDistancia + porTiempo;
    const propina = viaje.propina || 0;
    const total = subtotal + propina;
    
    return {
      tarifaBase,
      porDistancia,
      porTiempo,
      subtotal,
      propina,
      total
    };
  };

  const desglose = calcularDesgloseTarifa();

  if (loading) {
    return (
      <div className="detalle-viaje-overlay">
        <div className="detalle-viaje">
          <div className="detalle-header">
            <h3>Detalles del Viaje</h3>
            <button className="cerrar-btn" onClick={onClose}>×</button>
          </div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="detalle-viaje-overlay">
      <div className="detalle-viaje">
        <div className="detalle-header">
          <h3>Detalles del Viaje</h3>
          <button className="cerrar-btn" onClick={onClose}>×</button>
        </div>

        <div className="detalle-contenido">
          {/* Información del conductor */}
          {driverData && (
            <div className="seccion-conductor">
              <div className="info-conductor">
                <img 
                  src={driverData.fotoUrl || '/placeholder-driver.jpg'} 
                  alt="Foto del conductor" 
                  className="foto-conductor"
                  onError={(e) => e.target.src='/placeholder-driver.jpg'}
                />
                <div className="datos-conductor">
                  <h4>{driverData.nombre || driverData.nombreCompleto || 'Conductor'}</h4>
                  <div className="calificacion">
                    {'⭐'.repeat(Math.floor(driverData.calificacion || 0))} 
                    <span>{driverData.calificacion || 0}/5</span>
                  </div>
                  <p>{driverData.vehiculo?.modelo || 'Auto'} • {driverData.placas || 'Sin placas'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Ruta del viaje */}
          <div className="seccion-ruta">
            <h4>Ruta</h4>
            <div className="ruta-detalle">
              <div className="origen">
                <span className="icono">📍</span>
                <span>{viaje.origen?.descripcion || 'Origen desconocido'}</span>
              </div>
              <div className="destino">
                <span className="icono">🏁</span>
                <span>{viaje.destino?.descripcion || 'Destino desconocido'}</span>
              </div>
            </div>
          </div>

          {/* Desglose de tarifa */}
          {desglose && (
            <div className="seccion-tarifa">
              <h4>Desglose de Tarifa</h4>
              <div className="desglose">
                <div className="item-desglose">
                  <span>Tarifa base:</span>
                  <span>${desglose.tarifaBase.toFixed(2)}</span>
                </div>
                <div className="item-desglose">
                  <span>Por distancia ({viaje.distancia || 0} km):</span>
                  <span>${desglose.porDistancia.toFixed(2)}</span>
                </div>
                <div className="item-desglose">
                  <span>Por tiempo ({viaje.duracion || 0} min):</span>
                  <span>${desglose.porTiempo.toFixed(2)}</span>
                </div>
                <div className="item-desglose subtotal">
                  <span>Subtotal:</span>
                  <span>${desglose.subtotal.toFixed(2)}</span>
                </div>
                <div className="item-desglose">
                  <span>Propina:</span>
                  <span>${desglose.propina.toFixed(2)}</span>
                </div>
                <div className="item-desglose total">
                  <span>Total:</span>
                  <span>${desglose.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Fechas y horas */}
          <div className="seccion-fechas">
            <h4>Fechas y Horas</h4>
            <div className="fechas-detalle">
              <div className="fecha-item">
                <span>Inicio:</span>
                <span>{formatearFecha(viaje.createdAt)}</span>
              </div>
              <div className="fecha-item">
                <span>Fin:</span>
                <span>{formatearFecha(viaje.finalizadoAt)}</span>
              </div>
            </div>
          </div>

          {/* Método de pago */}
          <div className="seccion-pago">
            <h4>Método de Pago</h4>
            <div className="metodo-pago">
              <span>
                {viaje.metodoPago === 'efectivo' 
                  ? '💵 Efectivo' 
                  : `💳 ${viaje.metodoPago || 'Otro'} ••${viaje.ultimos4Digitos || '****'}`}
              </span>
            </div>
          </div>

          {/* Calificación */}
          {viaje.calificacionPasajero && (
            <div className="seccion-calificacion">
              <h4>Tu Calificación</h4>
              <div className="tu-calificacion">
                {'⭐'.repeat(viaje.calificacionPasajero)}
                <span>{viaje.calificacionPasajero}/5</span>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="acciones-viaje">
          <button 
            className="btn-accion btn-recibo" 
            onClick={() => setShowReceipt(true)}
          >
            📄 Descargar Recibo
          </button>
          
          <button 
            className="btn-accion btn-repetir" 
            onClick={() => setShowRepeatOption(true)}
          >
            🔄 Repetir Viaje
          </button>
        </div>
      </div>

      {/* Modal de recibo */}
      {showReceipt && (
        <ReciboViaje 
          viaje={viaje} 
          conductor={driverData}
          onClose={() => setShowReceipt(false)} 
        />
      )}

      {/* Modal de repetir viaje */}
      {showRepeatOption && (
        <div className="modal-repetir">
          <div className="contenido-modal">
            <h3>¿Repetir este viaje?</h3>
            <p>Se pre-llenarán el origen y destino de este viaje.</p>
            <div className="acciones-modal">
              <button 
                className="btn-confirmar" 
                onClick={() => {
                  // Aquí iría la lógica para repetir el viaje
                  console.log('Repetir viaje:', viaje);
                  setShowRepeatOption(false);
                  onClose();
                }}
              >
                Sí, repetir
              </button>
              <button 
                className="btn-cancelar" 
                onClick={() => setShowRepeatOption(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleViaje;