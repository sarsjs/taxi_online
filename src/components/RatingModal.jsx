import React, { useState } from 'react';

const RatingModal = ({ isOpen, onClose, onSubmit, tripData, userType }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState([]);
  const [tip, setTip] = useState(0);

  if (!isOpen) return null;

  const handleTagToggle = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }

    onSubmit({
      rating,
      comment,
      tags,
      tip
    });
    onClose();
  };

  // Determinar qué conjunto de tags mostrar según el tipo de usuario
  const availableTags = userType === 'pasajero' 
    ? ['Limpio', 'Puntual', 'Amable', 'Conducción suave', 'Buen servicio']
    : ['Educado', 'Puntual', 'Respetuoso'];

  return (
    <div className="rating-modal-overlay">
      <div className="rating-modal">
        <div className="modal-header">
          <h3>
            {userType === 'pasajero' 
              ? `¿Cómo estuvo tu viaje con ${tripData?.driverName || 'el conductor'}?` 
              : `¿Cómo estuvo el viaje con ${tripData?.passengerName || 'el pasajero'}?`}
          </h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="rating-section">
          <h4>Califica tu experiencia</h4>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${star <= rating ? 'active' : ''}`}
                onClick={() => setRating(star)}
              >
                ⭐
              </span>
            ))}
          </div>
        </div>

        <div className="tags-section">
          <h4>Selecciona tags</h4>
          <div className="tags-list">
            {availableTags.map((tag) => (
              <button
                key={tag}
                className={`tag-btn ${tags.includes(tag) ? 'active' : ''}`}
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="comment-section">
          <h4>Añade un comentario (opcional)</h4>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comparte tu experiencia..."
          />
        </div>

        <div className="tip-section">
          <h4>¿Quieres dejar propina?</h4>
          <div className="tip-buttons">
            <button className="tip-btn" onClick={() => setTip(10)}>+$10</button>
            <button className="tip-btn" onClick={() => setTip(20)}>+$20</button>
            <button className="tip-btn" onClick={() => setTip(30)}>+$30</button>
            <button className="tip-btn" onClick={() => setTip(0)}>No gracias</button>
          </div>
        </div>

        <div className="submit-section">
          <button className="submit-btn" onClick={handleSubmit}>
            Enviar calificación
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;