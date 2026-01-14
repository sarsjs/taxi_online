import { Link, Route, Routes } from 'react-router-dom'
import './App.css'
import Admin from './pages/Admin.jsx'
import Driver from './pages/Driver.jsx'
import Passenger from './pages/Passenger.jsx'

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-title">Taxi Local</p>
          <p className="app-subtitle">Solicita o acepta viajes en tiempo real</p>
        </div>
        <nav className="app-nav">
          <Link to="/pasajero">Pasajero</Link>
          <Link to="/taxista">Taxista</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <section className="card">
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
    </div>
  )
}

export default App
