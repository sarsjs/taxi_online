import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

const allowedEmailSet = new Set(
  (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
)

function EmailAuth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const normalizedEmail = email.trim().toLowerCase()
      if (allowedEmailSet.size > 0 && !allowedEmailSet.has(normalizedEmail)) {
        setError('Este acceso es exclusivo para administracion.')
        return
      }
      await signInWithEmailAndPassword(auth, normalizedEmail, password)
    } catch {
      setError('No se pudo autenticar. Revisa tus datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="section-title">Acceso administrador</h2>
      <p className="muted">
        Este acceso es exclusivo. Usa el correo autorizado para ingresar.
      </p>
      <div className="field">
        <label htmlFor="admin-email">Correo</label>
        <input
          id="admin-email"
          type="email"
          placeholder="admin@correo.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="admin-password">Contrasena</label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <button
        className="button"
        onClick={handleSubmit}
        disabled={loading || !email.trim() || password.length < 6}
      >
        Iniciar sesion
      </button>
      {error && <p className="muted">{error}</p>}
    </div>
  )
}

export default EmailAuth
