import React from 'react';

const Objetivos = ({ objetivos }) => {
  const { viajesSemana, calificacion, sinCancelaciones } = objetivos;

  const objetivoCompletado = (actual, objetivo) => actual >= objetivo;

  return (
    <div className="objetivos-container">
      <div className="objetivo-item">
        <div className="objetivo-header">
          <h4>Completa 50 viajes esta semana</h4>
          <span className={`objetivo-status ${objetivoCompletado(viajesSemana.completados, viajesSemana.objetivo) ? 'completed' : 'in-progress'}`}>
            {viajesSemana.completados}/{viajesSemana.objetivo}
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${Math.min(100, (viajesSemana.completados / viajesSemana.objetivo) * 100)}%` }}
          ></div>
        </div>
        <p className="objetivo-description">Llevas {viajesSemana.completados} de {viajesSemana.objetivo} viajes</p>
        {!objetivoCompletado(viajesSemana.completados, viajesSemana.objetivo) && (
          <p className="bono-info">Bono de $200 al completar</p>
        )}
      </div>

      <div className="objetivo-item">
        <div className="objetivo-header">
          <h4>Mantén calificación 4.5+</h4>
          <span className={`objetivo-status ${objetivoCompletado(calificacion.promedio, calificacion.objetivo) ? 'completed' : 'in-progress'}`}>
            {calificacion.promedio.toFixed(1)}/5
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill calificacion" 
            style={{ width: `${Math.min(100, (calificacion.promedio / 5) * 100)}%` }}
          ></div>
        </div>
        <p className="objetivo-description">Tu calificación actual es de {calificacion.promedio.toFixed(1)}</p>
        {objetivoCompletado(calificacion.promedio, calificacion.objetivo) && (
          <p className="achievement-badge">✅ ¡Excelente reputación!</p>
        )}
      </div>

      <div className="objetivo-item">
        <div className="objetivo-header">
          <h4>20 viajes sin cancelación</h4>
          <span className={`objetivo-status ${objetivoCompletado(sinCancelaciones.completados, sinCancelaciones.objetivo) ? 'completed' : 'in-progress'}`}>
            {sinCancelaciones.completados}/{sinCancelaciones.objetivo}
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${Math.min(100, (sinCancelaciones.completados / sinCancelaciones.objetivo) * 100)}%` }}
          ></div>
        </div>
        <p className="objetivo-description">Has completado {sinCancelaciones.completados} viajes sin cancelar</p>
        {!objetivoCompletado(sinCancelaciones.completados, sinCancelaciones.objetivo) && (
          <p className="bono-info">Bono de $150 al completar</p>
        )}
      </div>
    </div>
  );
};

export default Objetivos;