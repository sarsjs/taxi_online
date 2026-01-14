import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMapEvents,
} from 'react-leaflet'

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
      : [19.4326, -99.1332]

  return (
    <div className="map-shell">
      <MapContainer center={center} zoom={14} scrollWheelZoom={false}>
        {(onPickOrigin || onPickDestination) && (
          <MapClickHandler onPick={onPickOrigin || onPickDestination} />
        )}
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
      </MapContainer>
    </div>
  )
}

export default MapView
