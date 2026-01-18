/**
 * Utilidad para filtrar lenguaje ofensivo
 */

// Lista de palabras ofensivas (puede ampliarse)
const palabrasOfensivas = [
  'puto', 'puta', 'mierda', 'joder', 'coño', 'cabrón', 'cabron', 
  'pendejo', 'maricón', 'maricon', 'gilipollas', 'idiota', 'estúpido',
  'estupido', 'maldito', 'maldita', 'hijo de puta', 'hija de puta',
  'chingar', 'chingada', 'chingado', 'verga', 'vrg', 'pinche', 'chingon'
];

// Patrones regulares para detectar palabras ofensivas
const patronesOfensivos = palabrasOfensivas.map(palabra => new RegExp(palabra, 'gi'));

/**
 * Filtra un mensaje para detectar lenguaje ofensivo
 * @param {string} mensaje - El mensaje a filtrar
 * @returns {object} - Resultado con el mensaje filtrado y si contiene ofensas
 */
export const filtrarLenguajeOfensivo = (mensaje) => {
  if (!mensaje || typeof mensaje !== 'string') {
    return { mensaje: '', contieneOfensas: false };
  }

  let mensajeFiltrado = mensaje;
  let contieneOfensas = false;

  // Verificar si contiene palabras ofensivas
  for (const patron of patronesOfensivos) {
    if (patron.test(mensajeFiltrado)) {
      contieneOfensas = true;
      // Opcional: reemplazar palabras ofensivas con asteriscos
      mensajeFiltrado = mensajeFiltrado.replace(patron, (match) => '*'.repeat(match.length));
    }
  }

  return {
    mensajeOriginal: mensaje,
    mensajeFiltrado,
    contieneOfensas
  };
};

/**
 * Valida si un mensaje es apropiado
 * @param {string} mensaje - El mensaje a validar
 * @returns {boolean} - True si es apropiado, false si contiene ofensas
 */
export const esMensajeApropiado = (mensaje) => {
  if (!mensaje || typeof mensaje !== 'string') {
    return true; // Considerar cadenas vacías como apropiadas
  }

  const resultado = filtrarLenguajeOfensivo(mensaje);
  return !resultado.contieneOfensas;
};

/**
 * Sanitiza un mensaje (elimina HTML y otros caracteres peligrosos)
 * @param {string} mensaje - El mensaje a sanitizar
 * @returns {string} - Mensaje sanitizado
 */
export const sanitizarMensaje = (mensaje) => {
  if (!mensaje || typeof mensaje !== 'string') {
    return '';
  }

  // Eliminar etiquetas HTML
  let mensajeSanitizado = mensaje.replace(/<[^>]*>/g, '');

  // Eliminar caracteres especiales que podrían ser usados para inyección
  mensajeSanitizado = mensajeSanitizado.replace(/[<>]/g, '');

  return mensajeSanitizado.trim();
};

export default {
  filtrarLenguajeOfensivo,
  esMensajeApropiado,
  sanitizarMensaje
};