import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMapEvents,
  Marker,
  Popup,
  useMap
} from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'

// Crear ícono de taxi personalizado
const taxiIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjgiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxMSIgcng9IjIiIHJ5PSIyIj48L3JlY3Q+PGNpcmNsZSBjeD0iOC41IiBjeT0iMTkiIHI9IjEiPjwvY2lyY2xlPjxjaXJjbGUgY3g9IjE1LjUiIGN5PSIxOSIgcj0iMSI+PC9jaXJjbGU+PHBhdGggZD0iTTEyIDE2SDRhMiAyIDAgMCAxLTItMlY4YTIgMiAwIDAgMSAyLTJoMTZhMiAyIDAgMCAxIDIgMnY2YTIgMiAwIDAgMS0yIDJIMiI+PC9wYXRoPjwvc3ZnPg==',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
})

// Componente para centrar automáticamente al cargar
function AutoCenterOnLoad({ currentUserLocation }) {
  const map = useMap()

  useEffect(() => {
    if (map && navigator.geolocation && !currentUserLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          // Verificar que el mapa aún exista antes de manipularlo
          if (map && map.getContainer()) {
            map.setView([latitude, longitude], 15)

            // Agregar marcador de la ubicación del usuario
            L.marker([latitude, longitude], {
              icon: L.divIcon({
                className: 'current-location-marker',
                html: '<div style="background-color: #4285f4; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })
            }).addTo(map).bindPopup('Tu ubicación')
          }
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error)
          // Mantener vista por defecto si falla
        }
      )
    } else if (map && currentUserLocation) {
      // Si ya tenemos la ubicación del usuario, centrar en ella
      if (map && map.getContainer()) {
        map.setView([currentUserLocation.latitude, currentUserLocation.longitude], 15)
      }
    }
  }, [map, currentUserLocation])

  return null
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      if (onPick) {
        onPick(event.latlng)
      }
    },
  })

  return null
}

function MapView({
  driverLocation,
  origin,
  destination,
  onPickDestination,
  onPickOrigin,
  showAvailableTaxis = false,
  currentUserLocation = null
}) {
  const hasDriver = Boolean(driverLocation)
  const hasOrigin = Boolean(origin)
  const hasDestination = Boolean(destination)
  const center = hasDriver
    ? [driverLocation.latitude, driverLocation.longitude]
    : hasOrigin
      ? [origin.latitude, origin.longitude]
      : hasDestination
        ? [destination.latitude, destination.longitude]
      : currentUserLocation
        ? [currentUserLocation.latitude, currentUserLocation.longitude]
        : [19.4326, -99.1332]

  // Estado para almacenar los taxis disponibles
  const [availableTaxis, setAvailableTaxis] = useState([])
  const taxisRef = useRef({})

  // Listener para taxis disponibles
  useEffect(() => {
    if (!showAvailableTaxis) return

    const q = query(
      collection(db, 'drivers'),
      where('disponible', '==', true),
      where('ubicacion', '!=', null)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taxis = []
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data()
          if (data.ubicacion) {
            taxis.push({
              id: change.doc.id,
              lat: data.ubicacion.latitude,
              lng: data.ubicacion.longitude,
              nombre: data.nombre || data.nombreCompleto || 'Taxista',
              calificacion: data.calificacion || 0,
              vehiculo: data.vehiculo || { modelo: 'Desconocido', placas: 'N/A', color: 'Desconocido' },
              ...data
            })
          }
        } else if (change.type === 'removed') {
          // Eliminar el taxi del estado
          setAvailableTaxis(prev => prev.filter(taxi => taxi.id !== change.doc.id))
        }
      })
      setAvailableTaxis(taxis)
    })

    return () => unsubscribe()
  }, [showAvailableTaxis])

  return (
    <div className="map-shell">
      <MapContainer center={center} zoom={14} scrollWheelZoom={false}>
        {(onPickOrigin || onPickDestination) && (
          <MapClickHandler onPick={onPickOrigin || onPickDestination} />
        )}
        <AutoCenterOnLoad currentUserLocation={currentUserLocation} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasOrigin && (
          <CircleMarker
            center={[origin.latitude, origin.longitude]}
            radius={10}
            pathOptions={{ color: '#ff7a4c', fillColor: '#ff7a4c' }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              Origen
            </Tooltip>
          </CircleMarker>
        )}
        {hasDriver && (
          <CircleMarker
            center={[driverLocation.latitude, driverLocation.longitude]}
            radius={10}
            pathOptions={{ color: '#1f3b7a', fillColor: '#1f3b7a' }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              Taxista
            </Tooltip>
          </CircleMarker>
        )}
        {hasDestination && (
          <CircleMarker
            center={[destination.latitude, destination.longitude]}
            radius={10}
            pathOptions={{ color: '#2e8b57', fillColor: '#2e8b57' }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              Destino
            </Tooltip>
          </CircleMarker>
        )}
        {showAvailableTaxis && availableTaxis.map((taxi) => (
          <Marker
            key={taxi.id}
            position={[taxi.lat, taxi.lng]}
            icon={taxiIcon}
          >
            <Popup>
              <div>
                <strong>{taxi.nombre}</strong><br />
                Calificación: {taxi.calificacion}/5<br />
                Vehículo: {taxi.vehiculo.modelo}<br />
                Placas: {taxi.vehiculo.placas}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default MapView
