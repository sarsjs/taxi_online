import React from 'react';

const DriverCard = ({ driver, onCall, onCancel, onShowDetails }) => {
  if (!driver) {
    return null;
  }

  return (
    <div className="driver-card">
      <div className="driver-header">
        <div className="driver-avatar">
          {driver.fotoUrl ? (
            <img src={driver.fotoUrl} alt="Foto del conductor" />
          ) : (
            <div className="avatar-placeholder">👤</div>
          )}
        </div>
        <div className="driver-info">
          <h3>{driver.nombre || driver.nombreCompleto || 'Taxista'}</h3>
          <div className="driver-rating">
            <span className="stars">
              {'⭐'.repeat(Math.floor(driver.calificacion || 0))}
            </span>
            <span className="rating-value">{driver.calificacion || 0}/5</span>
          </div>
          <p className="vehicle-info">
            {driver.vehiculo?.modelo || 'Auto desconocido'} • {driver.placas || 'Sin placas'}
          </p>
        </div>
      </div>
      
      <div className="driver-status">
        <p className="eta-info">
          Llega en {driver.eta || 'calculando'} min • {driver.distance?.toFixed(1) || '0.0'} km
        </p>
      </div>
      
      <div className="driver-actions">
        <button className="btn-call" onClick={onCall}>
          📞 Llamar
        </button>
        <button className="btn-cancel" onClick={onCancel}>
          ❌ Cancelar
        </button>
        <button className="btn-details" onClick={onShowDetails}>
          ℹ️ Detalles
        </button>
      </div>
    </div>
  );
};

export default DriverCard;