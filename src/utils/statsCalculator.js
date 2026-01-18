/**
 * Utilidades para cálculo de estadísticas del conductor
 */

// Calcular ganancias del día
export const calcularGananciasDelDia = (viajes) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const viajesHoy = viajes.filter(viaje => {
    const fechaViaje = viaje.fecha ? viaje.fecha.toDate() : new Date(viaje.timestamp);
    return fechaViaje.toDateString() === hoy.toDateString();
  });
  
  return viajesHoy.reduce((total, viaje) => total + (viaje.montoFinal || 0), 0);
};

// Calcular viajes del día
export const calcularViajesDelDia = (viajes) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const viajesHoy = viajes.filter(viaje => {
    const fechaViaje = viaje.fecha ? viaje.fecha.toDate() : new Date(viaje.timestamp);
    return fechaViaje.toDateString() === hoy.toDateString();
  });
  
  return viajesHoy.length;
};

// Calcular calificación promedio
export const calcularCalificacionPromedio = (viajes) => {
  if (viajes.length === 0) return 0;
  
  const calificaciones = viajes
    .filter(viaje => viaje.calificacion !== undefined && viaje.calificacion !== null)
    .map(viaje => viaje.calificacion);
  
  if (calificaciones.length === 0) return 0;
  
  const suma = calificaciones.reduce((acc, cal) => acc + cal, 0);
  return suma / calificaciones.length;
};

// Calcular horas activo
export const calcularHorasActivo = (viajes) => {
  // Esta función dependerá de los timestamps de inicio y fin de disponibilidad
  // Por ahora, retornamos un valor estimado basado en los viajes
  if (viajes.length === 0) return 0;
  
  // Suponiendo que cada viaje toma en promedio 30 minutos
  const minutosEstimados = viajes.length * 30;
  return minutosEstimados / 60; // Convertir a horas
};

// Calcular ganancias por semana
export const calcularGananciasSemana = (viajes) => {
  const hoy = new Date();
  const primerDiaSemana = new Date(hoy);
  primerDiaSemana.setDate(hoy.getDate() - hoy.getDay());
  primerDiaSemana.setHours(0, 0, 0, 0);
  
  const viajesSemana = viajes.filter(viaje => {
    const fechaViaje = viaje.fecha ? viaje.fecha.toDate() : new Date(viaje.timestamp);
    return fechaViaje >= primerDiaSemana;
  });
  
  return viajesSemana.reduce((total, viaje) => total + (viaje.montoFinal || 0), 0);
};

// Calcular viajes por semana
export const calcularViajesSemana = (viajes) => {
  const hoy = new Date();
  const primerDiaSemana = new Date(hoy);
  primerDiaSemana.setDate(hoy.getDate() - hoy.getDay());
  primerDiaSemana.setHours(0, 0, 0, 0);
  
  const viajesSemana = viajes.filter(viaje => {
    const fechaViaje = viaje.fecha ? viaje.fecha.toDate() : new Date(viaje.timestamp);
    return fechaViaje >= primerDiaSemana;
  });
  
  return viajesSemana.length;
};

// Obtener ganancias por día de la semana
export const obtenerGananciasPorDia = (viajes) => {
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const hoy = new Date();
  const primerDiaSemana = new Date(hoy);
  primerDiaSemana.setDate(hoy.getDate() - hoy.getDay());
  
  const gananciasPorDia = dias.map((dia, index) => {
    const fecha = new Date(primerDiaSemana);
    fecha.setDate(primerDiaSemana.getDate() + index);
    fecha.setHours(0, 0, 0, 0);
    
    const fechaFin = new Date(fecha);
    fechaFin.setDate(fecha.getDate() + 1);
    
    const viajesDia = viajes.filter(viaje => {
      const fechaViaje = viaje.fecha ? viaje.fecha.toDate() : new Date(viaje.timestamp);
      return fechaViaje >= fecha && fechaViaje < fechaFin;
    });
    
    const gananciaDia = viajesDia.reduce((total, viaje) => total + (viaje.montoFinal || 0), 0);
    
    return {
      dia,
      ganancia: gananciaDia
    };
  });
  
  return gananciasPorDia;
};

// Obtener viajes por día de la semana
export const obtenerViajesPorDia = (viajes) => {
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const hoy = new Date();
  const primerDiaSemana = new Date(hoy);
  primerDiaSemana.setDate(hoy.getDate() - hoy.getDay());
  
  const viajesPorDia = dias.map((dia, index) => {
    const fecha = new Date(primerDiaSemana);
    fecha.setDate(primerDiaSemana.getDate() + index);
    fecha.setHours(0, 0, 0, 0);
    
    const fechaFin = new Date(fecha);
    fechaFin.setDate(fecha.getDate() + 1);
    
    const viajesDia = viajes.filter(viaje => {
      const fechaViaje = viaje.fecha ? viaje.fecha.toDate() : new Date(viaje.timestamp);
      return fechaViaje >= fecha && fechaViaje < fechaFin;
    });
    
    return {
      dia,
      viajes: viajesDia.length
    };
  });
  
  return viajesPorDia;
};

