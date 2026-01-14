import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  doc,
  GeoPoint,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore'
import { db } from '../firebase'
import PhoneAuth from '../components/PhoneAuth'
import { useAuth } from '../hooks/useAuth'
import MapView from '../components/MapView'
import { uploadFile } from '../utils/uploadFile'
import { listenForegroundMessages, registerFcmToken } from '../utils/notifications'

function Driver() {
  const { user, initializing, signOut } = useAuth()
  const storedRadius = Number.parseFloat(localStorage.getItem('driverRadiusKm'))
  const [driverDoc, setDriverDoc] = useState(null)
  const [profileName, setProfileName] = useState('')
  const [fullName, setFullName] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [ineUrl, setIneUrl] = useState('')
  const [licenseUrl, setLicenseUrl] = useState('')
  const [carPhotoUrl, setCarPhotoUrl] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [pendingRides, setPendingRides] = useState([])
  const [activeRideId, setActiveRideId] = useState(null)
  const [activeRide, setActiveRide] = useState(null)
  const [scheduledRides, setScheduledRides] = useState([])
  const [locationError, setLocationError] = useState('')
  const [radiusKm, setRadiusKm] = useState(
    Number.isFinite(storedRadius) && storedRadius > 0 ? storedRadius : 5,
  )
  const [cashEnabled, setCashEnabled] = useState(true)
  const [transferEnabled, setTransferEnabled] = useState(false)
  const [transferInfo, setTransferInfo] = useState('')
  const [savingPayments, setSavingPayments] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [canceledRideId, setCanceledRideId] = useState('')
  const [fareAmount, setFareAmount] = useState('')
  const [fareError, setFareError] = useState('')

  const gracePeriodMs = 3 * 24 * 60 * 60 * 1000
  const createdAtMs = driverDoc?.createdAt?.toMillis?.()
  const isVerified = driverDoc?.verificado === true
  const paymentBlocked = driverDoc?.bloqueadoPorPago === true
  const timeRemainingMs =
    typeof createdAtMs === 'number'
      ? gracePeriodMs - (Date.now() - createdAtMs)
      : gracePeriodMs
  const daysRemaining = Math.max(0, Math.ceil(timeRemainingMs / (24 * 60 * 60 * 1000)))
  const isBlocked = !isVerified && timeRemainingMs <= 0

  const driverRef = useMemo(() => {
    return user ? doc(db, 'drivers', user.uid) : null
  }, [user])

  useEffect(() => {
    if (!driverRef) return
    const unsubscribe = onSnapshot(driverRef, (snapshot) => {
      setDriverDoc(snapshot.exists() ? snapshot.data() : null)
    })
    return () => unsubscribe()
  }, [driverRef])

  useEffect(() => {
    if (!user) return
    registerFcmToken({ user, collectionName: 'drivers' })
      .then((token) => setNotificationsEnabled(Boolean(token)))
      .catch(() => setNotificationsEnabled(false))
  }, [user])

  useEffect(() => {
    if (!driverDoc?.nombre) return
    setProfileName(driverDoc.nombre)
  }, [driverDoc?.nombre])

  useEffect(() => {
    if (!driverDoc) return
    setFullName(driverDoc.nombreCompleto || '')
    setPhotoUrl(driverDoc.fotoUrl || '')
    setIneUrl(driverDoc.ineUrl || '')
    setLicenseUrl(driverDoc.licenciaUrl || '')
    setCarPhotoUrl(driverDoc.autoFotoUrl || '')
    setPlateNumber(driverDoc.placas || '')
  }, [driverDoc])

  useEffect(() => {
    if (driverDoc?.radioKm) {
      setRadiusKm(driverDoc.radioKm)
    }
  }, [driverDoc?.radioKm])

  useEffect(() => {
    if (!driverDoc?.pagos) return
    setCashEnabled(driverDoc.pagos.efectivo ?? true)
    setTransferEnabled(driverDoc.pagos.transferencia ?? false)
    setTransferInfo(driverDoc.pagos.transferenciaInfo ?? '')
  }, [driverDoc?.pagos])

  useEffect(() => {
    if (!driverRef || !driverDoc) return
    if ((!isVerified && isBlocked && driverDoc.disponible) || paymentBlocked) {
      updateDoc(driverRef, {
        disponible: false,
        ultimoActivo: serverTimestamp(),
      })
    }
  }, [driverRef, driverDoc, isVerified, isBlocked, paymentBlocked])

  useEffect(() => {
    localStorage.setItem('driverRadiusKm', String(radiusKm))
  }, [radiusKm])

  useEffect(() => {
    if (!driverDoc?.disponible) {
      setPendingRides([])
      return
    }

    const ridesQuery = query(
      collection(db, 'rides'),
      where('estado', '==', 'pendiente'),
    )
    const unsubscribe = onSnapshot(ridesQuery, (snapshot) => {
      const rides = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      setPendingRides(rides)
    })

    return () => unsubscribe()
  }, [driverDoc?.disponible])

  useEffect(() => {
    const unsubscribe = listenForegroundMessages()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setActiveRide(null)
      setScheduledRides([])
      return
    }

    const ridesQuery = query(
      collection(db, 'rides'),
      where('driverUid', '==', user.uid),
      where('estado', 'in', ['aceptado', 'en curso']),
      limit(10),
    )

    const unsubscribe = onSnapshot(ridesQuery, (snapshot) => {
      const rides = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))

      const now = new Date()
      const dueRide = rides.find((ride) => {
        if (!ride.scheduledAt) return true
        return ride.scheduledAt.toDate() <= now
      })

      const scheduled = rides.filter((ride) => {
        if (!ride.scheduledAt) return false
        return ride.scheduledAt.toDate() > now
      })

      if (dueRide) {
        setActiveRide(dueRide)
        setActiveRideId(dueRide.id)
      } else {
        setActiveRide(null)
        setActiveRideId(null)
      }

      setScheduledRides(scheduled)
    })

    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (!activeRideId) return
    const rideRef = doc(db, 'rides', activeRideId)
    const unsubscribe = onSnapshot(rideRef, (snapshot) => {
      if (!snapshot.exists()) return
      const data = snapshot.data()
      if (data.estado === 'cancelado') {
        setCanceledRideId(activeRideId)
        setActiveRide(null)
        setActiveRideId(null)
        if (driverRef) {
          updateDoc(driverRef, {
            disponible: true,
            ultimoActivo: serverTimestamp(),
          })
        }
      }
    })

    return () => unsubscribe()
  }, [activeRideId])

  useEffect(() => {
    if (!driverRef || !driverDoc) return
    const shouldTrack = driverDoc.disponible || !!activeRideId
    if (!shouldTrack) return

    let intervalId = null

    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLocationError('')
          const location = new GeoPoint(
            position.coords.latitude,
            position.coords.longitude,
          )
          await updateDoc(driverRef, {
            ubicacion: location,
            ultimoActivo: serverTimestamp(),
          })
        },
        () => {
          setLocationError('No se pudo acceder a la ubicacion.')
        },
        { enableHighAccuracy: true, timeout: 10000 },
      )
    }

    updateLocation()
    intervalId = setInterval(updateLocation, 12000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [driverRef, driverDoc, activeRideId])

  const saveProfile = async () => {
    if (!driverRef || !user) return
    setSavingProfile(true)
    await setDoc(
      driverRef,
      {
        nombre: profileName.trim(),
        nombreCompleto: fullName.trim(),
        fotoUrl: photoUrl || null,
        ineUrl: ineUrl || null,
        licenciaUrl: licenseUrl || null,
        autoFotoUrl: carPhotoUrl || null,
        placas: plateNumber.trim(),
        telefono: user.phoneNumber || '',
        disponible: false,
        ubicacion: null,
        radioKm: radiusKm,
        createdAt: driverDoc?.createdAt || serverTimestamp(),
        pagos: {
          efectivo: cashEnabled,
          transferencia: transferEnabled,
          transferenciaInfo: transferInfo.trim(),
          moneda: 'MXN',
        },
        ultimoActivo: serverTimestamp(),
      },
      { merge: true },
    )
    setSavingProfile(false)
  }

  const toggleAvailability = async () => {
    if (!driverRef || !driverDoc) return
    if (isBlocked) {
      setVerificationError(
        'Tu cuenta esta bloqueada. Completa la verificacion para recibir viajes.',
      )
      return
    }
    if (paymentBlocked) {
      setVerificationError(
        'Tu cuenta esta bloqueada por pago pendiente. Realiza el pago semanal.',
      )
      return
    }
    await updateDoc(driverRef, {
      disponible: !driverDoc.disponible,
      radioKm: radiusKm,
      ultimoActivo: serverTimestamp(),
    })
  }

  const acceptRide = async (rideId) => {
    if (!driverRef || !user) return
    if (isBlocked) {
      setVerificationError(
        'Tu cuenta esta bloqueada. Completa la verificacion para aceptar viajes.',
      )
      return
    }
    if (paymentBlocked) {
      setVerificationError(
        'Tu cuenta esta bloqueada por pago pendiente. Realiza el pago semanal.',
      )
      return
    }
    await updateDoc(doc(db, 'rides', rideId), {
      driverUid: user.uid,
      estado: 'aceptado',
    })
    await updateDoc(driverRef, {
      disponible: false,
      radioKm: radiusKm,
      ultimoActivo: serverTimestamp(),
    })
    setActiveRideId(rideId)
  }

  const updateRideStatus = async (rideId, status) => {
    if (!rideId) return
    if (status === 'finalizado') {
      const amount = Number.parseFloat(fareAmount)
      if (!Number.isFinite(amount) || amount <= 0) {
        setFareError('Ingresa el monto final del viaje.')
        return
      }
      setFareError('')
      await updateDoc(doc(db, 'rides', rideId), {
        estado: status,
        montoFinal: amount,
        moneda: 'MXN',
        finalizadoAt: serverTimestamp(),
      })
      setFareAmount('')
      return
    }
    if (status === 'en curso') {
      await updateDoc(doc(db, 'rides', rideId), {
        estado: status,
        iniciadoAt: serverTimestamp(),
      })
      return
    }
    await updateDoc(doc(db, 'rides', rideId), { estado: status })
  }

  const savePayments = async () => {
    if (!driverRef) return
    setSavingPayments(true)
    await updateDoc(driverRef, {
      pagos: {
        efectivo: cashEnabled,
        transferencia: transferEnabled,
        transferenciaInfo: transferInfo.trim(),
        moneda: 'MXN',
      },
      ultimoActivo: serverTimestamp(),
    })
    setSavingPayments(false)
  }

  const handleUpload = async (file, path, onSuccess) => {
    if (!file || !user) return
    setUploading(true)
    setUploadError('')
    try {
      const url = await uploadFile({ file, path })
      onSuccess(url)
    } catch {
      setUploadError('No se pudo subir el archivo. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const haversineKm = (pointA, pointB) => {
    const toRad = (value) => (value * Math.PI) / 180
    const lat1 = pointA.latitude
    const lon1 = pointA.longitude
    const lat2 = pointB.latitude
    const lon2 = pointB.longitude
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return 6371 * c
  }

  const filteredPendingRides = pendingRides.filter((ride) => {
    if (!driverDoc?.ubicacion || !ride.origen) return true
    return haversineKm(driverDoc.ubicacion, ride.origen) <= radiusKm
  })

  useEffect(() => {
    if (!driverDoc?.disponible) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (!notificationsEnabled) return
    if (filteredPendingRides.length === 0) return

    const newestRide = filteredPendingRides[0]
    if (!newestRide?.id) return
    const key = `driver_last_ride_${user?.uid || 'anon'}`
    const lastId = localStorage.getItem(key)
    if (lastId === newestRide.id) return
    localStorage.setItem(key, newestRide.id)
    new Notification('Nuevo viaje disponible', {
      body: 'Tienes una solicitud pendiente.',
    })
  }, [filteredPendingRides, driverDoc?.disponible, notificationsEnabled, user])

  if (initializing) {
    return <p className="muted">Cargando sesion...</p>
  }

  return (
    <div className="grid">
      {!user && <PhoneAuth recaptchaId="recaptcha-driver" />}

      {user && (
        <section className="card">
          <h2 className="section-title">Panel de taxista</h2>
          <p className="muted">Sesion activa: {user.phoneNumber}</p>
          <button className="button outline" onClick={signOut}>
            Cerrar sesion
          </button>
        </section>
      )}

      {user && !driverDoc && (
        <section className="card">
          <h3 className="section-title">Completa tu perfil</h3>
          <div className="field">
            <label htmlFor="driver-name">Nombre</label>
            <input
              id="driver-name"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="driver-fullname">Nombre completo</label>
            <input
              id="driver-fullname"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
          <p className="muted">
            Sube tus documentos. Esto se usara para validar tu identidad.
          </p>
          <div className="field">
            <label htmlFor="driver-photo">Foto de perfil</label>
            <input
              id="driver-photo"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  handleUpload(file, `drivers/${user.uid}/foto.jpg`, setPhotoUrl)
                }
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="driver-ine">INE (foto)</label>
            <input
              id="driver-ine"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  handleUpload(file, `drivers/${user.uid}/ine.jpg`, setIneUrl)
                }
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="driver-license">Licencia de manejo (foto)</label>
            <input
              id="driver-license"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  handleUpload(file, `drivers/${user.uid}/licencia.jpg`, setLicenseUrl)
                }
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="driver-car">Foto del auto</label>
            <input
              id="driver-car"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  handleUpload(file, `drivers/${user.uid}/auto.jpg`, setCarPhotoUrl)
                }
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="driver-plates">Placas</label>
            <input
              id="driver-plates"
              value={plateNumber}
              onChange={(event) => setPlateNumber(event.target.value)}
            />
          </div>
          {uploadError && <p className="muted">{uploadError}</p>}
          {uploading && <p className="muted">Subiendo archivos...</p>}
          <p className="muted">
            Cobro en MXN. Elige si aceptas efectivo y/o transferencia bancaria.
          </p>
          <div className="field">
            <label htmlFor="cash-enabled">
              <input
                id="cash-enabled"
                type="checkbox"
                checked={cashEnabled}
                onChange={(event) => setCashEnabled(event.target.checked)}
              />{' '}
              Acepto efectivo
            </label>
          </div>
          <div className="field">
            <label htmlFor="transfer-enabled">
              <input
                id="transfer-enabled"
                type="checkbox"
                checked={transferEnabled}
                onChange={(event) => setTransferEnabled(event.target.checked)}
              />{' '}
              Acepto transferencia
            </label>
          </div>
          {transferEnabled && (
            <div className="field">
              <label htmlFor="transfer-info">Datos para transferencia</label>
              <input
                id="transfer-info"
                placeholder="CLABE / Banco / Titular"
                value={transferInfo}
                onChange={(event) => setTransferInfo(event.target.value)}
              />
            </div>
          )}
          <button
            className="button"
            onClick={saveProfile}
            disabled={!profileName.trim() || !fullName.trim() || savingProfile}
          >
            Guardar perfil
          </button>
        </section>
      )}

      {user && driverDoc && (
        <section className="card">
          <h3 className="section-title">Formas de pago</h3>
          <p className="muted">
            Cobras en pesos mexicanos. Indica como prefieres cobrar.
          </p>
          <div className="field">
            <label htmlFor="cash-enabled-existing">
              <input
                id="cash-enabled-existing"
                type="checkbox"
                checked={cashEnabled}
                onChange={(event) => setCashEnabled(event.target.checked)}
              />{' '}
              Acepto efectivo
            </label>
          </div>
          <div className="field">
            <label htmlFor="transfer-enabled-existing">
              <input
                id="transfer-enabled-existing"
                type="checkbox"
                checked={transferEnabled}
                onChange={(event) => setTransferEnabled(event.target.checked)}
              />{' '}
              Acepto transferencia
            </label>
          </div>
          {transferEnabled && (
            <div className="field">
              <label htmlFor="transfer-info-existing">Datos para transferencia</label>
              <input
                id="transfer-info-existing"
                placeholder="CLABE / Banco / Titular"
                value={transferInfo}
                onChange={(event) => setTransferInfo(event.target.value)}
              />
            </div>
          )}
          <button className="button" onClick={savePayments} disabled={savingPayments}>
            Guardar formas de pago
          </button>
        </section>
      )}

      {user && driverDoc && (
        <section className="card">
          <h3 className="section-title">Documentos y vehiculo</h3>
          <p className="muted">Actualiza tu informacion cuando sea necesario.</p>
          <div className="field">
            <label htmlFor="driver-fullname-edit">Nombre completo</label>
            <input
              id="driver-fullname-edit"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="driver-photo-edit">Foto de perfil</label>
            <input
              id="driver-photo-edit"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  handleUpload(file, `drivers/${user.uid}/foto.jpg`, setPhotoUrl)
                }
              }}
            />
            {photoUrl && <p className="muted">Foto guardada.</p>}
          </div>
          <div className="field">
            <label htmlFor="driver-ine-edit">INE (foto)</label>
            <input
              id="driver-ine-edit"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  handleUpload(file, `drivers/${user.uid}/ine.jpg`, setIneUrl)
                }
              }}
            />
            {ineUrl && <p className="muted">INE guardada.</p>}
          </div>
          <div className="field">
            <label htmlFor="driver-license-edit">Licencia de manejo (foto)</label>
            <input
              id="driver-license-edit"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  handleUpload(file, `drivers/${user.uid}/licencia.jpg`, setLicenseUrl)
                }
              }}
            />
            {licenseUrl && <p className="muted">Licencia guardada.</p>}
          </div>
          <div className="field">
            <label htmlFor="driver-car-edit">Foto del auto</label>
            <input
              id="driver-car-edit"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  handleUpload(file, `drivers/${user.uid}/auto.jpg`, setCarPhotoUrl)
                }
              }}
            />
            {carPhotoUrl && <p className="muted">Foto del auto guardada.</p>}
          </div>
          <div className="field">
            <label htmlFor="driver-plates-edit">Placas</label>
            <input
              id="driver-plates-edit"
              value={plateNumber}
              onChange={(event) => setPlateNumber(event.target.value)}
            />
          </div>
          {uploadError && <p className="muted">{uploadError}</p>}
          {uploading && <p className="muted">Subiendo archivos...</p>}
          <button
            className="button"
            onClick={saveProfile}
            disabled={!profileName.trim() || !fullName.trim() || savingProfile}
          >
            Guardar datos
          </button>
        </section>
      )}

      {user && driverDoc && (
        <section className="card">
          <h3 className="section-title">Disponibilidad</h3>
          {!isVerified && (
            <p className="muted">
              Te quedan {daysRemaining} dias para completar tu verificacion.
              Despues se bloquearan los viajes.
            </p>
          )}
          {paymentBlocked && (
            <p className="muted">
              Pago semanal pendiente. No puedes recibir viajes hasta completar el
              pago.
            </p>
          )}
          {driverDoc?.weeklyFee != null && (
            <p className="muted">
              Deuda semanal: ${driverDoc.weeklyFee.toFixed(2)} MXN (generado $
              {driverDoc.weeklyTotal?.toFixed(2) || '0.00'} MXN).
            </p>
          )}
          {verificationError && <p className="muted">{verificationError}</p>}
          <p className="muted">
            Estado actual:{' '}
            <span
              className={`status-pill ${
                driverDoc.disponible ? 'accepted' : 'pending'
              }`}
            >
              {driverDoc.disponible ? 'Disponible' : 'Ocupado'}
            </span>
          </p>
          <button className="button" onClick={toggleAvailability}>
            {driverDoc.disponible ? 'Marcar ocupado' : 'Marcar disponible'}
          </button>
          {locationError && <p className="muted">{locationError}</p>}
          <div className="field" style={{ marginTop: '1rem' }}>
            <label htmlFor="radius-km">Radio de busqueda (km)</label>
            <input
              id="radius-km"
              type="number"
              min="1"
              max="50"
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
              onBlur={() => {
                if (driverRef) {
                  updateDoc(driverRef, {
                    radioKm: radiusKm,
                    ultimoActivo: serverTimestamp(),
                  })
                }
              }}
            />
          </div>
        </section>
      )}

      {user && driverDoc?.ubicacion && (
        <section className="card">
          <h3 className="section-title">Tu ubicacion</h3>
          <MapView
            driverLocation={driverDoc.ubicacion}
            origin={activeRide?.origen || null}
            destination={activeRide?.destino || null}
          />
          {activeRide?.origen && (
            <p className="muted" style={{ marginTop: '0.8rem' }}>
              Origen del pasajero: {activeRide.origen.latitude.toFixed(5)},{' '}
              {activeRide.origen.longitude.toFixed(5)}
            </p>
          )}
          {activeRide?.destino && (
            <p className="muted" style={{ marginTop: '0.4rem' }}>
              Destino: {activeRide.destino.latitude.toFixed(5)},{' '}
              {activeRide.destino.longitude.toFixed(5)}
            </p>
          )}
          {activeRide?.destinoTexto && (
            <p className="muted" style={{ marginTop: '0.4rem' }}>
              Destino (texto): {activeRide.destinoTexto}
            </p>
          )}
        </section>
      )}

      {user && scheduledRides.length > 0 && (
        <section className="card">
          <h3 className="section-title">Viajes agendados</h3>
          <div className="list">
            {scheduledRides.map((ride) => (
              <div className="list-item" key={ride.id}>
                <p className="muted">Solicitud: {ride.id}</p>
                {ride.scheduledAt && (
                  <p className="muted">
                    Fecha: {ride.scheduledAt.toDate().toLocaleString('es-MX')}
                  </p>
                )}
                {ride.destinoTexto && (
                  <p className="muted">Destino: {ride.destinoTexto}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {user && driverDoc?.disponible && (
        <section className="card">
          <h3 className="section-title">Solicitudes pendientes</h3>
          {filteredPendingRides.length === 0 && (
            <p className="muted">No hay viajes nuevos.</p>
          )}
          <div className="list">
            {filteredPendingRides.map((ride) => (
              <div className="list-item" key={ride.id}>
                <p className="muted">Solicitud: {ride.id}</p>
                {ride.scheduledAt && (
                  <p className="muted">
                    Programado para:{' '}
                    {ride.scheduledAt.toDate().toLocaleString('es-MX')}
                  </p>
                )}
                {ride.destinoTexto && (
                  <p className="muted">Destino: {ride.destinoTexto}</p>
                )}
                <button className="button secondary" onClick={() => acceptRide(ride.id)}>
                  Aceptar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {user && canceledRideId && (
        <section className="card">
          <h3 className="section-title">Viaje cancelado</h3>
          <p className="muted">La solicitud {canceledRideId} fue cancelada.</p>
          <button className="button outline" onClick={() => setCanceledRideId('')}>
            Entendido
          </button>
        </section>
      )}

      {user && activeRideId && (
        <section className="card">
          <h3 className="section-title">Viaje en curso</h3>
          <p className="muted">ID del viaje: {activeRideId}</p>
          <div className="field">
            <label htmlFor="fare-amount">Monto final (MXN)</label>
            <input
              id="fare-amount"
              type="number"
              min="1"
              value={fareAmount}
              onChange={(event) => setFareAmount(event.target.value)}
            />
          </div>
          {fareError && <p className="muted">{fareError}</p>}
          <div className="cta-row">
            <button
              className="button secondary"
              onClick={() => updateRideStatus(activeRideId, 'en curso')}
            >
              Iniciar viaje
            </button>
            <button
              className="button outline"
              onClick={() => updateRideStatus(activeRideId, 'finalizado')}
            >
              Finalizar viaje
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

export default Driver
