import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Utilidad para generar recibos de viaje en PDF
 */

export const generarReciboPDF = (viaje, conductor = null) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();

      // Configuración del documento
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);

      // Encabezado
      doc.setFontSize(20);
      doc.setTextColor(15, 169, 88); // Verde Taxi Local
      doc.text('TAXI LOCAL', 105, 20, null, null, 'center');
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Recibo de Viaje', 105, 30, null, null, 'center');

      // Línea divisoria
      doc.setDrawColor(200);
      doc.line(20, 35, 190, 35);

      // Información del viaje
      let currentY = 45;
      
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138); // Azul oscuro
      doc.text('Información del Viaje', 20, currentY);
      
      currentY += 10;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      doc.text(`ID del Viaje: ${viaje.id || 'N/A'}`, 20, currentY);
      currentY += 6;
      
      doc.text(`Fecha de inicio: ${formatearFecha(viaje.createdAt)}`, 20, currentY);
      currentY += 6;
      
      if (viaje.finalizadoAt) {
        doc.text(`Fecha de finalización: ${formatearFecha(viaje.finalizadoAt)}`, 20, currentY);
        currentY += 6;
      }

      // Ruta
      currentY += 5;
      doc.text('Ruta:', 20, currentY);
      currentY += 6;
      doc.text(`Origen: ${viaje.origen?.descripcion || 'N/A'}`, 20, currentY);
      currentY += 6;
      doc.text(`Destino: ${viaje.destino?.descripcion || 'N/A'}`, 20, currentY);
      currentY += 10;

      // Información del conductor
      if (conductor) {
        doc.text('Información del Conductor:', 20, currentY);
        currentY += 6;
        doc.text(`Nombre: ${conductor.nombre || conductor.nombreCompleto || 'N/A'}`, 20, currentY);
        currentY += 6;
        doc.text(`Vehículo: ${conductor.vehiculo?.modelo || 'N/A'} (${conductor.placas || 'N/A'})`, 20, currentY);
        currentY += 6;
        doc.text(`Teléfono: ${conductor.telefono || 'N/A'}`, 20, currentY);
        currentY += 10;
      }

      // Desglose de tarifa
      doc.text('Desglose de Tarifa:', 20, currentY);
      currentY += 6;

      // Calcular desglose
      const desglose = calcularDesgloseTarifa(viaje);
      
      // Preparar datos para la tabla
      const tableColumnHeaders = ['Concepto', 'Monto'];
      const tableRows = [
        ['Tarifa base', `$${desglose.tarifaBase.toFixed(2)}`],
        [`Por distancia (${viaje.distancia || 0} km)`, `$${desglose.porDistancia.toFixed(2)}`],
        [`Por tiempo (${viaje.duracion || 0} min)`, `$${desglose.porTiempo.toFixed(2)}`],
        ['Subtotal', `$${desglose.subtotal.toFixed(2)}`],
        ['Propina', `$${desglose.propina.toFixed(2)}`],
        ['TOTAL', `$${desglose.total.toFixed(2)}`]
      ];

      // Ajustar posición para la tabla
      if (currentY > 150) {
        doc.addPage();
        currentY = 20;
      }

      // Generar tabla
      doc.autoTable({
        head: [tableColumnHeaders],
        body: tableRows,
        startY: currentY,
        theme: 'grid',
        styles: { 
          fontSize: 10,
          cellPadding: 5
        },
        headStyles: { 
          fillColor: [15, 169, 88], // Verde Taxi Local
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 20 },
        tableWidth: 'wrap'
      });

      // Información de pago
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      if (viaje.metodoPago) {
        doc.text(`Método de pago: ${viaje.metodoPago === 'efectivo' ? 'Efectivo' : 'Tarjeta'}`, 20, finalY);
      }

      // Pie de página
      const footerY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Gracias por usar Taxi Local', 105, footerY, null, null, 'center');
      doc.text('Este recibo es válido sin firma ni sello.', 105, footerY + 5, null, null, 'center');
      doc.text('Para validar este recibo, visite nuestro sitio web.', 105, footerY + 10, null, null, 'center');

      // Guardar el PDF
      const fileName = `recibo-viaje-${viaje.id || 'sin-id'}-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      
      resolve(fileName);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      reject(error);
    }
  });
};

const formatearFecha = (timestamp) => {
  if (!timestamp) return 'N/A';
  const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return fecha.toLocaleString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const calcularDesgloseTarifa = (viaje) => {
  if (!viaje) return null;
  
  const tarifaBase = 30;
  const distancia = viaje.distancia ? parseFloat(viaje.distancia) : 0;
  const tiempo = viaje.duracion ? parseFloat(viaje.duracion) : 0;
  
  const porDistancia = distancia * 8;
  const porTiempo = tiempo * 2;
  const subtotal = tarifaBase + porDistancia + porTiempo;
  const propina = viaje.propina || 0;
  const total = subtotal + propina;
  
  return {
    tarifaBase,
    porDistancia,
    porTiempo,
    subtotal,
    propina,
    total
  };
};

export default {
  generarReciboPDF
};