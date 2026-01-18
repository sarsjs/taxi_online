import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { calcularGananciasDelDia, calcularViajesDelDia, calcularCalificacionPromedio, 
         calcularHorasActivo, obtenerGananciasPorDia, obtenerViajesPorDia, 
         calcularHorasPico, calcularComparacionSemanal, calcularMetricasHistoricas, 
         calcularMetricasSemanaActual, calcularObjetivos } from '../../utils/statsCalculator';
import GananciasChart from './GananciasChart';
import Heatmap from './Heatmap';
import Objetivos from './Objetivos';

const Dashboard = ({ userId }) => {
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'rides'),
      where('driverUid', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const viajesData = [];
      snapshot.forEach((doc) => {
        viajesData.push({ id: doc.id, ...doc.data() });
      });
      setViajes(viajesData);
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return (
      <div className="dashboard-taxista">
        <h2>Dashboard del Conductor</h2>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-taxista">
        <h2>Dashboard del Conductor</h2>
        <p>Error: {error}</p>
      </div>
    );
  }

  // Calcular métricas
  const gananciasDia = calcularGananciasDelDia(viajes);
  const viajesDia = calcularViajesDelDia(viajes);
  const calificacionPromedio = calcularCalificacionPromedio(viajes);
  const horasActivo = calcularHorasActivo(viajes);
  const gananciasSemana = calcularGananciasSemana(viajes);
  const viajesSemana = calcularViajesSemana(viajes);
  const gananciasPorDia = obtenerGananciasPorDia(viajes);
  const viajesPorDia = obtenerViajesPorDia(viajes);
  const horasPico = calcularHorasPico(viajes);
  const comparacionSemanal = calcularComparacionSemanal(viajes);
  const metricasHistoricas = calcularMetricasHistoricas(viajes);
  const metricasSemanaActual = calcularMetricasSemanaActual(viajes);
  const objetivos = calcularObjetivos(viajes);

  return (
    <div className="dashboard-taxista">
      <h2>Dashboard del Conductor</h2>
      
      {/* Resumen del día */}
      <div className="resumen-dia">
        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-info">
            <h3>Ganancias del día</h3>
            <p className="metric-value">${gananciasDia.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">🚗</div>
          <div className="metric-info">
            <h3>Viajes completados</h3>
            <p className="metric-value">{viajesDia}</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">⭐</div>
          <div className="metric-info">
            <h3>Calificación promedio</h3>
            <p className="metric-value">{calificacionPromedio.toFixed(1)}</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-info">
            <h3>Horas activo</h3>
            <p className="metric-value">{horasActivo.toFixed(1)}h</p>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="graficas-seccion">
        <div className="grafica">
          <h3>Ganancias de la semana</h3>
          <GananciasChart datos={gananciasPorDia} tipo="ganancias" />
        </div>
        
        <div className="grafica">
          <h3>Viajes por día</h3>
          <GananciasChart datos={viajesPorDia} tipo="viajes" />
        </div>
      </div>

      {/* Horas pico */}
      <div className="horas-pico">
        <h3>Horas pico</h3>
        <p>Tus mejores horas: {horasPico.slice(0, 2).join(', ')}</p>
      </div>

      {/* Mis métricas */}
      <div className="metricas-seccion">
        <h3>Mis métricas</h3>
        
        <div className="metricas-historicas">
          <h4>Total histórico</h4>
          <div className="metricas-grid">
            <div className="metrica-item">
              <span className="metrica-label">Total de viajes:</span>
              <span className="metrica-value">{metricasHistoricas.totalViajes}</span>
            </div>
            <div className="metrica-item">
              <span className="metrica-label">Ingresos totales:</span>
              <span className="metrica-value">${metricasHistoricas.ingresosTotales.toFixed(2)}</span>
            </div>
            <div className="metrica-item">
              <span className="metrica-label">Calificación general:</span>
              <span className="metrica-value">
                {metricasHistoricas.calificacionPromedio.toFixed(1)} ⭐ ({metricasHistoricas.totalCalificaciones} ratings)
              </span>
            </div>
          </div>
        </div>
        
        <div className="metricas-semana">
          <h4>Esta semana</h4>
          <div className="metricas-grid">
            <div className="metrica-item">
              <span className="metrica-label">Viajes:</span>
              <span className="metrica-value">{metricasSemanaActual.viajes}</span>
            </div>
            <div className="metrica-item">
              <span className="metrica-label">Ingresos:</span>
              <span className="metrica-value">${metricasSemanaActual.ingresos.toFixed(2)}</span>
            </div>
            <div className="metrica-item">
              <span className="metrica-label">Promedio por viaje:</span>
              <span className="metrica-value">${metricasSemanaActual.promedioPorViaje.toFixed(2)}</span>
            </div>
          </div>
          <div className="comparacion">
            <span className={`comparacion-indicator ${comparacionSemanal >= 0 ? 'positive' : 'negative'}`}>
              {comparacionSemanal >= 0 ? '📈' : '📉'} {Math.abs(comparacionSemanal)}% más que la semana pasada
            </span>
          </div>
        </div>
      </div>

      {/* Mapa de calor */}
      <div className="heatmap-seccion">
        <h3>Zonas de alta demanda</h3>
        <Heatmap />
      </div>

      {/* Objetivos y logros */}
      <div className="objetivos-seccion">
        <h3>Objetivos y logros</h3>
        <Objetivos objetivos={objetivos} />
      </div>

      {/* Rankings */}
      <div className="rankings-seccion">
        <h3>Rankings</h3>
        <div className="ranking-item">
          <p>Eres el <strong>#12</strong> de 150 conductores esta semana</p>
        </div>
        <div className="ranking-item">
          <p>Top 5 conductores del mes: [Simulado]</p>
        </div>
      </div>

      {/* Historial de ganancias */}
      <div className="historial-ganancias">
        <h3>Historial de ganancias</h3>
        <div className="ganancias-lista">
          {viajes.slice(0, 10).map((viaje) => (
            <div key={viaje.id} className="ganancia-item">
              <span className="fecha">
                {viaje.createdAt ? viaje.createdAt.toDate().toLocaleDateString('es-MX') : 'Fecha desconocida'}
              </span>
              <span className="monto">${viaje.montoFinal || 0}</span>
            </div>
          ))}
        </div>
        <button className="btn-exportar">Exportar a CSV</button>
      </div>

      {/* Sección de pagos */}
      <div className="pagos-seccion">
        <h3>Pagos</h3>
        <div className="saldo-disponible">
          <h4>Saldo disponible</h4>
          <p className="saldo-amount">${metricasSemanaActual.ingresos.toFixed(2)}</p>
        </div>
        <button className="btn-transferir">Transferir a mi cuenta</button>
        <div className="historial-retiros">
          <h4>Historial de retiros</h4>
          <p>[Historial de retiros simulado]</p>
        </div>
        <button className="btn-configurar-cuenta">Configurar cuenta bancaria</button>
      </div>
    </div>
  );
};

export default Dashboard;