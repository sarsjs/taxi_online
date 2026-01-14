import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../firebase'

function GoogleAuth() {
  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  return (
    <div className="card auth-card">
      <h2 className="section-title">Iniciar sesion</h2>
      <p className="muted">Accede con tu cuenta de Google.</p>
      <button className="button" onClick={handleSignIn}>
        Continuar con Google
      </button>
    </div>
  )
}

export default GoogleAuth
