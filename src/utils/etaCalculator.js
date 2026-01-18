/**
 * Calculadora de ETA (Tiempo Estimado de Llegada)
 */

// Función para calcular ETA (Tiempo Estimado de Llegada) en minutos
export const calculateETA = (distanceKm, speedKmh = 30) => {
  // Suponiendo una velocidad promedio en km/h
  const timeInHours = distanceKm / speedKmh;
  const timeInMinutes = Math.round(timeInHours * 60);
  return timeInMinutes;
};

// Función para calcular ETA considerando tráfico (simplificada)
export const calculateETAWithTraffic = (distanceKm, speedKmh = 30, trafficFactor = 1.0) => {
  // trafficFactor: 1.0 = normal, > 1.0 = más lento, < 1.0 = más rápido
  const adjustedSpeed = speedKmh / trafficFactor;
  const timeInHours = distanceKm / adjustedSpeed;
  const timeInMinutes = Math.round(timeInHours * 60);
  return timeInMinutes;
};

// Función para estimar tiempo de llegada en formato legible
export const formatETA = (minutes) => {
  if (minutes < 1) return 'Menos de 1 minuto';
  if (minutes === 1) return '1 minuto';
  if (minutes < 60) return `${minutes} minutos`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
};