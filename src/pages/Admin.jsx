import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { useAdmin } from '../hooks/useAdmin'
import PhoneAuth from '../components/PhoneAuth'

const DEFAULT_TARIFFS = {
  baseFare: 0,
  perKm: 0,
  perMin: 0,
  minFare: 0,
  nightMultiplier: 1,
  nightStart: '22:00',
  nightEnd: '06:00',
  serviceFee: 0,
  cancelAfterMin: 5,
  cancelFee: 0,
}

const DEFAULT_BILLING = {
  weeklyPercent: 10,
  periodType: 'mon_sun',
  fareMode: 'manual',
  paymentMode: 'manual',
}

function Admin() {
  const { user, initializing, signOut } = useAuth()
  const { isAdmin, checking } = useAdmin(user)
  const [tariffs, setTariffs] = useState(DEFAULT_TARIFFS)
  const [savingTariffs, setSavingTariffs] = useState(false)
  const [billing, setBilling] = useState(DEFAULT_BILLING)
  const [savingBilling, setSavingBilling] = useState(false)
  const [zones, setZones] = useState([])
  const [selectedZoneId, setSelectedZoneId] = useState('')
  const [zoneForm, setZoneForm] = useState({ name: '', ...DEFAULT_TARIFFS })
  const [savingZone, setSavingZone] = useState(false)
  const [drivers, setDrivers] = useState([])
  const [savingVerification, setSavingVerification] = useState('')

  useEffect(() => {
    if (!user || !isAdmin) return
    const tariffsRef = doc(db, 'settings', 'tariffs')
    const unsubscribe = onSnapshot(tariffsRef, (snapshot) => {
      if (snapshot.exists()) {
        setTariffs({ ...DEFAULT_TARIFFS, ...snapshot.data() })
      }
    })
    return () => unsubscribe()
  }, [user, isAdmin])

  useEffect(() => {
    if (!user || !isAdmin) return
    const billingRef = doc(db, 'settings', 'billing')
    const unsubscribe = onSnapshot(billingRef, (snapshot) => {
      if (snapshot.exists()) {
        setBilling({ ...DEFAULT_BILLING, ...snapshot.data() })
      }
    })
    return () => unsubscribe()
  }, [user, isAdmin])

  useEffect(() => {
    if (!user || !isAdmin) return
    const zonesRef = collection(db, 'zones')
    const unsubscribe = onSnapshot(zonesRef, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      setZones(data)
    })
    return () => unsubscribe()
  }, [user, isAdmin])

  useEffect(() => {
    if (!user || !isAdmin) return
    const driversRef = collection(db, 'drivers')
    const unsubscribe = onSnapshot(driversRef, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      setDrivers(data)
    })
    return () => unsubscribe()
  }, [user, isAdmin])

  const selectZone = (zoneId) => {
    setSelectedZoneId(zoneId)
    if (!zoneId) {
      setZoneForm({ name: '', ...DEFAULT_TARIFFS })
      return
    }
    const zone = zones.find((item) => item.id === zoneId)
    if (zone) {
      setZoneForm({ name: zone.name || '', ...DEFAULT_TARIFFS, ...zone.tariffs })
    }
  }

  const updateTariffValue = (field, value) => {
    setTariffs((prev) => ({ ...prev, [field]: value }))
  }

  const updateBillingValue = (field, value) => {
    setBilling((prev) => ({ ...prev, [field]: value }))
  }

  const updateZoneValue = (field, value) => {
    setZoneForm((prev) => ({ ...prev, [field]: value }))
  }

  const saveTariffs = async () => {
    setSavingTariffs(true)
    await setDoc(
      doc(db, 'settings', 'tariffs'),
      {
        ...tariffs,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
    setSavingTariffs(false)
  }

  const saveBilling = async () => {
    setSavingBilling(true)
    await setDoc(
      doc(db, 'settings', 'billing'),
      {
        ...billing,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
    setSavingBilling(false)
  }

  const createZone = async () => {
    if (!zoneForm.name.trim()) return
    setSavingZone(true)
    const newZoneRef = doc(collection(db, 'zones'))
    await setDoc(newZoneRef, {
      name: zoneForm.name.trim(),
      tariffs: { ...zoneForm },
      updatedAt: serverTimestamp(),
    })
    setSelectedZoneId(newZoneRef.id)
    setSavingZone(false)
  }

  const updateZone = async () => {
    if (!selectedZoneId) return
    setSavingZone(true)
    await updateDoc(doc(db, 'zones', selectedZoneId), {
      name: zoneForm.name.trim(),
      tariffs: { ...zoneForm },
      updatedAt: serverTimestamp(),
    })
    setSavingZone(false)
  }

  const setDriverVerification = async (driverId, status) => {
    setSavingVerification(driverId)
    await updateDoc(doc(db, 'drivers', driverId), {
      verificado: status,
      verificadoAt: serverTimestamp(),
      verificadoBy: user.uid,
    })
    setSavingVerification('')
  }

  const markDriverPaid = async (driverId) => {
    setSavingVerification(driverId)
    await updateDoc(doc(db, 'drivers', driverId), {
      bloqueadoPorPago: false,
      paymentStatus: 'pagado',
      pagoAt: serverTimestamp(),
    })
    setSavingVerification('')
  }

  const zoneOptions = useMemo(() => {
    return zones.map((zone) => (
      <option key={zone.id} value={zone.id}>
        {zone.name || zone.id}
      </option>
    ))
  }, [zones])

  if (initializing || checking) {
    return <p className="muted">Cargando panel...</p>
  }

  if (!user) {
    return <PhoneAuth recaptchaId="recaptcha-admin" />
  }

  if (!isAdmin) {
    return (
      <section className="card">
        <h2 className="section-title">Panel admin</h2>
        <p className="muted">
          Tu usuario no tiene permisos de administrador. Configura el claim
          `admin: true` en Firebase Auth.
        </p>
      </section>
    )
  }

  return (
    <div className="grid">
      <section className="card">
        <h2 className="section-title">Panel administrador</h2>
        <p className="muted">Sesion activa: {user.phoneNumber}</p>
        <button className="button outline" onClick={signOut}>
          Cerrar sesion
        </button>
      </section>

      <section className="card">
        <h3 className="section-title">Tarifas globales</h3>
        <div className="field">
          <label>Tarifa base (MXN)</label>
          <input
            type="number"
            value={tariffs.baseFare}
            onChange={(event) => updateTariffValue('baseFare', Number(event.target.value))}
          />
        </div>
        <div className="field">
          <label>Por km (MXN)</label>
          <input
            type="number"
            value={tariffs.perKm}
            onChange={(event) => updateTariffValue('perKm', Number(event.target.value))}
          />
        </div>
        <div className="field">
          <label>Por minuto (MXN)</label>
          <input
            type="number"
            value={tariffs.perMin}
            onChange={(event) => updateTariffValue('perMin', Number(event.target.value))}
          />
        </div>
        <div className="field">
          <label>Tarifa minima (MXN)</label>
          <input
            type="number"
            value={tariffs.minFare}
            onChange={(event) => updateTariffValue('minFare', Number(event.target.value))}
          />
        </div>
        <div className="field">
          <label>Multiplicador nocturno</label>
          <input
            type="number"
            value={tariffs.nightMultiplier}
            onChange={(event) =>
              updateTariffValue('nightMultiplier', Number(event.target.value))
            }
          />
        </div>
        <div className="field">
          <label>Inicio noche (HH:mm)</label>
          <input
            type="time"
            value={tariffs.nightStart}
            onChange={(event) => updateTariffValue('nightStart', event.target.value)}
          />
        </div>
        <div className="field">
          <label>Fin noche (HH:mm)</label>
          <input
            type="time"
            value={tariffs.nightEnd}
            onChange={(event) => updateTariffValue('nightEnd', event.target.value)}
          />
        </div>
        <div className="field">
          <label>Cargo por servicio (MXN)</label>
          <input
            type="number"
            value={tariffs.serviceFee}
            onChange={(event) => updateTariffValue('serviceFee', Number(event.target.value))}
          />
        </div>
        <div className="field">
          <label>Minutos para cobrar cancelacion</label>
          <input
            type="number"
            value={tariffs.cancelAfterMin}
            onChange={(event) =>
              updateTariffValue('cancelAfterMin', Number(event.target.value))
            }
          />
        </div>
        <div className="field">
          <label>Cargo por cancelacion (MXN)</label>
          <input
            type="number"
            value={tariffs.cancelFee}
            onChange={(event) => updateTariffValue('cancelFee', Number(event.target.value))}
          />
        </div>
        <button className="button" onClick={saveTariffs} disabled={savingTariffs}>
          Guardar tarifas
        </button>
      </section>

      <section className="card">
        <h3 className="section-title">Cobro semanal</h3>
        <div className="field">
          <label>Porcentaje semanal (%)</label>
          <input
            type="number"
            value={billing.weeklyPercent}
            onChange={(event) =>
              updateBillingValue('weeklyPercent', Number(event.target.value))
            }
          />
        </div>
        <div className="field">
          <label>Periodo</label>
          <select
            value={billing.periodType}
            onChange={(event) => updateBillingValue('periodType', event.target.value)}
          >
            <option value="mon_sun">Lunes a domingo</option>
          </select>
        </div>
        <div className="field">
          <label>Forma de tarifa por viaje</label>
          <select
            value={billing.fareMode}
            onChange={(event) => updateBillingValue('fareMode', event.target.value)}
          >
            <option value="manual">Taxista captura monto final</option>
            <option value="auto">Automatica con tarifas configuradas</option>
          </select>
        </div>
        <div className="field">
          <label>Modo de pago</label>
          <select
            value={billing.paymentMode}
            onChange={(event) => updateBillingValue('paymentMode', event.target.value)}
          >
            <option value="manual">Manual (transferencia/efectivo)</option>
            <option value="automatic">Automatico (requiere pasarela)</option>
          </select>
        </div>
        <button className="button" onClick={saveBilling} disabled={savingBilling}>
          Guardar cobro
        </button>
      </section>

      <section className="card">
        <h3 className="section-title">Zonas y tarifas</h3>
        <div className="field">
          <label>Zona</label>
          <select value={selectedZoneId} onChange={(event) => selectZone(event.target.value)}>
            <option value="">Nueva zona</option>
            {zoneOptions}
          </select>
        </div>
        <div className="field">
          <label>Nombre de zona</label>
          <input
            value={zoneForm.name}
            onChange={(event) => updateZoneValue('name', event.target.value)}
          />
        </div>
        <div className="field">
          <label>Tarifa base (MXN)</label>
          <input
            type="number"
            value={zoneForm.baseFare}
            onChange={(event) => updateZoneValue('baseFare', Number(event.target.value))}
          />
        </div>
        <div className="field">
          <label>Por km (MXN)</label>
          <input
            type="number"
            value={zoneForm.perKm}
            onChange={(event) => updateZoneValue('perKm', Number(event.target.value))}
          />
        </div>
        <div className="field">
          <label>Por minuto (MXN)</label>
          <input
            type="number"
            value={zoneForm.perMin}
            onChange={(event) => updateZoneValue('perMin', Number(event.target.value))}
          />
        </div>
        <div className="field">
          <label>Tarifa minima (MXN)</label>
          <input
            type="number"
            value={zoneForm.minFare}
            onChange={(event) => updateZoneValue('minFare', Number(event.target.value))}
          />
        </div>
        <div className="field">
          <label>Multiplicador nocturno</label>
          <input
            type="number"
            value={zoneForm.nightMultiplier}
            onChange={(event) =>
              updateZoneValue('nightMultiplier', Number(event.target.value))
            }
          />
        </div>
        <div className="field">
          <label>Inicio noche (HH:mm)</label>
          <input
            type="time"
            value={zoneForm.nightStart}
            onChange={(event) => updateZoneValue('nightStart', event.target.value)}
          />
        </div>
        <div className="field">
          <label>Fin noche (HH:mm)</label>
          <input
            type="time"
            value={zoneForm.nightEnd}
            onChange={(event) => updateZoneValue('nightEnd', event.target.value)}
          />
        </div>
        <div className="field">
          <label>Cargo por servicio (MXN)</label>
          <input
            type="number"
            value={zoneForm.serviceFee}
            onChange={(event) => updateZoneValue('serviceFee', Number(event.target.value))}
          />
        </div>
        <div className="field">
          <label>Minutos para cobrar cancelacion</label>
          <input
            type="number"
            value={zoneForm.cancelAfterMin}
            onChange={(event) =>
              updateZoneValue('cancelAfterMin', Number(event.target.value))
            }
          />
        </div>
        <div className="field">
          <label>Cargo por cancelacion (MXN)</label>
          <input
            type="number"
            value={zoneForm.cancelFee}
            onChange={(event) => updateZoneValue('cancelFee', Number(event.target.value))}
          />
        </div>
        <div className="cta-row">
          <button className="button" onClick={createZone} disabled={savingZone}>
            Crear zona
          </button>
          <button
            className="button outline"
            onClick={updateZone}
            disabled={savingZone || !selectedZoneId}
          >
            Guardar zona
          </button>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Validacion de taxistas</h3>
        {drivers.length === 0 && (
          <p className="muted">No hay taxistas registrados.</p>
        )}
        <div className="list">
          {drivers.map((driver) => (
            <div className="list-item" key={driver.id}>
              <p className="muted">
                {driver.nombreCompleto || driver.nombre || 'Taxista'} ({driver.telefono || driver.id})
              </p>
              <p className="muted">
                Estado:{' '}
                <span
                  className={`status-pill ${
                    driver.verificado ? 'accepted' : 'pending'
                  }`}
                >
                  {driver.verificado ? 'Verificado' : 'Pendiente'}
                </span>
              </p>
              {driver.weeklyFee != null && (
                <p className="muted">
                  Deuda semanal: ${driver.weeklyFee.toFixed(2)} MXN
                </p>
              )}
              {driver.fotoUrl && (
                <p className="muted">
                  Foto: <a href={driver.fotoUrl} target="_blank" rel="noreferrer">ver</a>
                </p>
              )}
              {driver.ineUrl && (
                <p className="muted">
                  INE: <a href={driver.ineUrl} target="_blank" rel="noreferrer">ver</a>
                </p>
              )}
              {driver.licenciaUrl && (
                <p className="muted">
                  Licencia: <a href={driver.licenciaUrl} target="_blank" rel="noreferrer">ver</a>
                </p>
              )}
              {driver.autoFotoUrl && (
                <p className="muted">
                  Auto: <a href={driver.autoFotoUrl} target="_blank" rel="noreferrer">ver</a>
                </p>
              )}
              {driver.placas && <p className="muted">Placas: {driver.placas}</p>}
              <div className="cta-row">
                <button
                  className="button"
                  onClick={() => setDriverVerification(driver.id, true)}
                  disabled={savingVerification === driver.id}
                >
                  Aprobar
                </button>
                <button
                  className="button outline"
                  onClick={() => setDriverVerification(driver.id, false)}
                  disabled={savingVerification === driver.id}
                >
                  Rechazar
                </button>
                <button
                  className="button secondary"
                  onClick={() => markDriverPaid(driver.id)}
                  disabled={savingVerification === driver.id}
                >
                  Marcar pago
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Admin
