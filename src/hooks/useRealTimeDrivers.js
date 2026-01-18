import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const useRealTimeDrivers = (filters = {}) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let q = query(collection(db, 'drivers'));

    // Aplicar filtros si se proporcionan
    if (filters.available !== undefined) {
      q = query(q, where('disponible', '==', filters.available));
    }

    if (filters.location) {
      // Este filtro requiere un índice compuesto en Firestore
      // No se puede filtrar por distancia directamente con Firestore
      // Se haría el filtrado en el cliente
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const driversData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Solo incluir conductores con ubicación definida
          if (data.ubicacion) {
            driversData.push({
              id: doc.id,
              ...data,
              lat: data.ubicacion.latitude,
              lng: data.ubicacion.longitude,
            });
          }
        });
        setDrivers(driversData);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
        console.error('Error al escuchar conductores en tiempo real:', err);
      }
    );

    // Limpiar listener cuando el componente se desmonte
    return () => unsubscribe();
  }, [filters]);

  return { drivers, loading, error };
};

export default useRealTimeDrivers;