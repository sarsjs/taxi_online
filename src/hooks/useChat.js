import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { filtrarLenguajeOfensivo, sanitizarMensaje } from '../utils/profanityFilter';

const useChat = (viajeId, userId, userName) => {
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const [usuariosEscribiendo, setUsuariosEscribiendo] = useState([]);

  // Cargar mensajes del viaje
  useEffect(() => {
    if (!viajeId) return;

    const mensajesRef = collection(db, 'rides', viajeId, 'mensajes');
    const q = query(mensajesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mensajesData = [];
      snapshot.forEach((doc) => {
        mensajesData.push({ id: doc.id, ...doc.data() });
      });
      setMensajes(mensajesData);
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [viajeId]);

  // Enviar un mensaje
  const enviarMensaje = async (texto) => {
    if (!viajeId || !userId || !userName || !texto.trim()) {
      return false;
    }

    try {
      // Sanitizar y filtrar el mensaje
      const mensajeSanitizado = sanitizarMensaje(texto);
      const resultadoFiltro = filtrarLenguajeOfensivo(mensajeSanitizado);

      if (resultadoFiltro.contieneOfensas) {
        throw new Error('El mensaje contiene lenguaje inapropiado');
      }

      const mensajesRef = collection(db, 'rides', viajeId, 'mensajes');
      await addDoc(mensajesRef, {
        emisorId: userId,
        emisorNombre: userName,
        mensaje: resultadoFiltro.mensajeFiltrado,
        timestamp: serverTimestamp(),
        leido: false
      });

      return true;
    } catch (error) {
      setError(error.message);
      return false;
    }
  };

  // Marcar mensajes como leídos
  const marcarComoLeido = async (mensajeId) => {
    if (!viajeId || !mensajeId) return;

    try {
      const mensajeRef = doc(db, 'rides', viajeId, 'mensajes', mensajeId);
      await updateDoc(mensajeRef, { leido: true });
    } catch (error) {
      console.error('Error al marcar mensaje como leído:', error);
    }
  };

  // Marcar todos los mensajes como leídos
  const marcarTodosComoLeidos = async () => {
    if (!viajeId) return;

    try {
      // Actualizar todos los mensajes no leídos del otro usuario
      const mensajesRef = collection(db, 'rides', viajeId, 'mensajes');
      const q = query(mensajesRef, where('leido', '==', false), where('emisorId', '!=', userId));

      // En Firebase, no podemos actualizar múltiples documentos con una sola operación
      // Por lo tanto, necesitamos obtener los documentos y actualizarlos individualmente
      const snapshot = await getDocs(q);
      const updates = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { leido: true })
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error al marcar mensajes como leídos:', error);
    }
  };

  // Simular que un usuario está escribiendo
  const iniciarEscribiendo = () => {
    setEscribiendo(true);
    // Enviar señal de "escribiendo" al otro usuario (esto se haría con Cloud Functions)
    // Por ahora, solo lo simulamos localmente
  };

  const detenerEscribiendo = () => {
    setEscribiendo(false);
    // Enviar señal de "dejar de escribir" al otro usuario
  };

  // Contar mensajes no leídos
  const contarMensajesNoLeidos = useCallback(() => {
    return mensajes.filter(mensaje => 
      !mensaje.leido && mensaje.emisorId !== userId
    ).length;
  }, [mensajes, userId]);

  // Obtener últimos mensajes no leídos
  const obtenerUltimosMensajesNoLeidos = useCallback(() => {
    return mensajes.filter(mensaje => 
      !mensaje.leido && mensaje.emisorId !== userId
    ).slice(-5); // Últimos 5 mensajes no leídos
  }, [mensajes, userId]);

  return {
    mensajes,
    loading,
    error,
    enviarMensaje,
    marcarComoLeido,
    marcarTodosComoLeidos,
    contarMensajesNoLeidos,
    obtenerUltimosMensajesNoLeidos,
    iniciarEscribiendo,
    detenerEscribiendo,
    escribiendo,
    usuariosEscribiendo
  };
};

export default useChat;