// Calcular horas pico
export const calcularHorasPico = (viajes) => {
  // Agrupar viajes por hora
  const viajesPorHora = {};
  
  viajes.forEach(viaje => {
    const fecha = viaje.fecha ? viaje.fecha.toDate() : new Date(viaje.timestamp);
    const hora = fecha.getHours();
    
    if (!viajesPorHora[hora]) {
      viajesPorHora[hora] = 0;
    }
    viajesPorHora[hora]++;
  });
  
  // Encontrar las horas con más viajes
  const horasOrdenadas = Object.entries(viajesPorHora)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4) // Top 4 horas
    .map(([hora]) => parseInt(hora));
  
  // Convertir a formato legible
  const horasPico = horasOrdenadas.map(hora => {
    if (hora < 12) {
      return `${hora} - ${hora + 1} AM`;
    } else if (hora === 12) {
      return `12 - 1 PM`;
    } else {
      return `${hora - 12} - ${hora - 11} PM`;
    }
  });
  
  return horasPico;
};

// Calcular comparación con semana anterior
export const calcularComparacionSemanal = (viajes) => {
  const hoy = new Date();
  const primerDiaSemana = new Date(hoy);
  primerDiaSemana.setDate(hoy.getDate() - hoy.getDay());
  
  const primerDiaSemanaPasada = new Date(primerDiaSemana);
  primerDiaSemanaPasada.setDate(primerDiaSemana.getDate() - 7);
  
  // Ganancias esta semana
  const viajesEstaSemana = viajes.filter(viaje => {
    const fechaViaje = viaje.fecha ? viaje.fecha.toDate() : new Date(viaje.timestamp);
    return fechaViaje >= primerDiaSemana;
  });
  const gananciasEstaSemana = viajesEstaSemana.reduce((total, viaje) => total + (viaje.montoFinal || 0), 0);
  
  // Ganancias semana pasada
  const viajesSemanaPasada = viajes.filter(viaje => {
    const fechaViaje = viaje.fecha ? viaje.fecha.toDate() : new Date(viaje.timestamp);
    return fechaViaje >= primerDiaSemanaPasada && fechaViaje < primerDiaSemana;
  });
  const gananciasSemanaPasada = viajesSemanaPasada.reduce((total, viaje) => total + (viaje.montoFinal || 0), 0);
  
  if (gananciasSemanaPasada === 0) {
    return gananciasEstaSemana > 0 ? 100 : 0; // Incremento del 100% si antes era 0
  }
  
  const diferencia = gananciasEstaSemana - gananciasSemanaPasada;
  const porcentaje = (diferencia / gananciasSemanaPasada) * 100;
  
  return Math.round(porcentaje * 100) / 100; // Redondear a 2 decimales
};

// Calcular métricas históricas
export const calcularMetricasHistoricas = (viajes) => {
  const totalViajes = viajes.length;
  const ingresosTotales = viajes.reduce((total, viaje) => total + (viaje.montoFinal || 0), 0);
  const calificacionPromedio = calcularCalificacionPromedio(viajes);
  const totalCalificaciones = viajes.filter(viaje => viaje.calificacion !== undefined).length;
  
  return {
    totalViajes,
    ingresosTotales,
    calificacionPromedio,
    totalCalificaciones
  };
};

// Calcular métricas semana actual
export const calcularMetricasSemanaActual = (viajes) => {
  const hoy = new Date();
  const primerDiaSemana = new Date(hoy);
  primerDiaSemana.setDate(hoy.getDate() - hoy.getDay());
  
  const viajesSemana = viajes.filter(viaje => {
    const fechaViaje = viaje.fecha ? viaje.fecha.toDate() : new Date(viaje.timestamp);
    return fechaViaje >= primerDiaSemana;
  });
  
  const viajesCount = viajesSemana.length;
  const ingresos = viajesSemana.reduce((total, viaje) => total + (viaje.montoFinal || 0), 0);
  const promedioPorViaje = viajesCount > 0 ? ingresos / viajesCount : 0;
  
  return {
    viajes: viajesCount,
    ingresos,
    promedioPorViaje
  };
};

// Calcular objetivos
export const calcularObjetivos = (viajes) => {
  const hoy = new Date();
  const primerDiaSemana = new Date(hoy);
  primerDiaSemana.setDate(hoy.getDate() - hoy.getDay());
  
  const viajesSemana = viajes.filter(viaje => {
    const fechaViaje = viaje.fecha ? viaje.fecha.toDate() : new Date(viaje.timestamp);
    return fechaViaje >= primerDiaSemana;
  });
  
  const viajesCompletados = viajesSemana.length;
  const calificacionPromedio = calcularCalificacionPromedio(viajes);
  const viajesSinCancelar = viajes.filter(viaje => viaje.estado !== 'cancelado').length;
  
  return {
    viajesSemana: {
      completados: viajesCompletados,
      objetivo: 50
    },
    calificacion: {
      promedio: calificacionPromedio,
      objetivo: 4.5
    },
    sinCancelaciones: {
      completados: viajesSinCancelar,
      objetivo: 20
    }
  };
};

export default {
  calcularGananciasDelDia,
  calcularViajesDelDia,
  calcularCalificacionPromedio,
  calcularHorasActivo,
  calcularGananciasSemana,
  calcularViajesSemana,
  obtenerGananciasPorDia,
  obtenerViajesPorDia,
  calcularHorasPico,
  calcularComparacionSemanal,
  calcularMetricasHistoricas,
  calcularMetricasSemanaActual,
  calcularObjetivos
};