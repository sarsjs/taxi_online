import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import DetalleViaje from './DetalleViaje';

const HistorialViajes = ({ userId }) => {
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedViaje, setSelectedViaje] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState('todo');
  const [filtroEstado, setFiltroEstado] = useState('completado');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(true);

  const viajesPorPagina = 20;

  useEffect(() => {
    cargarViajes();
  }, [userId, filtroFecha, filtroEstado, pagina]);

  const cargarViajes = async () => {
    if (!userId) return;

    try {
      let q = query(
        collection(db, 'rides'),
        where('pasajeroUid', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(viajesPorPagina * pagina)
      );

      // Aplicar filtro de estado
      if (filtroEstado === 'completado') {
        q = query(q, where('estado', '==', 'finalizado'));
      } else if (filtroEstado === 'cancelado') {
        q = query(q, where('estado', '==', 'cancelado'));
      }

      // Aplicar filtro de fecha
      const hoy = new Date();
      let fechaInicio = null;

      switch (filtroFecha) {
        case 'hoy':
          fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
          break;
        case 'esta_semana':
          const primerDiaSemana = new Date(hoy);
          primerDiaSemana.setDate(hoy.getDate() - hoy.getDay());
          fechaInicio = new Date(primerDiaSemana.getFullYear(), primerDiaSemana.getMonth(), primerDiaSemana.getDate());
          break;
        case 'este_mes':
          fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          break;
        case 'este_anio':
          fechaInicio = new Date(hoy.getFullYear(), 0, 1);
          break;
        default:
          // Sin filtro de fecha
          break;
      }

      if (fechaInicio) {
        q = query(q, where('createdAt', '>=', fechaInicio));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const viajesData = [];
        snapshot.forEach((doc) => {
          viajesData.push({ id: doc.id, ...doc.data() });
        });
        setViajes(viajesData);
        setLoading(false);
        setHayMas(viajesData.length === viajesPorPagina * pagina);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp) return '';
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return fecha.toLocaleString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearRuta = (origen, destino) => {
    if (!origen || !destino) return 'Ruta desconocida';
    return `${origen.descripcion || 'Origen'} → ${destino.descripcion || 'Destino'}`;
  };

  const formatearMetodoPago = (metodoPago, ultimos4Digitos) => {
    if (metodoPago === 'efectivo') {
      return '💵 Efectivo';
    } else if (metodoPago === 'tarjeta' && ultimos4Digitos) {
      return `💳 Visa ••${ultimos4Digitos}`;
    }
    return '💳 Otro';
  };

  const getStatusBadge = (estado) => {
    const statusMap = {
      finalizado: { text: 'Completado', class: 'status-completed' },
      cancelado: { text: 'Cancelado', class: 'status-cancelled' },
      pendiente: { text: 'Pendiente', class: 'status-pending' },
      aceptado: { text: 'Aceptado', class: 'status-accepted' },
      'en curso': { text: 'En curso', class: 'status-in-progress' }
    };

    const status = statusMap[estado] || { text: estado, class: 'status-unknown' };
    return (
      <span className={`status-badge ${status.class}`}>
        {status.text}
      </span>
    );
  };

  const filtrarViajes = () => {
    return viajes.filter(viaje => {
      const coincideBusqueda = busqueda === '' || 
        formatearRuta(viaje.origen, viaje.destino).toLowerCase().includes(busqueda.toLowerCase());
      
      return coincideBusqueda;
    });
  };

  const viajesFiltrados = filtrarViajes();

  if (loading) {
    return (
      <div className="historial-viajes">
        <h2>Historial de Viajes</h2>
        <p>Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="historial-viajes">
        <h2>Historial de Viajes</h2>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="historial-viajes">
      <h2>Historial de Viajes</h2>
      
      <div className="filtros-historial">
        <div className="filtro-grupo">
          <label>Filtrar por fecha:</label>
          <select value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)}>
            <option value="todo">Todo</option>
            <option value="hoy">Hoy</option>
            <option value="esta_semana">Esta semana</option>
            <option value="este_mes">Este mes</option>
            <option value="este_anio">Este año</option>
          </select>
        </div>
        
        <div className="filtro-grupo">
          <label>Filtrar por estado:</label>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
            <option value="todos">Todos</option>
          </select>
        </div>
        
        <div className="filtro-grupo">
          <label>Buscar destino:</label>
          <input
            type="text"
            placeholder="Buscar destino..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="lista-viajes">
        {viajesFiltrados.length === 0 ? (
          <p>No tienes viajes registrados.</p>
        ) : (
          viajesFiltrados.map((viaje) => (
            <div 
              key={viaje.id} 
              className="item-viaje"
              onClick={() => setSelectedViaje(viaje)}
            >
              <div className="info-viaje">
                <div className="fecha-hora">
                  {formatearFecha(viaje.createdAt)}
                </div>
                
                <div className="ruta">
                  {formatearRuta(viaje.origen, viaje.destino)}
                </div>
                
                <div className="detalles">
                  <span className="tarifa">${viaje.montoFinal || viaje.tarifaEstimada?.exacto || 0}</span>
                  <span className="metodo-pago">
                    {formatearMetodoPago(viaje.metodoPago, viaje.ultimos4Digitos)}
                  </span>
                  {getStatusBadge(viaje.estado)}
                </div>
              </div>
              
              {viaje.driverUid && (
                <div className="foto-conductor">
                  <img 
                    src={viaje.driverFotoUrl || '/placeholder-driver.jpg'} 
                    alt="Conductor" 
                    onError={(e) => e.target.src='/placeholder-driver.jpg'}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {hayMas && (
        <button 
          className="btn-cargar-mas"
          onClick={() => setPagina(pagina + 1)}
        >
          Cargar más viajes
        </button>
      )}

      {selectedViaje && (
        <DetalleViaje 
          viaje={selectedViaje} 
          onClose={() => setSelectedViaje(null)} 
        />
      )}
    </div>
  );
};

export default HistorialViajes;