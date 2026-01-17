import React, { useState } from 'react';

const RouteSelector = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Rutas predefinidas para demostración
  const predefinedRoutes = [
    { id: 1, origin: 'Centro', destination: 'Aeropuerto', distance: '15 km', duration: '25 min' },
    { id: 2, origin: 'Universidad', destination: 'Mall', distance: '8 km', duration: '15 min' },
    { id: 3, origin: 'Hospital', destination: 'Estación Central', distance: '10 km', duration: '20 min' },
  ];

  const handleSelectRoute = (route) => {
    setSelectedRoute(route);
    setOrigin(route.origin);
    setDestination(route.destination);
  };

  const handleCustomRoute = () => {
    if (origin && destination) {
      const customRoute = {
        id: 'custom',
        origin,
        destination,
        distance: '? km',
        duration: '? min'
      };
      setSelectedRoute(customRoute);
    }
  };

  return (
    <div className="route-selector">
      <h3>Seleccionar Ruta</h3>
      
      {/* Selección de rutas predefinidas */}
      <div className="predefined-routes">
        <h4>Rutas Predefinidas:</h4>
        {predefinedRoutes.map(route => (
          <div 
            key={route.id} 
            className={`route-option ${selectedRoute?.id === route.id ? 'selected' : ''}`}
            onClick={() => handleSelectRoute(route)}
          >
            <strong>{route.origin} → {route.destination}</strong>
            <span>{route.distance} • {route.duration}</span>
          </div>
        ))}
      </div>

      {/* Selección de ruta personalizada */}
      <div className="custom-route">
        <h4>Ruta Personalizada:</h4>
        <input
          type="text"
          placeholder="Origen"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />
        <input
          type="text"
          placeholder="Destino"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <button onClick={handleCustomRoute}>Seleccionar Ruta</button>
      </div>

      {/* Mostrar ruta seleccionada */}
      {selectedRoute && (
        <div className="selected-route">
          <h4>Ruta Seleccionada:</h4>
          <p><strong>{selectedRoute.origin} → {selectedRoute.destination}</strong></p>
          <p>Distancia: {selectedRoute.distance} | Duración: {selectedRoute.duration}</p>
        </div>
      )}
    </div>
  );
};

export default RouteSelector;