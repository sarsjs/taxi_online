import React, { useState } from 'react'; 
import { calcularTarifa } from '../utils/tarifasCalculator';

function TarifaEstimada({ distanciaKm, duracionMin }) {
  const tarifa = calcularTarifa(distanciaKm, duracionMin);
  
  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <h4>Tarifa Estimada</h4>
      <p className="muted">
        ${tarifa.estimadoMin} - ${tarifa.estimadoMax}
      </p>
      <p className="muted" style={{ fontSize: '0.9rem' }}>
        Distancia: {distanciaKm.toFixed(1)} km • Duración: {duracionMin.toFixed(0)} min
      </p>
    </div>
  );
}

export default TarifaEstimada;
 
