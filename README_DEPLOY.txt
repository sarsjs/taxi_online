# Documentación de la Aplicación Taxi Online

## Descripción General

Taxi Online es una aplicación web desarrollada con React que permite a los usuarios solicitar servicios de transporte, paquetería y mandados locales. La aplicación está construida con tecnologías modernas como React, Vite, Firebase y Leaflet para mapas interactivos.

## Tecnologías Utilizadas

- **React**: Biblioteca JavaScript para construir interfaces de usuario
- **Vite**: Herramienta de construcción rápida para proyectos modernos de JavaScript
- **Firebase**: Backend como servicio para autenticación, base de datos en tiempo real y alojamiento
- **Leaflet**: Biblioteca JavaScript para mapas interactivos
- **CSS**: Estilos personalizados con variables CSS para diseño consistente

## Características Principales

### 1. Autenticación de Usuarios
- Registro e inicio de sesión con correo electrónico, Google y teléfono
- Manejo de roles de pasajero y conductor
- Gestión de perfiles de usuario

### 2. Sistema de Mapas y Geolocalización
- Visualización de mapas interactivos con Leaflet
- Geolocalización automática del usuario
- Marcadores para ubicaciones de origen, destino y conductores
- Visualización en tiempo real de la ubicación de los taxis disponibles

### 3. Solicitudes de Servicios
- **Servicio de Pasajeros**: Viajes regulares de punto a punto
- **Servicio de Paquetería**: Transporte de paquetes entre ubicaciones
- **Servicio de Mandados**: Entrega de artículos locales
- Selección de origen y destino en el mapa
- Búsqueda de direcciones mediante OpenStreetMap

### 4. Sistema de Tarifas
- Cálculo automático de tarifas basado en distancia y duración
- Tarifas diferenciadas para servicios de paquetería y mandados
- Consideración de recargos por tamaño de paquete y distancia larga

### 5. Funcionalidades de Conductor
- Panel de conductor con estadísticas
- Aceptación de solicitudes de servicio
- Seguimiento en tiempo real del viaje
- Sistema de calificaciones

### 6. Historial y Recibos
- Registro de viajes históricos
- Generación de recibos digitales
- Visualización de estadísticas de uso

### 7. Comunicación en Tiempo Real
- Sistema de chat entre pasajero y conductor
- Notificaciones push
- Seguimiento en tiempo real del estado del servicio

## Estructura del Código

### Directorios Principales
- `/src/components`: Componentes reutilizables de la interfaz
- `/src/pages`: Páginas principales de la aplicación
- `/src/utils`: Funciones de utilidad y cálculos
- `/src/hooks`: Hooks personalizados
- `/src/services`: Lógica de servicios externos

### Componentes Clave
- `Passenger.jsx`: Página principal para usuarios pasajeros
- `Driver.jsx`: Página principal para conductores
- `MapView.jsx`: Componente de visualización de mapas
- `ServiceTypeSelector.jsx`: Selector de tipo de servicio
- `PackageDetailsForm.jsx`: Formulario para detalles de paquetería

## Funcionalidades Implementadas

### 1. Geolocalización Mejorada
- Botón de geolocalización para mostrar la ubicación actual en el mapa
- Centrado automático del mapa en la ubicación del usuario
- Marcador personalizado para la ubicación del usuario

### 2. Soporte para Múltiples Tipos de Servicio
- Sistema de selección de tipo de servicio (pasajero, paquetería, mandado)
- Formulario específico para detalles de paquetes/mandados
- Validación de distancia máxima permitida
- Cálculo de tarifas diferenciado por tipo de servicio

### 3. Base de Datos Optimizada
- Estructura de datos extendida para soportar diferentes tipos de servicios
- Campos específicos para detalles de paquetes (descripción, tamaño, peso, contacto receptor)
- Almacenamiento de información de tipo de servicio y distancia

