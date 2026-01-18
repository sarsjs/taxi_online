import React from 'react';

const QuickReplies = ({ onSendMessage, disabled = false }) => {
  const quickReplies = [
    { text: 'Salgo en 2 minutos', icon: '⏱️' },
    { text: 'Estoy en la puerta', icon: '🚪' },
    { text: 'Ya voy llegando', icon: '🚗' },
    { text: 'Gracias', icon: '🙏' },
    { text: '¿Dónde estás?', icon: '📍' },
    { text: 'Voy a llegar tarde', icon: '🕐' },
    { text: '¿Puedes esperarme?', icon: '⏳' },
    { text: 'Todo listo', icon: '✅' }
  ];

  const handleQuickReply = (reply) => {
    if (!disabled) {
      onSendMessage(reply);
    }
  };

  return (
    <div className="quick-replies">
      <div className="quick-replies-title">Mensajes rápidos:</div>
      <div className="quick-replies-grid">
        {quickReplies.map((reply, index) => (
          <button
            key={index}
            className="quick-reply-btn"
            onClick={() => handleQuickReply(reply.text)}
            disabled={disabled}
          >
            <span className="reply-icon">{reply.icon}</span>
            <span className="reply-text">{reply.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickReplies;