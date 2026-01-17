// Funciones de utilidad para zonas semirurales

// Función para obtener la ubicación con manejo de errores para áreas con conectividad limitada
export function getLocationWithFallback(options = {}) {
  return new Promise((resolve, reject) => {
    // Opciones predeterminadas para alta precisión y tiempos razonables
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 segundos de timeout
      maximumAge: 60000 // Permitir caché de hasta 1 minuto
    };
    
    const opts = { ...defaultOptions, ...options };
    
    // Intentar obtener la ubicación actual
    if (navigator.geolocation) {
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
          console.warn('Error obteniendo ubicación:', error.message);
          
          // Si falla, intentar usar ubicación previa almacenada
          const lastKnownLocation = getLastKnownLocation();
          if (lastKnownLocation) {
            console.info('Usando ubicación anterior almacenada');
            resolve(lastKnownLocation);
          } else {
            // Si no hay ubicación anterior, usar ubicación predeterminada
            const defaultLocation = getDefaultLocation();
            console.info('Usando ubicación predeterminada');
            resolve(defaultLocation);
          }
        },
        opts
      );
    } else {
      // Geolocalización no soportada
      const lastKnownLocation = getLastKnownLocation();
      if (lastKnownLocation) {
        console.info('Geolocalización no soportada, usando ubicación anterior');
        resolve(lastKnownLocation);
      } else {
        const defaultLocation = getDefaultLocation();
        console.info('Geolocalización no soportada, usando ubicación predeterminada');
        resolve(defaultLocation);
      }
    }
  });
}

// Obtener la última ubicación conocida almacenada
function getLastKnownLocation() {
  try {
    const locationStr = localStorage.getItem('lastKnownLocation');
    if (locationStr) {
      const location = JSON.parse(locationStr);
      // Verificar que no sea demasiado antigua (máximo 30 minutos)
      const age = Date.now() - location.timestamp;
      if (age < 30 * 60 * 1000) { // 30 minutos en milisegundos
        return location;
      }
    }
  } catch (error) {
    console.error('Error leyendo ubicación anterior:', error);
  }
  return null;
}

// Almacenar la ubicación conocida
export function storeLocation(location) {
  try {
    const locationToStore = {
      ...location,
      timestamp: Date.now()
    };
    localStorage.setItem('lastKnownLocation', JSON.stringify(locationToStore));
  } catch (error) {
    console.error('Error almacenando ubicación:', error);
  }
}

// Obtener ubicación predeterminada (configurable por región)
function getDefaultLocation() {
  // Esta ubicación predeterminada puede ser configurada por el administrador
  // para cada comunidad/zona rural específica
  const defaultCoords = {
    latitude: parseFloat(localStorage.getItem('defaultLatitude')) || 19.4326, // Ciudad de México por defecto
    longitude: parseFloat(localStorage.getItem('defaultLongitude')) || -99.1332,
    accuracy: null,
    timestamp: Date.now()
  };
  
  return defaultCoords;
}

// Establecer ubicación predeterminada para la zona
export function setDefaultLocation(latitude, longitude) {
  try {
    localStorage.setItem('defaultLatitude', latitude.toString());
    localStorage.setItem('defaultLongitude', longitude.toString());
  } catch (error) {
    console.error('Error estableciendo ubicación predeterminada:', error);
  }
}

// Función para calcular distancia entre dos puntos (en kilómetros)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distancia en km
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Función para verificar conectividad y ajustar comportamiento
export function checkConnectivity() {
  return navigator.onLine;
}

// Función para obtener estado de conectividad con evento
export function onConnectivityChange(callback) {
  const handler = () => callback(navigator.onLine);
  window.addEventListener('online', handler);
  window.addEventListener('offline', handler);
  
  // Retornar función para remover listeners
  return () => {
    window.removeEventListener('online', handler);
    window.removeEventListener('offline', handler);
  };
}