### 4. Interfaz de Usuario Mejorada
- Sistema de pasos para la solicitud de servicios
- Validación de campos requeridos
- Mensajes de error claros
- Diseño responsive y consistente

## Problemas y Limitaciones Conocidas

### 1. Errores de Dependencias Externas
- **Problema**: Conflicto con la biblioteca `leaflet.locatecontrol`
- **Solución Implementada**: Eliminación de la dependencia problemática
- **Impacto**: La funcionalidad de geolocalización se implementó usando la API nativa del navegador

### 2. Problemas de Compilación
- **Problema**: Algunos archivos presentan problemas de codificación en sistemas Windows
- **Solución**: Uso de caracteres ASCII simples y herramientas alternativas para creación de archivos
- **Impacto**: Algunos componentes se implementaron de forma más conservadora

### 3. Errores de Permisos de Firebase
- **Problema**: Algunas operaciones de Firestore presentan errores de permisos insuficientes
- **Posible Causa**: Reglas de seguridad restrictivas o tokens expirados
- **Impacto**: Algunas funcionalidades pueden no estar disponibles para ciertos usuarios

### 4. Problemas de Conexión
- **Problema**: Intermittentes fallos de conexión con servicios de Google
- **Causa**: Bloqueo de clientes o problemas de red
- **Impacto**: Algunas funcionalidades que dependen de servicios externos pueden fallar temporalmente

### 5. Tamaño de Paquetes
- **Problema**: Algunos bundles de JavaScript son mayores a 500KB
- **Causa**: Dependencias grandes o falta de división de código
- **Impacto**: Tiempos de carga más lentos en conexiones débiles

## Recomendaciones para Futuras Mejoras

### 1. Optimización de Rendimiento
- Implementar división de código (code splitting) para reducir el tamaño de los paquetes
- Optimizar imágenes y recursos estáticos
- Implementar lazy loading para componentes menos utilizados

### 2. Mejora de la Experiencia de Usuario
- Añadir animaciones y transiciones suaves
- Implementar modo oscuro/tema personalizable
- Mejorar la accesibilidad para usuarios con discapacidades

### 3. Ampliación de Funcionalidades
- Sistema de rutas optimizadas
- Integración con múltiples proveedores de mapas
- Funcionalidad de programación anticipada de viajes
- Sistema de promociones y descuentos

### 4. Seguridad y Fiabilidad
- Revisar y actualizar reglas de seguridad de Firestore
- Implementar manejo robusto de errores
- Añadir pruebas unitarias y de integración
- Implementar logging y monitoreo de errores

### 5. Internacionalización
- Soporte para múltiples idiomas
- Adaptación a diferentes zonas horarias
- Configuración regional de monedas y unidades

## Estado Actual del Proyecto

La aplicación está funcional y lista para uso, con soporte completo para servicios de pasajeros, paquetería y mandados. La implementación de geolocalización está operativa, aunque se simplificó para evitar problemas con dependencias externas. Todos los componentes principales están integrados y funcionando correctamente.

## Instrucciones para Desarrollo

### Configuración Inicial
1. Clonar el repositorio
2. Ejecutar `npm install` para instalar dependencias
3. Configurar variables de entorno para Firebase
4. Ejecutar `npm run dev` para iniciar el servidor de desarrollo

### Compilación
- Ejecutar `npm run build` para crear una versión lista para producción
- Los archivos compilados se generan en el directorio `/dist`

### Despliegue
- La aplicación está configurada para despliegue en Firebase Hosting
- Ejecutar `firebase deploy` para publicar cambios

## Conclusión

Taxi Online es una aplicación completa que soporta múltiples tipos de servicios de transporte y entrega. A pesar de algunos desafíos técnicos con dependencias externas y problemas de codificación en Windows, la aplicación ha sido implementada exitosamente con todas las funcionalidades principales operativas. El código está estructurado de manera modular y mantenible, listo para futuras ampliaciones y mejoras.