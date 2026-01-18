import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const TrackingETA = ({ rideId, passengerLocation }) => {
  const [rideData, setRideData] = useState(null);
  const [driverData, setDriverData] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    if (!rideId) return;

    const rideRef = doc(db, 'rides', rideId);
    const unsubscribe = onSnapshot(rideRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setRideData(data);
        
        // Calcular ETA y distancia si hay ubicación del conductor
        if (data.driverUid && data.estado === 'aceptado' && data.taxistaUbicacion && passengerLocation) {
          const dist = calculateDistance(
            data.taxistaUbicacion.latitude,
            data.taxistaUbicacion.longitude,
            passengerLocation.latitude,
            passengerLocation.longitude
          );
          setDistance(dist);
          
          // Suponiendo una velocidad promedio de 30 km/h
          const timeInHours = dist / 30;
          const timeInMinutes = Math.round(timeInHours * 60);
          setEta(timeInMinutes);
        }
      }
    });

    return () => unsubscribe();
  }, [rideId, passengerLocation]);

  useEffect(() => {
    if (rideData?.driverUid) {
      const driverRef = doc(db, 'drivers', rideData.driverUid);
      const unsubscribe = onSnapshot(driverRef, (snapshot) => {
        if (snapshot.exists()) {
          setDriverData(snapshot.data());
        }
      });

      return () => unsubscribe();
    }
  }, [rideData?.driverUid]);

  // Función para calcular distancia entre dos puntos (en kilómetros)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
  };

  if (!rideData) {
    return null;
  }

  const handleCallDriver = () => {
    if (driverData?.telefono) {
      window.open(`tel:${driverData.telefono}`, '_self');
    }
  };

  const handleCancelRide = async () => {
    // Lógica para cancelar el viaje
    // Actualizar estado del viaje a 'cancelado'
  };

  return (
    <div className="tracking-eta-container">
      {rideData.estado === 'pendiente' && (
        <div className="status-card buscando">
          <h3>Buscando conductor cercano...</h3>
          <div className="loading-animation">
            <div className="spinner"></div>
          </div>
        </div>
      )}

      {(rideData.estado === 'aceptado' || rideData.estado === 'conductor_en_camino') && driverData && (
        <div className="status-card conductor-asignado">
          <div className="driver-info">
            {driverData.fotoUrl && (
              <img src={driverData.fotoUrl} alt="Foto del conductor" className="driver-photo" />
            )}
            <div className="driver-details">
              <h3>{driverData.nombre || driverData.nombreCompleto || 'Taxista'}</h3>
              <div className="rating">
                {'⭐'.repeat(Math.floor(driverData.calificacion || 0))}
                {driverData.calificacion ? ` ${driverData.calificacion}/5` : ' Sin calificación'}
              </div>
              <p className="vehicle-info">
                {driverData.vehiculo?.modelo || 'Auto'} {driverData.vehiculo?.color || ''} • {driverData.placas || 'Sin placas'}
              </p>
              <p className="arrival-message">
                {eta && distance ? `Llega en ${eta} min • ${distance.toFixed(1)} km` : 'Calculando tiempo de llegada...'}
              </p>
            </div>
          </div>

          <div className="action-buttons">
            <button className="call-button" onClick={handleCallDriver}>
              📞 Llamar
            </button>
            <button className="cancel-button" onClick={handleCancelRide}>
              ❌ Cancelar viaje
            </button>
          </div>
        </div>
      )}

      {rideData.estado === 'en_viaje' && (
        <div className="status-card en-viaje">
          <h3>En viaje</h3>
          <p>Disfruta tu trayecto</p>
        </div>
      )}

      {rideData.estado === 'finalizado' && (
        <div className="status-card completado">
          <h3>Viaje completado</h3>
          <p>Gracias por usar nuestro servicio</p>
        </div>
      )}
    </div>
  );
};

export default TrackingETA;