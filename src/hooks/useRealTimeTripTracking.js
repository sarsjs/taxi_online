import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { calculateDistance } from '../utils/distanceCalculator';
import { calculateETA } from '../utils/etaCalculator';

const useRealTimeTripTracking = (rideId) => {
  const [rideData, setRideData] = useState(null);
  const [driverData, setDriverData] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!rideId) {
      setLoading(false);
      return;
    }

    // Listener para el viaje
    const rideUnsubscribe = onSnapshot(
      doc(db, 'rides', rideId),
      (rideSnapshot) => {
        if (rideSnapshot.exists()) {
          const ride = rideSnapshot.data();
          setRideData(ride);

          // Si hay conductor asignado, obtener sus datos
          if (ride.driverUid) {
            const driverUnsubscribe = onSnapshot(
              doc(db, 'drivers', ride.driverUid),
              (driverSnapshot) => {
                if (driverSnapshot.exists()) {
                  setDriverData(driverSnapshot.data());
                  
                  // Calcular distancia y ETA si hay ubicaciones disponibles
                  if (ride.taxistaUbicacion && ride.origen) {
                    const dist = calculateDistance(
                      ride.taxistaUbicacion.latitude,
                      ride.taxistaUbicacion.longitude,
                      ride.origen.latitude,
                      ride.origen.longitude
                    );
                    
                    setDistance(dist);
                    setEta(calculateETA(dist));
                  }
                }
              },
              (err) => {
                setError(err);
                console.error('Error al escuchar datos del conductor:', err);
              }
            );

            // Cleanup para el listener del conductor
            return () => driverUnsubscribe();
          }
        }
      },
      (err) => {
        setError(err);
        setLoading(false);
        console.error('Error al escuchar datos del viaje:', err);
      }
    );

    setLoading(false);

    // Cleanup para el listener del viaje
    return () => rideUnsubscribe();
  }, [rideId]);

  return {
    rideData,
    driverData,
    eta,
    distance,
    loading,
    error,
  };
};

export default useRealTimeTripTracking;