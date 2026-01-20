import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  GeoPoint,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import AuthOptions from '../components/AuthOptions'
import MapView from '../components/MapView'
import RouteSelector from '../components/RouteSelector'
import LandmarkSelector from '../components/LandmarkSelector'
import TarifaEstimada from '../components/TarifaEstimada'
import TrackingETA from '../components/TrackingETA'
import { uploadFile } from '../utils/uploadFile'
import { calcularTarifa } from '../utils/tarifasCalculator'
import { listenForegroundMessages, registerFcmToken } from '../utils/notifications'
import { getLocationWithFallback, storeLocation } from '../utils/ruralUtils'

function Passenger() {
  const { user, initializing, signOut } = useAuth()
  const [rideId, setRideId] = useState(null)
  const [rideData, setRideData] = useState(null)
  const [driverData, setDriverData] = useState(null)
  const [passengerDoc, setPassengerDoc] = useState(null)
  const [fullName, setFullName] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [destLat, setDestLat] = useState('')
  const [destLng, setDestLng] = useState('')
  const [destAddress, setDestAddress] = useState('')
  const [distanciaRuta, setDistanciaRuta] = useState(null)
  const [duracionRuta, setDuracionRuta] = useState(null)
  const [originLat, setOriginLat] = useState('')
  const [originLng, setOriginLng] = useState('')
  const [destinationError, setDestinationError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchError, setSearchError] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [originSearchQuery, setOriginSearchQuery] = useState('')
  const [originSearchResults, setOriginSearchResults] = useState([])
  const [originSearchError, setOriginSearchError] = useState('')
  const [originSearchLoading, setOriginSearchLoading] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [scheduleError, setScheduleError] = useState('')
  const [useCurrentLocation, setUseCurrentLocation] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  useEffect(() => {
    if (!rideId) {
      setRideData(null)
      return
    }

    const rideRef = doc(db, 'rides', rideId)
    const unsubscribe = onSnapshot(rideRef, (snapshot) => {
      setRideData(snapshot.exists() ? snapshot.data() : null)
    })

    return () => unsubscribe()
  }, [rideId])

  useEffect(() => {
    if (!user) return
    registerFcmToken({ user, collectionName: 'passengers' })
      .then((token) => setNotificationsEnabled(Boolean(token)))
      .catch(() => setNotificationsEnabled(false))
  }, [user])

  useEffect(() => {
    if (!user) {
      setPassengerDoc(null)
      return
    }

    const passengerRef = doc(db, 'passengers', user.uid)
    const unsubscribe = onSnapshot(passengerRef, (snapshot) => {
      setPassengerDoc(snapshot.exists() ? snapshot.data() : null)
    })

    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (!passengerDoc) return
    setFullName(passengerDoc.nombreCompleto || '')
    setPhotoUrl(passengerDoc.fotoUrl || '')
  }, [passengerDoc])

  useEffect(() => {
    if (!rideData?.driverUid) {
      setDriverData(null)
      return
    }

    const driverRef = doc(db, 'drivers', rideData.driverUid)
    const unsubscribe = onSnapshot(driverRef, (snapshot) => {
      setDriverData(snapshot.exists() ? snapshot.data() : null)
    })

    return () => unsubscribe()
  }, [rideData?.driverUid])

  useEffect(() => {
    const unsubscribe = listenForegroundMessages()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const requestRide = async () => {
    if (!user) return
    setLocationError('')
    setScheduleError('')
    setDestinationError('')

    if (isScheduled && !scheduledAt) {
      setScheduleError('Selecciona fecha y hora para agendar.')
      return
    }

    const latValue = Number.parseFloat(destLat)
    const lngValue = Number.parseFloat(destLng)
    const hasDestination = Number.isFinite(latValue) && Number.isFinite(lngValue)
    if (!hasDestination) {
      setDestinationError('Selecciona un destino antes de solicitar el taxi.')
      return
    }

    const createRide = async (origin) => {
      const destination =
        hasDestination ? new GeoPoint(latValue, lngValue) : null
      const scheduledTimestamp = isScheduled
        ? Timestamp.fromDate(new Date(scheduledAt))
        : null

      const rideRef = await addDoc(collection(db, 'rides'), {
        pasajeroUid: user.uid,
        driverUid: null,
        estado: 'pendiente',
        origen: origin,
        destino: destination,
        destinoTexto: destAddress.trim() || null,
        scheduledAt: scheduledTimestamp,
        tipo: isScheduled ? 'programado' : 'inmediato',
        createdAt: serverTimestamp(),
        taxistaUbicacion: null,
        tarifaEstimada: distanciaRuta && duracionRuta ? calcularTarifa(distanciaRuta, duracionRuta) : null,

      })
      setRideId(rideRef.id)
      setDestLat('')
      setDestLng('')
      setDestAddress('')
      setSearchQuery('')
      setSearchResults([])
      setDestinationError('')
      setOriginLat('')
      setOriginLng('')
      setOriginSearchQuery('')
      setOriginSearchResults([])
      setIsScheduled(false)
      setScheduledAt('')
      setUseCurrentLocation(true)
    }

    if (isScheduled && !useCurrentLocation) {
      const originLatValue = Number.parseFloat(originLat)
      const originLngValue = Number.parseFloat(originLng)
      if (!Number.isFinite(originLatValue) || !Number.isFinite(originLngValue)) {
        setScheduleError('Indica el origen para el viaje agendado.')
        return
      }
      createRide(new GeoPoint(originLatValue, originLngValue))
      return
    }

    try {
      const position = await getLocationWithFallback({ enableHighAccuracy: true, timeout: 15000 });
      storeLocation(position); // Almacenar para uso futuro

      const origin = new GeoPoint(
        position.latitude,
        position.longitude,
      )
      await createRide(origin)
    } catch (error) {
      setLocationError('No se pudo obtener tu ubicacion. Verifica tu conexion.');
    }
  }

  const handleUpload = async (file) => {
    if (!file || !user) return
    setUploading(true)
    setUploadError('')
    try {
      const url = await uploadFile({
        file,
        path: `passengers/${user.uid}/foto.jpg`,
      })
      setPhotoUrl(url)
    } catch {
      setUploadError('No se pudo subir la foto. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    if (!user) return
    setSavingProfile(true)
    await setDoc(
      doc(db, 'passengers', user.uid),
      {
        nombreCompleto: fullName.trim(),
        fotoUrl: photoUrl || null,
        telefono: user.phoneNumber || '',
        rol: 'pasajero',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
    setSavingProfile(false)
  }

  const canRequestRide =
    !rideData || rideData.estado === 'finalizado' || rideData.estado === 'cancelado'
  const rideStatusClass =
    rideData?.estado === 'pendiente'
      ? 'pending'
      : rideData?.estado === 'aceptado' || rideData?.estado === 'en curso'
        ? 'accepted'
        : ''

  const canCancelRide =
    rideData && ['pendiente', 'aceptado', 'en curso'].includes(rideData.estado)

  const cancelRide = async () => {
    if (!rideId) return
    await updateDoc(doc(db, 'rides', rideId), {
      estado: 'cancelado',
      canceladoAt: serverTimestamp(),
    })
  }

  useEffect(() => {
    if (!rideData?.driverUid) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (!notificationsEnabled) return
    const key = `passenger_ride_${rideId || 'current'}`
    const lastDriver = localStorage.getItem(key)
    if (lastDriver === rideData.driverUid) return
    localStorage.setItem(key, rideData.driverUid)
    new Notification('Taxi asignado', {
      body: 'Un taxista acepto tu solicitud.',
    })
  }, [rideData?.driverUid, rideId, notificationsEnabled])

  const selectDestination = (lat, lng, label) => {
    setDestLat(lat.toFixed(6))
    setDestLng(lng.toFixed(6))
    setDestAddress(label || '')
    setDestinationError('')
  }

  const pickDestinationFromMap = (latlng) => {
    selectDestination(latlng.lat, latlng.lng, 'Punto seleccionado en el mapa')
  }

  const selectOrigin = (lat, lng) => {
    setOriginLat(lat.toFixed(6))
    setOriginLng(lng.toFixed(6))
  }

  const pickOriginFromMap = (latlng) => {
    selectOrigin(latlng.lat, latlng.lng)
  }

  const runSearch = async (queryText, setLoading, setError, setResults) => {
    if (!queryText.trim()) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(
          queryText.trim(),
        )}`,
        {
          headers: { 'Accept-Language': 'es' },
        },
      )
      if (!response.ok) {
        throw new Error('search_failed')
      }
      const data = await response.json()
      const results = data.map((item) => ({
        id: item.place_id,
        label: item.display_name,
        lat: Number.parseFloat(item.lat),
        lng: Number.parseFloat(item.lon),
      }))
      setResults(results)
      if (results.length === 0) {
        setError('No encontramos resultados para esa direccion.')
      }
    } catch {
      setError('No se pudo buscar la direccion. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const searchAddress = async () => {
    await runSearch(searchQuery, setSearchLoading, setSearchError, setSearchResults)
  }

  const searchOriginAddress = async () => {
    await runSearch(
      originSearchQuery,
      setOriginSearchLoading,
      setOriginSearchError,
      setOriginSearchResults,
    )
  }

  if (initializing) {
    return <p className="muted">Cargando sesion...</p>
  }

  const draftDestination =
    destLat && destLng
      ? { latitude: Number(destLat), longitude: Number(destLng) }
      : null
  const draftOrigin =
    !useCurrentLocation && originLat && originLng
      ? { latitude: Number(originLat), longitude: Number(originLng) }
      : null
  const mapOrigin = rideData?.origen || draftOrigin
  const mapDestination = rideData?.destino || draftDestination
  const hasDestination = Boolean(destLat && destLng)
  const quickFare =
    distanciaRuta && duracionRuta ? calcularTarifa(distanciaRuta, duracionRuta) : null

  return (
    <div className="screen">
      {!user && <AuthOptions recaptchaId="recaptcha-passenger" />}

      {user && (
        <>
          <div className="map-hero">
            <MapView
              origin={mapOrigin}
              destination={mapDestination}
              driverLocation={driverData?.ubicacion || null}
              showAvailableTaxis={!rideData || rideData.estado !== 'aceptado'}
            />
            <div className="map-search-card">
              <span aria-hidden="true">🔍</span>
              <input
                type="text"
                readOnly
                value={destAddress || ''}
                placeholder="¿A dónde vamos?"
              />
            </div>
            <section className="card map-overlay">
              <h3 className="section-title">Estado del viaje</h3>
              {!rideData && <p className="muted">Listo para pedir un taxi.</p>}
              {rideData && (
                <>
                  <span className={`status-pill ${rideStatusClass}`}>
                    {rideData.estado}
                  </span>
                  <p className="muted" style={{ marginTop: '0.5rem' }}>
                    Solicitud: {rideId}
                  </p>
                  {!rideData.driverUid && (
                    <p className="muted">Buscando taxista disponible...</p>
                  )}
                  {rideData.driverUid && (
                    <p className="muted">Taxista asignado: {rideData.driverUid}</p>
                  )}
                  {rideData.destinoTexto && (
                    <p className="muted">Destino: {rideData.destinoTexto}</p>
                  )}
                  {rideData.scheduledAt && (
                    <p className="muted">
                      Programado para:{' '}
                      {rideData.scheduledAt.toDate().toLocaleString('es-MX')}
                    </p>
                  )}
                  {canCancelRide && (
                    <div style={{ marginTop: '0.8rem' }}>
                      <button className="button outline" onClick={cancelRide}>
                        Cancelar viaje
                      </button>
                      <p className="muted" style={{ marginTop: '0.4rem' }}>
                        Cancelar no genera cargos.
                      </p>
                    </div>
                  )}
                </>
              )}
            </section>
            {rideId && (
              <TrackingETA
                rideId={rideId}
                passengerLocation={mapOrigin}
              />
            )}
            <div className="map-bottom-sheet">
              <div className="sheet-handle" />
              <div className="sheet-info">
                <h3>Taxi Estándar</h3>
                <div className="price-tag">
                  {quickFare
                    ? `$${quickFare.estimadoMin}-${quickFare.estimadoMax}`
                    : '$0.00'}
                </div>
              </div>
              <button
                className="button"
                onClick={requestRide}
                disabled={!canRequestRide || (isScheduled && !scheduledAt) || !hasDestination}
              >
                Solicitar ahora
              </button>
            </div>
          </div>

          <section className="card panel">
            <h3 className="section-title">Solicitar taxi</h3>


            <div className="field">
              <label htmlFor="schedule-toggle">
                <input
                  id="schedule-toggle"
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(event) => {
                    const checked = event.target.checked
                    setIsScheduled(checked)
                    if (checked) {
                      setUseCurrentLocation(false)
                    } else {
                      setUseCurrentLocation(true)
                    }
                  }}
                />{' '}
                Agendar viaje
              </label>
            </div>
            {isScheduled && (
              <>
                <div className="field">
                  <label htmlFor="schedule-time">Fecha y hora</label>
                  <input
                    id="schedule-time"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(event) => setScheduledAt(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="origin-current-toggle">
                    <input
                      id="origin-current-toggle"
                      type="checkbox"
                      checked={useCurrentLocation}
                      onChange={(event) => setUseCurrentLocation(event.target.checked)}
                    />{' '}
                    Usar mi ubicacion actual como origen
                  </label>
                </div>
                {!useCurrentLocation && (
                  <>
                    <div className="field">
                      <label htmlFor="origin-search">Buscar origen</label>
                      <input
                        id="origin-search"
                        placeholder="Ej: Calle 5, Terminal..."
                        value={originSearchQuery}
                        onChange={(event) => setOriginSearchQuery(event.target.value)}
                      />
                    </div>
                    <button
                      className="button secondary"
                      onClick={searchOriginAddress}
                      disabled={originSearchLoading}
                    >
                      {originSearchLoading ? 'Buscando...' : 'Buscar origen'}
                    </button>
                    {originSearchError && <p className="muted">{originSearchError}</p>}
                    {originSearchResults.length > 0 && (
                      <div className="list" style={{ marginTop: '1rem' }}>
                        {originSearchResults.map((result) => (
                          <div className="list-item" key={result.id}>
                            <p className="muted">{result.label}</p>
                            <button
                              className="button outline"
                              onClick={() => selectOrigin(result.lat, result.lng)}
                            >
                              Usar este origen
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="muted" style={{ marginTop: '1rem' }}>
                      O toca el mapa para marcar el origen.
                    </p>
                    <div style={{ marginTop: '0.6rem' }}>
                      <MapView
                        origin={draftOrigin}
                        onPickOrigin={pickOriginFromMap}
                      />
                    </div>
                  </>
                )}
                {scheduleError && <p className="muted">{scheduleError}</p>}
              </>
            )}
            <RouteSelector
              onSelectRoute={(route) => {
                if (route.origin) {
                  setOriginLat(route.origin.latitude.toString());
                  setOriginLng(route.origin.longitude.toString());
                }
                if (route.destination) {
                  setDestLat(route.destination.latitude.toString());
                  setDestLng(route.destination.longitude.toString());
                  setDestAddress(route.destinationText || '');
                  setDestinationError('');
                }
                // Capturar distancia y duración si están disponibles en la ruta
                if (route.distancia) {
                  setDistanciaRuta(route.distancia);
                }
                if (route.duracion) {
                  setDuracionRuta(route.duracion);
                }
              }}
            />
            {distanciaRuta && duracionRuta && (
              <TarifaEstimada
                distanciaKm={distanciaRuta}
                duracionMin={duracionRuta}
              />
            )}
            <LandmarkSelector
              onSelectLandmark={(landmark) => {
                setDestLat(landmark.location.latitude.toString());
                setDestLng(landmark.location.longitude.toString());
                setDestAddress(landmark.name + ' - ' + landmark.description);
                setDestinationError('');
              }}
              type="destination"
            />
            <div className="field">
              <label htmlFor="dest-search">Buscar destino</label>
              <input
                id="dest-search"
                placeholder="Ej: Plaza central, Calle 5..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <button
              className="button secondary"
              onClick={searchAddress}
              disabled={searchLoading}
            >
              {searchLoading ? 'Buscando...' : 'Buscar direccion'}
            </button>
            {searchError && <p className="muted">{searchError}</p>}
            {searchResults.length > 0 && (
              <div className="list" style={{ marginTop: '1rem' }}>
                {searchResults.map((result) => (
                  <div className="list-item" key={result.id}>
                    <p className="muted">{result.label}</p>
                    <button
                      className="button outline"
                      onClick={() =>
                        selectDestination(result.lat, result.lng, result.label)
                      }
                    >
                      Usar este destino
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="muted" style={{ marginTop: '1rem' }}>
              O toca el mapa para marcar el destino.
            </p>
            <div style={{ marginTop: '0.6rem' }}>
              <MapView
                destination={draftDestination}
                onPickDestination={pickDestinationFromMap}
              />
            </div>
            {destAddress && <p className="muted">Destino elegido: {destAddress}</p>}
            {destinationError && <p className="muted">{destinationError}</p>}
            <button
              className="button"
              onClick={requestRide}
              disabled={!canRequestRide || (isScheduled && !scheduledAt)}
            >
              {distanciaRuta && duracionRuta ? (
                <>
                  Pedir taxi • ${calcularTarifa(distanciaRuta, duracionRuta).estimadoMin}-${calcularTarifa(distanciaRuta, duracionRuta).estimadoMax}
                </>
              ) : (
                'Pedir taxi'
              )}
            </button>
            {locationError && <p className="muted">{locationError}</p>}
          </section>

          <section className="card panel">
            <h3 className="section-title">Tu cuenta</h3>
            <p className="muted">Sesion activa: {user.phoneNumber || user.email}</p>
            <div className="field">
              <label htmlFor="passenger-name">Nombre completo</label>
              <input
                id="passenger-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="passenger-photo">Foto de perfil</label>
              <input
                id="passenger-photo"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    handleUpload(file)
                  }
                }}
              />
              {photoUrl && <p className="muted">Foto guardada.</p>}
            </div>
            {uploadError && <p className="muted">{uploadError}</p>}
            {uploading && <p className="muted">Subiendo foto...</p>}
            <div className="cta-row">
              <button
                className="button"
                onClick={saveProfile}
                disabled={!fullName.trim() || savingProfile}
              >
                Guardar perfil
              </button>
              <button className="button outline" onClick={signOut}>
                Cerrar sesion
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default Passenger
