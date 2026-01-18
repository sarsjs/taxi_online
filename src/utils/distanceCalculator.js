/**
 * Calculadora de distancia
 */

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

// Función para calcular distancia entre dos puntos GeoPoint de Firestore
export const calculateDistanceFromGeoPoints = (point1, point2) => {
  if (!point1 || !point2) return null;
  
  return calculateDistance(
    point1.latitude || point1.lat,
    point1.longitude || point1.lng,
    point2.latitude || point2.lat,
    point2.longitude || point2.lng
  );
};