import React, { useState } from 'react'; 
  
const ServiceTypeSelector = ({ onSelectType }) =
  const [selectedType, setSelectedType] = useState('pasajero');  
  
  const serviceTypes = [  
    { id: 'pasajero', icon: '??', name: 'Viaje de Pasajero' },  
    { id: 'paqueteria', icon: '??', name: 'Paqueter¡a' },  
    { id: 'mandado', icon: '???', name: 'Mandado Local' }  
  ]; 
