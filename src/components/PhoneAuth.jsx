import { useEffect, useRef, useState } from 'react'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { auth } from '../firebase'

function PhoneAuth({ recaptchaId }) {
  const verifierRef = useRef(null)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!verifierRef.current) {
      verifierRef.current = new RecaptchaVerifier(auth, recaptchaId, {
        size: 'normal',
      })
    }

    return () => {
      if (verifierRef.current) {
        verifierRef.current.clear()
        verifierRef.current = null
      }
    }
  }, [recaptchaId])

  const requestCode = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await signInWithPhoneNumber(
        auth,
        phone.trim(),
        verifierRef.current,
      )
      setConfirmation(result)
    } catch {
      setError('No se pudo enviar el SMS. Revisa el numero y reintenta.')
    } finally {
      setLoading(false)
    }
  }

  const confirmCode = async () => {
    if (!confirmation) return
    setError('')
    setLoading(true)
    try {
      await confirmation.confirm(code.trim())
    } catch {
      setError('Codigo incorrecto o expirado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card auth-card">
      <h2 className="section-title">Inicio de sesion por SMS</h2>
      <div className="field">
        <label htmlFor={`${recaptchaId}-phone`}>Telefono</label>
        <input
          id={`${recaptchaId}-phone`}
          placeholder="+52 555 000 0000"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>
      <button
        className="button"
        onClick={requestCode}
        disabled={loading || !phone.trim()}
      >
        Enviar codigo
      </button>

      {confirmation && (
        <>
          <div className="field" style={{ marginTop: '1rem' }}>
            <label htmlFor={`${recaptchaId}-code`}>Codigo SMS</label>
            <input
              id={`${recaptchaId}-code`}
              placeholder="123456"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
          <button
            className="button secondary"
            onClick={confirmCode}
            disabled={loading || !code.trim()}
          >
            Verificar codigo
          </button>
        </>
      )}

      <div id={recaptchaId} style={{ marginTop: '1rem' }} />

      {error && <p className="muted">{error}</p>}
    </div>
  )
}

export default PhoneAuth
