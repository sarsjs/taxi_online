import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const LandmarkSelector = ({ onSelectLandmark, type = 'destination', userId = null }) => {
  const [customLandmark, setCustomLandmark] = useState('');
  const [selectedLandmark, setSelectedLandmark] = useState(null);
  const [landmarks, setLandmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar landmarks desde Firestore
  useEffect(() => {
    let q;
    if (userId) {
      // Si hay userId, cargar landmarks personales del usuario
      q = query(collection(db, 'userLandmarks'), where('userId', '==', userId));
    } else {
      // Si no hay userId, cargar landmarks públicos
      q = query(collection(db, 'landmarks'), where('public', '==', true));
    }

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const loadedLandmarks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Combinar con landmarks comunes predeterminados
        const commonLandmarks = [
          { id: 'home', name: 'Casa', icon: '🏠', address: 'Mi casa', category: 'personal' },
          { id: 'work', name: 'Trabajo', icon: '🏢', address: 'Mi trabajo', category: 'personal' },
          { id: 'airport', name: 'Aeropuerto', icon: '✈️', address: 'Aeropuerto Internacional', category: 'transporte' },
          { id: 'center', name: 'Centro', icon: '🏙️', address: 'Centro de la ciudad', category: 'comercial' },
          { id: 'hospital', name: 'Hospital', icon: '🏥', address: 'Hospital Central', category: 'salud' },
          { id: 'university', name: 'Universidad', icon: '🎓', address: 'Universidad Local', category: 'educativo' },
        ];

        setLandmarks([...loadedLandmarks, ...commonLandmarks]);
        setLoading(false);
      },
      (err) => {
        console.error('Error al cargar landmarks:', err);
        setError('No se pudieron cargar los lugares frecuentes');
        setLoading(false);

        // En caso de error, mostrar landmarks comunes predeterminados
        const commonLandmarks = [
          { id: 'home', name: 'Casa', icon: '🏠', address: 'Mi casa', category: 'personal' },
          { id: 'work', name: 'Trabajo', icon: '🏢', address: 'Mi trabajo', category: 'personal' },
          { id: 'airport', name: 'Aeropuerto', icon: '✈️', address: 'Aeropuerto Internacional', category: 'transporte' },
          { id: 'center', name: 'Centro', icon: '🏙️', address: 'Centro de la ciudad', category: 'comercial' },
          { id: 'hospital', name: 'Hospital', icon: '🏥', address: 'Hospital Central', category: 'salud' },
          { id: 'university', name: 'Universidad', icon: '🎓', address: 'Universidad Local', category: 'educativo' },
        ];

        setLandmarks(commonLandmarks);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const handleSelectLandmark = (landmark) => {
    setSelectedLandmark(landmark);
    if (onSelectLandmark) {
      onSelectLandmark(landmark);
    }
  };

  const handleAddCustomLandmark = () => {
    if (customLandmark.trim()) {
      const newLandmark = {
        id: `custom-${Date.now()}`,
        name: customLandmark,
        icon: '📍',
        address: 'Ubicación personalizada',
        category: 'personal',
        isCustom: true
      };
      handleSelectLandmark(newLandmark);
      setCustomLandmark('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddCustomLandmark();
    }
  };

  if (loading) {
    return (
      <div className="landmark-selector">
        <h3>Seleccionar Lugar</h3>
        <p className="muted">Cargando lugares frecuentes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="landmark-selector">
        <h3>Seleccionar Lugar</h3>
        <p className="muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="landmark-selector">
      <h3>Seleccionar {type === 'destination' ? 'Destino' : 'Origen'}</h3>

      {/* Landmarks comunes */}
      {landmarks.length > 0 && (
        <div className="common-landmarks">
          <h4>Lugares Frecuentes:</h4>
          <div className="landmarks-grid">
            {landmarks.map(landmark => (
              <div
                key={landmark.id}
                className={`landmark-option ${selectedLandmark?.id === landmark.id ? 'selected' : ''}`}
                onClick={() => handleSelectLandmark(landmark)}
              >
                <span className="landmark-icon">{landmark.icon}</span>
                <div className="landmark-info">
                  <span className="landmark-name">{landmark.name}</span>
                  <span className="landmark-address">{landmark.address}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agregar lugar personalizado */}
      <div className="custom-landmark">
        <h4>Agregar Lugar Personalizado:</h4>
        <div className="custom-input-container">
          <input
            type="text"
            placeholder="Nombre del lugar..."
            value={customLandmark}
            onChange={(e) => setCustomLandmark(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={handleAddCustomLandmark}>Agregar</button>
        </div>
      </div>

      {/* Mostrar landmark seleccionado */}
      {selectedLandmark && (
        <div className="selected-landmark">
          <h4>Lugar Seleccionado:</h4>
          <div className="selected-info">
            <span className="selected-icon">{selectedLandmark.icon}</span>
            <div>
              <span className="selected-name">{selectedLandmark.name}</span>
              <span className="selected-address">{selectedLandmark.address}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandmarkSelector;