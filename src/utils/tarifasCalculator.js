/**
 * Calculadora de tarifas
 */

export const calcularTarifa = (distanciaKm, duracionMin) => {
  const tarifaBase = 30; // pesos mexicanos
  const costoPorKm = 8;
  const costoPorMinuto = 2;
  const total = tarifaBase + (distanciaKm * costoPorKm) + (duracionMin * costoPorMinuto);
  return {
    estimadoMin: Math.floor(total * 0.9),
    estimadoMax: Math.ceil(total * 1.1),
    exacto: total
  };
};