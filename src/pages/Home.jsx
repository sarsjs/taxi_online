import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import AuthOptions from '../components/AuthOptions'
import { useAuth } from '../hooks/useAuth'
import { useUserRole } from '../hooks/useUserRole'
import { useAdmin } from '../hooks/useAdmin'
import { db } from '../firebase'

const ROLE_STORAGE_KEY = 'preferredRole'

function Home() {
  const { user, initializing, signOut } = useAuth()
  const { role, loading, hasConflict } = useUserRole(user)
  const { isAdmin, checking } = useAdmin(user)
  const [selectedRole, setSelectedRole] = useState('pasajero')
  const [savingRole, setSavingRole] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY)
    if (storedRole === 'taxista' || storedRole === 'pasajero') {
      setSelectedRole(storedRole)
    }
  }, [])

  useEffect(() => {
    if (!user || loading || role) return
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY)
    if (storedRole === 'taxista' || storedRole === 'pasajero') {
      setSelectedRole(storedRole)
    }
  }, [user, loading, role])

  const handleRoleSelection = async () => {
    if (!user) return
    setSavingRole(true)
    setError('')
    try {
      if (selectedRole === 'taxista') {
        await setDoc(
          doc(db, 'drivers', user.uid),
          {
            rol: 'taxista',
            nombre: user.displayName || '',
            telefono: user.phoneNumber || '',
            fechaRegistro: serverTimestamp(),
            createdAt: serverTimestamp(),
            saldoPendiente: 0,
            estado: 'prueba',
          },
          { merge: true },
        )
      } else {
        await setDoc(
          doc(db, 'passengers', user.uid),
          {
            rol: 'pasajero',
            nombreCompleto: user.displayName || '',
            telefono: user.phoneNumber || '',
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )
      }
    } catch {
      setError('No se pudo completar el registro. Intenta de nuevo.')
    } finally {
      setSavingRole(false)
    }
  }

  if (initializing || loading || checking) {
    return <p className="muted">Cargando sesion...</p>
  }

  if (user && isAdmin) {
    return (
      <section className="card hero-card">
        <h2 className="section-title">Acceso administrador</h2>
        <p className="muted">
          Esta cuenta solo puede entrar desde la ruta privada de administración.
        </p>
        <Link className="button" to="/admin">
          Ir al panel admin
        </Link>
        <button className="button outline" onClick={signOut}>
          Cerrar sesion
        </button>
      </section>
    )
  }

  if (hasConflict) {
    return (
      <section className="card hero-card">
        <h2 className="section-title">Cuenta con roles duplicados</h2>
        <p className="muted">
          Tu usuario aparece como pasajero y taxista. Contacta al administrador
          para corregirlo.
        </p>
        <button className="button outline" onClick={signOut}>
          Cerrar sesion
        </button>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="home-hero">
        <div className="hero-content">
          <span className="eyebrow">taxi_online</span>
          <h1>Viaja seguro con Taxi Online</h1>
          <p className="hero-description">
            Solicita taxis confiables en tu poblado, sigue tu viaje en tiempo
            real y mantente informado con notificaciones al instante.
          </p>
          <div className="hero-actions">
            <span className="badge">Mapa en tiempo real</span>
            <span className="badge">Reservas rápidas</span>
            <span className="badge">Soporte local</span>
          </div>
          <div className="feature-grid">
            <article className="feature-card">
              <h3>Pasajeros informados</h3>
              <p>
                Rastrea el recorrido, recibe avisos y gestiona tu historial de
                viajes desde un panel simple.
              </p>
            </article>
            <article className="feature-card">
              <h3>Conductores conectados</h3>
              <p>
                Acepta solicitudes cercanas, administra tus ganancias y mantén
                tu estado en tiempo real.
              </p>
            </article>
            <article className="feature-card">
              <h3>Servicio confiable</h3>
              <p>
                Optimizado para móviles, con diseño moderno y controles claros
                para todo tipo de usuario.
              </p>
            </article>
          </div>
        </div>
        <div className="card hero-panel">
          <h2>Inicia sesión</h2>
          <p className="muted">
            Accede con tu cuenta y elige tu rol. Si eres nuevo, selecciona tu
            perfil antes de continuar.
          </p>
          <div className="field" style={{ marginTop: '1.5rem' }}>
            <label>Selecciona tu rol</label>
            <div className="cta-row">
              <label className="button outline role-option">
                <input
                  type="radio"
                  name="role"
                  value="pasajero"
                  checked={selectedRole === 'pasajero'}
                  onChange={() => {
                    setSelectedRole('pasajero')
                    localStorage.setItem(ROLE_STORAGE_KEY, 'pasajero')
                  }}
                />
                Pasajero
              </label>
              <label className="button outline role-option">
                <input
                  type="radio"
                  name="role"
                  value="taxista"
                  checked={selectedRole === 'taxista'}
                  onChange={() => {
                    setSelectedRole('taxista')
                    localStorage.setItem(ROLE_STORAGE_KEY, 'taxista')
                  }}
                />
                Taxista
              </label>
            </div>
          </div>
          <div style={{ marginTop: '2rem' }}>
            <AuthOptions recaptchaId="recaptcha-main" />
          </div>
        </div>
      </section>
    )
  }

  if (!role) {
    return (
      <section className="card hero-card">
        <h2 className="section-title">Completa tu registro</h2>
        <p className="muted">
          Elige tu perfil. Esta seleccion es definitiva y no se puede cambiar
          desde la app.
        </p>
        <div className="cta-row" style={{ marginTop: '1.5rem' }}>
          <button
            className={selectedRole === 'pasajero' ? 'button' : 'button outline'}
            onClick={() => setSelectedRole('pasajero')}
          >
            Pasajero
          </button>
          <button
            className={selectedRole === 'taxista' ? 'button' : 'button outline'}
            onClick={() => setSelectedRole('taxista')}
          >
            Taxista
          </button>
        </div>
        {error && <p className="muted">{error}</p>}
        <button
          className="button"
          onClick={handleRoleSelection}
          disabled={savingRole}
          style={{ marginTop: '1.5rem' }}
        >
          {savingRole ? 'Guardando...' : 'Continuar'}
        </button>
      </section>
    )
  }

  return (
    <section className="card hero-card">
      <h2 className="section-title">Bienvenido</h2>
      <p className="muted">Tu cuenta esta lista. Ingresa a tu perfil.</p>
      <Link className="button" to={role === 'taxista' ? '/taxista' : '/pasajero'}>
        Ir a mi perfil
      </Link>
    </section>
  )
}

export default Home
