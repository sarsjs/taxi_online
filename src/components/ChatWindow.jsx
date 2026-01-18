import React, { useState, useRef, useEffect } from 'react';
import useChat from '../hooks/useChat';
import QuickReplies from './QuickReplies';

const ChatWindow = ({ viajeId, userId, userName, conductorInfo, pasajeroInfo, onClose }) => {
  const [mensaje, setMensaje] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const {
    mensajes,
    loading,
    error,
    enviarMensaje,
    contarMensajesNoLeidos,
    iniciarEscribiendo,
    detenerEscribiendo
  } = useChat(viajeId, userId, userName);

  // Obtener información del otro usuario (pasajero o conductor)
  const otroUsuario = userId === conductorInfo?.id ? pasajeroInfo : conductorInfo;
  
  // Auto-scroll al final de los mensajes
  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!mensaje.trim()) return;
    
    const enviado = await enviarMensaje(mensaje);
    if (enviado) {
      setMensaje('');
      detenerEscribiendo();
    }
  };

  const handleInputChange = (e) => {
    setMensaje(e.target.value);
    
    // Indicar que se está escribiendo
    if (e.target.value.length > 0) {
      iniciarEscribiendo();
    } else {
      detenerEscribiendo();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp) return '';
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const ahora = new Date();
    
    // Si es hoy
    if (fecha.toDateString() === ahora.toDateString()) {
      return fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Si es otro día
    return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' }) + 
           ' ' + fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="chat-window">
        <div className="chat-header">
          <button className="close-btn" onClick={onClose}>×</button>
          <div className="user-info">
            <div className="user-avatar">
              {otroUsuario?.fotoUrl ? (
                <img src={otroUsuario.fotoUrl} alt={otroUsuario.nombre} />
              ) : (
                <div className="avatar-placeholder">👤</div>
              )}
            </div>
            <div className="user-details">
              <h4>{otroUsuario?.nombre || 'Usuario'}</h4>
              <p className="status">Cargando...</p>
            </div>
          </div>
        </div>
        <div className="chat-messages">
          <p>Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="user-info">
          <div className="user-avatar">
            {otroUsuario?.fotoUrl ? (
              <img src={otroUsuario.fotoUrl} alt={otroUsuario.nombre} />
            ) : (
              <div className="avatar-placeholder">👤</div>
            )}
          </div>
          <div className="user-details">
            <h4>{otroUsuario?.nombre || 'Usuario'}</h4>
            <p className="status">En línea</p>
          </div>
        </div>
        {contarMensajesNoLeidos() > 0 && (
          <div className="unread-count">
            {contarMensajesNoLeidos()}
          </div>
        )}
      </div>

      <div className="chat-messages">
        {mensajes.length === 0 ? (
          <div className="no-messages">
            <p>Aún no hay mensajes en esta conversación</p>
            <p>¡Envía el primer mensaje!</p>
          </div>
        ) : (
          mensajes.map((msg) => (
            <div 
              key={msg.id} 
              className={`message ${msg.emisorId === userId ? 'sent' : 'received'}`}
            >
              <div className="message-content">
                <p>{msg.mensaje}</p>
                <span className="message-time">{formatearFecha(msg.timestamp)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <QuickReplies 
        onSendMessage={(text) => {
          setMensaje(text);
          setTimeout(() => inputRef.current?.focus(), 10);
        }} 
        disabled={loading}
      />

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          value={mensaje}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          rows="1"
          disabled={loading}
        />
        <button 
          type="submit" 
          className="send-btn" 
          disabled={!mensaje.trim() || loading}
        >
          Enviar
        </button>
      </form>

      {error && (
        <div className="chat-error">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;