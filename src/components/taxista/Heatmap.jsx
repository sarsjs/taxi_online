import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const Heatmap = () => {
  const [zonasDemanda, setZonasDemanda] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular la obtención de datos de zonas de alta demanda
    // En una implementación real, esto vendría de una colección especializada
    const mockZonas = [
      { id: 1, nombre: 'Centro', lat: 19.4326, lng: -99.1332, demanda: 'alta', distancia: '2.3 km' },
      { id: 2, nombre: 'Polanco', lat: 19.4284, lng: -99.2399, demanda: 'media', distancia: '5.1 km' },
      { id: 3, nombre: 'Roma Norte', lat: 19.4194, lng: -99.1674, demanda: 'baja', distancia: '3.7 km' },
      { id: 4, nombre: 'Condesa', lat: 19.4081, lng: -99.1790, demanda: 'alta', distancia: '4.2 km' },
      { id: 5, nombre: 'Juárez', lat: 19.4329, lng: -99.1531, demanda: 'media', distancia: '1.8 km' }
    ];
    
    setZonasDemanda(mockZonas);
    setLoading(false);
    
    // En una implementación real, escucharíamos actualizaciones de una colección
    /*
    const q = query(collection(db, 'demandZones'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const zonasData = [];
      snapshot.forEach((doc) => {
        zonasData.push({ id: doc.id, ...doc.data() });
      });
      setZonasDemanda(zonasData);
      setLoading(false);
    });
    
    return () => unsubscribe();
    */
  }, []);

  const getColorClass = (demanda) => {
    switch (demanda) {
      case 'alta': return 'high-demand';
      case 'media': return 'medium-demand';
      case 'baja': return 'low-demand';
      default: return 'low-demand';
    }
  };

  if (loading) {
    return (
      <div className="heatmap">
        <p>Cargando mapa de calor...</p>
      </div>
    );
  }

  return (
    <div className="heatmap">
      <div className="map-container">
        <div className="map-placeholder">
          <p>Mapa interactivo de zonas de demanda</p>
          <div className="legend">
            <span className="legend-item high-demand">Alta demanda</span>
            <span className="legend-item medium-demand">Demanda media</span>
            <span className="legend-item low-demand">Baja demanda</span>
          </div>
        </div>
      </div>
      
      <div className="zonas-demanda">
        <h4>Zonas de alta demanda cercanas</h4>
        <div className="zonas-list">
          {zonasDemanda.map(zona => (
            <div key={zona.id} className={`zona-demanda ${getColorClass(zona.demanda)}`}>
              <div className="zona-info">
                <h5>{zona.nombre}</h5>
                <p>{zona.distancia} de distancia</p>
              </div>
              <div className="zona-demanda-indicator">
                {zona.demanda === 'alta' && '🔴'}
                {zona.demanda === 'media' && '🟡'}
                {zona.demanda === 'baja' && '🟢'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Heatmap;