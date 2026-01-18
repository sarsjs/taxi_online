import React from 'react';

const TarifaCard = ({ distanciaKm, duracionMin, tarifa }) => {
  if (!distanciaKm || !duracionMin || !tarifa) {
    return null;
  }

  return (
    <div className="tarifa-card">
      <div className="tarifa-header">
        <div className="tarifa-icon">💰</div>
        <div className="tarifa-info">
          <h4>Tarifa estimada</h4>
          <p className="tarifa-precio">${tarifa.estimadoMin} - ${tarifa.estimadoMax}</p>
          <p className="tarifa-texto-pequeno">La tarifa final puede variar</p>
        </div>
      </div>
      
      <div className="tarifa-detalle">
        <div className="detalle-item">
          <span>Distancia:</span>
          <span>{distanciaKm.toFixed(1)} km</span>
        </div>
        <div className="detalle-item">
          <span>Duración:</span>
          <span>{duracionMin} min</span>
        </div>
        <div className="detalle-item">
          <span>Tarifa base:</span>
          <span>${30}</span>
        </div>
        <div className="detalle-item">
          <span>Por km:</span>
          <span>${8}/km</span>
        </div>
        <div className="detalle-item">
          <span>Por minuto:</span>
          <span>${2}/min</span>
        </div>
        <div className="detalle-total">
          <span>Total estimado:</span>
          <span>${tarifa.exacto.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default TarifaCard;