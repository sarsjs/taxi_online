import { Link, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Admin from './pages/Admin.jsx'
import Driver from './pages/Driver.jsx'
import Passenger from './pages/Passenger.jsx'
import { useAuth } from './hooks/useAuth'
import { useAdmin } from './hooks/useAdmin'

function App() {
  const { user } = useAuth()
  const { isAdmin } = useAdmin(user)
  const location = useLocation()

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
          <Route
            path="/"
            element={
              <section className="card hero-card">
                <h1>Bienvenido</h1>
                <p>
                  Elige tu rol para empezar. La app usa Firebase Auth y Firestore
                  en tiempo real.
                </p>
                <div className="cta-row">
                  <Link className="button" to="/pasajero">
                    Soy pasajero
                  </Link>
                  <Link className="button outline" to="/taxista">
                    Soy taxista
                  </Link>
                </div>
              </section>
            }
          />
          <Route path="/pasajero" element={<Passenger />} />
          <Route path="/taxista" element={<Driver />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      <nav className="bottom-nav">
        {location.pathname !== '/pasajero' && location.pathname !== '/taxista' && (
          <>
            <Link
              className={location.pathname === '/pasajero' ? 'active' : ''}
              to="/pasajero"
            >
              Pasajero
            </Link>
            <Link
              className={location.pathname === '/taxista' ? 'active' : ''}
              to="/taxista"
            >
              Taxista
            </Link>
          </>
        )}
        {isAdmin && (
          <Link
            className={location.pathname === '/admin' ? 'active' : ''}
            to="/admin"
          >
            Admin
          </Link>
        )}
      </nav>
    </div>
  )
}

export default App
