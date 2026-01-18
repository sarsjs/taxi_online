import React from 'react';
import { generarReciboPDF } from '../utils/pdfGenerator';

const ReciboViaje = ({ viaje, conductor, onClose }) => {
  const generarPDF = () => {
    generarReciboPDF(viaje, conductor)
      .then(() => {
        console.log('PDF generado exitosamente');
      })
      .catch((error) => {
        console.error('Error al generar PDF:', error);
        alert('Hubo un error al generar el recibo. Por favor, inténtalo de nuevo.');
      });
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

  const calcularDesgloseTarifa = (viaje) => {
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

  const enviarPorEmail = () => {
    // Lógica para enviar recibo por email
    alert('Funcionalidad de envío por email no implementada en esta versión');
  };

  return (
    <div className="recibo-viaje-overlay">
      <div className="recibo-viaje">
        <div className="recibo-header">
          <h3>Recibo de Viaje</h3>
          <button className="cerrar-btn" onClick={onClose}>×</button>
        </div>

        <div className="recibo-contenido">
          <div className="info-viaje">
            <h4>Información del Viaje</h4>
            <p><strong>ID:</strong> {viaje.id}</p>
            <p><strong>Fecha:</strong> {formatearFecha(viaje.createdAt)}</p>
            <p><strong>Ruta:</strong> {viaje.origen?.descripcion || 'N/A'} → {viaje.destino?.descripcion || 'N/A'}</p>
          </div>

          {conductor && (
            <div className="info-conductor">
              <h4>Conductor</h4>
              <p><strong>Nombre:</strong> {conductor.nombre || conductor.nombreCompleto || 'N/A'}</p>
              <p><strong>Vehículo:</strong> {conductor.vehiculo?.modelo || 'N/A'} ({conductor.placas || 'N/A'})</p>
            </div>
          )}

          <div className="desglose-tarifa">
            <h4>Desglose de Tarifa</h4>
            <div className="tabla-desglose">
              <div className="fila-desglose">
                <span>Tarifa base:</span>
                <span>${calcularDesgloseTarifa(viaje)?.tarifaBase.toFixed(2)}</span>
              </div>
              <div className="fila-desglose">
                <span>Por distancia ({viaje.distancia || 0} km):</span>
                <span>${calcularDesgloseTarifa(viaje)?.porDistancia.toFixed(2)}</span>
              </div>
              <div className="fila-desglose">
                <span>Por tiempo ({viaje.duracion || 0} min):</span>
                <span>${calcularDesgloseTarifa(viaje)?.porTiempo.toFixed(2)}</span>
              </div>
              <div className="fila-desglose subtotal">
                <span>Subtotal:</span>
                <span>${calcularDesgloseTarifa(viaje)?.subtotal.toFixed(2)}</span>
              </div>
              <div className="fila-desglose">
                <span>Propina:</span>
                <span>${calcularDesgloseTarifa(viaje)?.propina.toFixed(2)}</span>
              </div>
              <div className="fila-desglose total">
                <span><strong>TOTAL:</strong></span>
                <span><strong>${calcularDesgloseTarifa(viaje)?.total.toFixed(2)}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="acciones-recibo">
          <button className="btn-descargar-pdf" onClick={generarPDF}>
            📄 Descargar PDF
          </button>
          <button className="btn-enviar-email" onClick={enviarPorEmail}>
            📧 Enviar por Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReciboViaje;