/**
 * Calcula la tarifa estimada para un viaje
 * @param {number} distanciaKm - Distancia del viaje en kilómetros
 * @param {number} duracionMin - Duración estimada del viaje en minutos
 * @returns {object} Objeto con tarifas estimadas
 */
export function calcularTarifa(distanciaKm, duracionMin) {
  const tarifaBase = 30; // pesos mexicanos
  const costoPorKm = 8;
  const costoPorMinuto = 2;
  const total = tarifaBase + (distanciaKm * costoPorKm) + (duracionMin * costoPorMinuto);
  return {
    estimadoMin: Math.floor(total * 0.9),
    estimadoMax: Math.ceil(total * 1.1),
    exacto: total
  };
}