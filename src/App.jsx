import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import './App.css'
import Admin from './pages/Admin.jsx'
import AdminAccess from './pages/AdminAccess.jsx'
import Driver from './pages/Driver.jsx'
import Home from './pages/Home.jsx'
import Passenger from './pages/Passenger.jsx'
import { useAuth } from './hooks/useAuth'
import { useUserRole } from './hooks/useUserRole'

function App() {
  const { user, initializing } = useAuth()
  const { role, loading } = useUserRole(user)
  const location = useLocation()
  const navigate = useNavigate()

  const isCheckingRole = initializing || loading

  const roleRoute = role === 'taxista' ? '/taxista' : '/pasajero'

  useEffect(() => {
    if (isCheckingRole) return
    if (!user || !role) return
    if (location.pathname === '/') {
      navigate(roleRoute, { replace: true })
    }
  }, [isCheckingRole, user, role, location.pathname, navigate, roleRoute])

  const renderRoleGuard = (expectedRole, element) => {
    if (isCheckingRole) {
      return <p className="muted">Cargando sesion...</p>
    }
    if (!user) {
      return (
        <section className="card">
          <h2 className="section-title">Inicia sesion</h2>
          <p className="muted">
            Debes iniciar sesion para acceder a este perfil.
          </p>
          <Link className="button" to="/">
            Ir a inicio
          </Link>
        </section>
      )
    }
    if (!role) {
      return (
        <section className="card">
          <h2 className="section-title">Completa tu registro</h2>
          <p className="muted">
            Selecciona tu perfil en la pantalla de inicio para continuar.
          </p>
          <Link className="button" to="/">
            Ir a inicio
          </Link>
        </section>
      )
    }
    if (role && role !== expectedRole) {
      return (
        <section className="card">
          <h2 className="section-title">Acceso restringido</h2>
          <p className="muted">
            Tu cuenta esta registrada como {role}. No puedes cambiar de perfil
            desde la app.
          </p>
          <Link className="button" to={roleRoute}>
            Ir a mi perfil
          </Link>
        </section>
      )
    }
    return element
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-dot" />
          <div>
            <p className="app-title">Taxi Local</p>
            <p className="app-subtitle">Solicita o acepta viajes en tiempo real</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/pasajero"
            element={renderRoleGuard('pasajero', <Passenger />)}
          />
          <Route
            path="/taxista"
            element={renderRoleGuard('taxista', <Driver />)}
          />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin-access" element={<AdminAccess />} />
        </Routes>
      </main>

      <nav className="bottom-nav">
        {role && (
          <Link className="active" to={roleRoute}>
            {role === 'taxista' ? 'Taxista' : 'Pasajero'}
          </Link>
        )}
        {!role && (
          <Link className={location.pathname === '/' ? 'active' : ''} to="/">
            Inicio
          </Link>
        )}
      </nav>
    </div>
  )
}

export default App
