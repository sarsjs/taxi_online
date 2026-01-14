import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '../firebase'

function EmailAuth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email.trim(), password)
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password)
      }
    } catch {
      setError('No se pudo autenticar. Revisa tus datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="section-title">Acceso administrador</h2>
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
        {isRegister ? 'Crear cuenta' : 'Iniciar sesion'}
      </button>
      <button
        className="button outline"
        type="button"
        onClick={() => setIsRegister((prev) => !prev)}
        style={{ marginTop: '0.8rem' }}
      >
        {isRegister ? 'Ya tengo cuenta' : 'Crear cuenta'}
      </button>
      {error && <p className="muted">{error}</p>}
    </div>
  )
}

export default EmailAuth
