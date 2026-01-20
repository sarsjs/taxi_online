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
  increment,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { useAdmin } from '../hooks/useAdmin'

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
  const [paymentDriverId, setPaymentDriverId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMessage, setPaymentMessage] = useState('')

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

  const applyDriverPayment = async () => {
    setPaymentMessage('')
    const amount = Number.parseFloat(paymentAmount)
    if (!paymentDriverId || !Number.isFinite(amount) || amount <= 0) {
      setPaymentMessage('Ingresa un ID de taxista y un monto válido.')
      return
    }
    try {
      await updateDoc(doc(db, 'drivers', paymentDriverId), {
        saldoPendiente: increment(-amount),
        ultimoAbonoAt: serverTimestamp(),
        ultimoAbonoMonto: amount,
      })
      setPaymentMessage('Abono registrado correctamente.')
      setPaymentAmount('')
    } catch (error) {
      console.error('Error registrando abono:', error)
      setPaymentMessage('No se pudo registrar el abono.')
    }
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
    return (
      <section className="card">
        <h2 className="section-title">Panel admin</h2>
        <p className="muted">
          Acceso exclusivo. Ingresa desde la ruta privada de administración.
        </p>
      </section>
    )
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

              {/* Información de pagos y bloqueos */}
              {driver.weeklyFee != null && (
                <p className="muted">
                  Deuda semanal: ${driver.weeklyFee.toFixed(2)} MXN
                </p>
              )}

              {driver.bloqueadoPorPago && (
                <p className="muted" style={{color: 'red', fontWeight: 'bold'}}>
                  ⚠️ CONDUCTOR BLOQUEADO POR PAGO PENDIENTE
                </p>
              )}

              {driver.paymentStatus && (
                <p className="muted">
                  Estado de pago: <span style={{fontWeight: 'bold'}}>{driver.paymentStatus}</span>
                </p>
              )}

              {driver.pagoAt && (
                <p className="muted">
                  Último pago: {driver.pagoAt.toDate().toLocaleDateString('es-MX')}
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

      <section className="card">
        <h3 className="section-title">Abonos de comisiones</h3>
        <div className="field">
          <label htmlFor="payment-driver">Taxista</label>
          <select
            id="payment-driver"
            value={paymentDriverId}
            onChange={(event) => setPaymentDriverId(event.target.value)}
          >
            <option value="">Selecciona un taxista</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.nombreCompleto || driver.nombre || driver.id}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="payment-amount">Monto pagado (MXN)</label>
          <input
            id="payment-amount"
            type="number"
            min="0"
            step="0.01"
            value={paymentAmount}
            onChange={(event) => setPaymentAmount(event.target.value)}
            placeholder="Ej: 150.00"
          />
        </div>
        {paymentMessage && <p className="muted">{paymentMessage}</p>}
        <button className="button" onClick={applyDriverPayment}>
          Registrar abono
        </button>
      </section>

      <section className="card">
        <h3 className="section-title">Gestión de Rutas</h3>
        <RutaManager />
      </section>

      <section className="card">
        <h3 className="section-title">Gestión de Puntos de Referencia</h3>
        <LandmarkManager />
      </section>

      <section className="card">
        <h3 className="section-title">Reporte Semanal de Ingresos</h3>
        <WeeklyIncomeReport />
      </section>

      <section className="card">
        <h3 className="section-title">Gestión de Pagos</h3>
        <PaymentManagement />
      </section>
    </div>
  )
}

