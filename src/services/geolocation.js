/**
 * Servicio de geolocalización
 */

// Función para obtener la ubicación actual del usuario
export const getCurrentLocation = (options = {}) => {
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000
  };

  const opts = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no soportada'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        reject(error);
      },
      opts
    );
  });
};

// Función para calcular distancia entre dos puntos (en kilómetros)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distancia en km
};

// Función para convertir grados a radianes
const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// Función para calcular ETA (Tiempo Estimado de Llegada)
export const calculateETA = (distanceKm, speedKmh = 30) => {
  // Suponiendo una velocidad promedio en km/h
  const timeInHours = distanceKm / speedKmh;
  const timeInMinutes = Math.round(timeInHours * 60);
  return timeInMinutes;
};

// Función para obtener la dirección aproximada entre dos puntos
export const getDirection = (fromLat, fromLon, toLat, toLon) => {
  const latDiff = toLat - fromLat;
  const lonDiff = toLon - fromLon;

  if (Math.abs(latDiff) > Math.abs(lonDiff)) {
    return latDiff > 0 ? 'Norte' : 'Sur';
  } else {
    return lonDiff > 0 ? 'Este' : 'Oeste';
  }
};

// Función para convertir coordenadas a dirección (simplificada)
export const coordinatesToAddress = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
    );
    const data = await response.json();
    return data.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  } catch (error) {
    console.error('Error obteniendo dirección:', error);
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }
};