// Componente para reporte semanal de ingresos
function WeeklyIncomeReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(getPreviousMonday());

  function getPreviousMonday() {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajuste para domingo
    date.setDate(diff);
    return date.toISOString().split('T')[0];
  }

  const generateReport = async () => {
    setLoading(true);
    try {
      // Simulación de cálculo de ingresos semanales
      // En una implementación real, esto se haría con consultas a Firestore
      const sampleReport = {
        weekStart: startDate,
        totalTrips: 125,
        totalIncome: 45600,
        platformFee: 4560, // 10%
        driversPaid: 41040,
        activeDrivers: 24
      };
      setReport(sampleReport);
    } catch (error) {
      console.error('Error generando reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  return (
    <div>
      <div className="field">
        <label>Fecha de inicio de la semana</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <button className="button" onClick={generateReport} disabled={loading}>
        {loading ? 'Generando...' : 'Actualizar Reporte'}
      </button>

      {report && (
        <div style={{ marginTop: '1.5rem' }}>
          <h4>Resumen Semanal</h4>
          <div className="list">
            <div className="list-item">
              <p>Total de viajes: <strong>{report.totalTrips}</strong></p>
            </div>
            <div className="list-item">
              <p>Ingreso total: <strong>${report.totalIncome.toFixed(2)} MXN</strong></p>
            </div>
            <div className="list-item">
              <p>Comisión plataforma (10%): <strong>${report.platformFee.toFixed(2)} MXN</strong></p>
            </div>
            <div className="list-item">
              <p>Pagado a conductores: <strong>${report.driversPaid.toFixed(2)} MXN</strong></p>
            </div>
            <div className="list-item">
              <p>Conductores activos: <strong>{report.activeDrivers}</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para gestión de pagos
function PaymentManagement() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const driversRef = collection(db, 'drivers');
    const unsubscribe = onSnapshot(driversRef, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })).filter(driver => driver.weeklyFee > 0); // Solo conductores con deuda

      setDrivers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsPaid = async (driverId) => {
    try {
      await updateDoc(doc(db, 'drivers', driverId), {
        bloqueadoPorPago: false,
        paymentStatus: 'pagado',
        pagoAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marcando pago:', error);
    }
  };

  if (loading) {
    return <p className="muted">Cargando conductores con deudas...</p>;
  }

  return (
    <div>
      <h4>Conductores con deudas pendientes</h4>
      {drivers.length === 0 ? (
        <p className="muted">No hay conductores con deudas pendientes.</p>
      ) : (
        <div className="list">
          {drivers.map((driver) => (
            <div key={driver.id} className="list-item">
              <p><strong>{driver.nombreCompleto || driver.nombre || 'Taxista'}</strong></p>
              <p className="muted">Teléfono: {driver.telefono || 'N/A'}</p>
              <p className="muted">Deuda: ${driver.weeklyFee?.toFixed(2) || '0.00'} MXN</p>
              <p className="muted">Último pago: {driver.pagoAt ? driver.pagoAt.toDate().toLocaleDateString('es-MX') : 'Nunca'}</p>
              <div className="cta-row">
                <button
                  className="button secondary"
                  onClick={() => markAsPaid(driver.id)}
                >
                  Marcar como pagado
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente para gestionar rutas
function RutaManager() {
  const [rutas, setRutas] = useState([]);
  const [formRuta, setFormRuta] = useState({
    name: '',
    originText: '',
    destinationText: '',
    origin: { latitude: 0, longitude: 0 },
    destination: { latitude: 0, longitude: 0 },
    fixedPrice: 0,
    estimatedTime: 0
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'routes'), where('deleted', '!=', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRutas(data);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const saveRuta = async () => {
    if (!formRuta.name || !formRuta.originText || !formRuta.destinationText) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'routes', editingId), formRuta);
      } else {
        await setDoc(doc(collection(db, 'routes')), formRuta);
      }

      setFormRuta({
        name: '',
        originText: '',
        destinationText: '',
        origin: { latitude: 0, longitude: 0 },
        destination: { latitude: 0, longitude: 0 },
        fixedPrice: 0,
        estimatedTime: 0
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error guardando ruta:', error);
      alert('Error al guardar la ruta');
    }
  };

  const editRuta = (ruta) => {
    setFormRuta({
      name: ruta.name,
      originText: ruta.originText,
      destinationText: ruta.destinationText,
      origin: ruta.origin || { latitude: 0, longitude: 0 },
      destination: ruta.destination || { latitude: 0, longitude: 0 },
      fixedPrice: ruta.fixedPrice || 0,
      estimatedTime: ruta.estimatedTime || 0
    });
    setEditingId(ruta.id);
  };

  const deleteRuta = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta ruta?')) {
      try {
        await updateDoc(doc(db, 'routes', id), { deleted: true, updatedAt: serverTimestamp() });
      } catch (error) {
        console.error('Error eliminando ruta:', error);
        alert('Error al eliminar la ruta');
      }
    }
  };

  if (loading) {
    return <p className="muted">Cargando rutas...</p>;
  }

  return (
    <div>
      <div className="field">
        <label>Nombre de la ruta</label>
        <input
          value={formRuta.name}
          onChange={(e) => setFormRuta({...formRuta, name: e.target.value})}
          placeholder="Ej: Centro a Mercado Municipal"
        />
      </div>
      <div className="field">
        <label>Origen</label>
        <input
          value={formRuta.originText}
          onChange={(e) => setFormRuta({...formRuta, originText: e.target.value})}
          placeholder="Descripción del origen"
        />
      </div>
      <div className="field">
        <label>Destino</label>
        <input
          value={formRuta.destinationText}
          onChange={(e) => setFormRuta({...formRuta, destinationText: e.target.value})}
          placeholder="Descripción del destino"
        />
      </div>
      <div className="field">
        <label>Precio fijo (MXN)</label>
        <input
          type="number"
          value={formRuta.fixedPrice}
          onChange={(e) => setFormRuta({...formRuta, fixedPrice: parseFloat(e.target.value) || 0})}
        />
      </div>
      <div className="field">
        <label>Tiempo estimado (minutos)</label>
        <input
          type="number"
          value={formRuta.estimatedTime}
          onChange={(e) => setFormRuta({...formRuta, estimatedTime: parseInt(e.target.value) || 0})}
        />
      </div>
      <div className="field">
        <label>Latitud origen</label>
        <input
          type="number"
          step="any"
          value={formRuta.origin.latitude}
          onChange={(e) => setFormRuta({
            ...formRuta,
            origin: {...formRuta.origin, latitude: parseFloat(e.target.value)}
          })}
        />
      </div>
      <div className="field">
        <label>Longitud origen</label>
        <input
          type="number"
          step="any"
          value={formRuta.origin.longitude}
          onChange={(e) => setFormRuta({
            ...formRuta,
            origin: {...formRuta.origin, longitude: parseFloat(e.target.value)}
          })}
        />
      </div>
      <div className="field">
        <label>Latitud destino</label>
        <input
          type="number"
          step="any"
          value={formRuta.destination.latitude}
          onChange={(e) => setFormRuta({
            ...formRuta,
            destination: {...formRuta.destination, latitude: parseFloat(e.target.value)}
          })}
        />
      </div>
      <div className="field">
        <label>Longitud destino</label>
        <input
          type="number"
          step="any"
          value={formRuta.destination.longitude}
          onChange={(e) => setFormRuta({
            ...formRuta,
            destination: {...formRuta.destination, longitude: parseFloat(e.target.value)}
          })}
        />
      </div>
      <button className="button" onClick={saveRuta}>
        {editingId ? 'Actualizar ruta' : 'Crear ruta'}
      </button>

      {rutas.length > 0 && (
        <div className="list" style={{ marginTop: '1.5rem' }}>
          {rutas.map(ruta => (
            <div key={ruta.id} className="list-item">
              <p><strong>{ruta.name}</strong></p>
              <p className="muted">{ruta.originText} → {ruta.destinationText}</p>
              <p className="muted">Precio: ${ruta.fixedPrice?.toFixed(2) || 'Variable'} |
                 Tiempo: {ruta.estimatedTime || 'N/A'} min</p>
              <div className="cta-row">
                <button className="button secondary" onClick={() => editRuta(ruta)}>Editar</button>
                <button className="button outline" onClick={() => deleteRuta(ruta.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente para gestionar puntos de referencia
function LandmarkManager() {
  const [landmarks, setLandmarks] = useState([]);
  const [formLandmark, setFormLandmark] = useState({
    name: '',
    description: '',
    location: { latitude: 0, longitude: 0 },
    category: 'otros'
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'landmarks'), where('deleted', '!=', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLandmarks(data);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const saveLandmark = async () => {
    if (!formLandmark.name || !formLandmark.description) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'landmarks', editingId), formLandmark);
      } else {
        await setDoc(doc(collection(db, 'landmarks')), formLandmark);
      }

      setFormLandmark({
        name: '',
        description: '',
        location: { latitude: 0, longitude: 0 },
        category: 'otros'
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error guardando punto de referencia:', error);
      alert('Error al guardar el punto de referencia');
    }
  };

  const editLandmark = (landmark) => {
    setFormLandmark({
      name: landmark.name,
      description: landmark.description,
      location: landmark.location || { latitude: 0, longitude: 0 },
      category: landmark.category || 'otros'
    });
    setEditingId(landmark.id);
  };

  const deleteLandmark = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este punto de referencia?')) {
      try {
        await updateDoc(doc(db, 'landmarks', id), { deleted: true, updatedAt: serverTimestamp() });
      } catch (error) {
        console.error('Error eliminando punto de referencia:', error);
        alert('Error al eliminar el punto de referencia');
      }
    }
  };

  if (loading) {
    return <p className="muted">Cargando puntos de referencia...</p>;
  }

  return (
    <div>
      <div className="field">
        <label>Nombre del punto de referencia</label>
        <input
          value={formLandmark.name}
          onChange={(e) => setFormLandmark({...formLandmark, name: e.target.value})}
          placeholder="Ej: Plaza Principal, Escuela Secundaria"
        />
      </div>
      <div className="field">
        <label>Descripción</label>
        <input
          value={formLandmark.description}
          onChange={(e) => setFormLandmark({...formLandmark, description: e.target.value})}
          placeholder="Breve descripción del lugar"
        />
      </div>
      <div className="field">
        <label>Categoría</label>
        <select
          value={formLandmark.category}
          onChange={(e) => setFormLandmark({...formLandmark, category: e.target.value})}
        >
          <option value="transporte">Transporte</option>
          <option value="comercial">Comercial</option>
          <option value="educativo">Educativo</option>
          <option value="salud">Salud</option>
          <option value="recreativo">Recreativo</option>
          <option value="religioso">Religioso</option>
          <option value="otros">Otros</option>
        </select>
      </div>
      <div className="field">
        <label>Latitud</label>
        <input
          type="number"
          step="any"
          value={formLandmark.location.latitude}
          onChange={(e) => setFormLandmark({
            ...formLandmark,
            location: {...formLandmark.location, latitude: parseFloat(e.target.value)}
          })}
        />
      </div>
      <div className="field">
        <label>Longitud</label>
        <input
          type="number"
          step="any"
          value={formLandmark.location.longitude}
          onChange={(e) => setFormLandmark({
            ...formLandmark,
            location: {...formLandmark.location, longitude: parseFloat(e.target.value)}
          })}
        />
      </div>
      <button className="button" onClick={saveLandmark}>
        {editingId ? 'Actualizar punto' : 'Crear punto'}
      </button>

      {landmarks.length > 0 && (
        <div className="list" style={{ marginTop: '1.5rem' }}>
          {landmarks.map(landmark => (
            <div key={landmark.id} className="list-item">
              <p><strong>{landmark.name}</strong> ({landmark.category})</p>
              <p className="muted">{landmark.description}</p>
              <p className="muted">Coordenadas: {landmark.location?.latitude?.toFixed(6)}, {landmark.location?.longitude?.toFixed(6)}</p>
              <div className="cta-row">
                <button className="button secondary" onClick={() => editLandmark(landmark)}>Editar</button>
                <button className="button outline" onClick={() => deleteLandmark(landmark.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Admin
