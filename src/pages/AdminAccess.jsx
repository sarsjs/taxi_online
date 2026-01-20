import { useAuth } from '../hooks/useAuth'
import { useAdmin } from '../hooks/useAdmin'
import EmailAuth from '../components/EmailAuth'
import { Link } from 'react-router-dom'

function AdminAccess() {
  const { user, initializing } = useAuth()
  const { isAdmin, checking } = useAdmin(user)

  if (initializing || checking) {
    return <p className="muted">Cargando sesion...</p>
  }

  if (!user) {
    return <EmailAuth />
  }

  if (!isAdmin) {
    return (
      <section className="card">
        <h2 className="section-title">Acceso restringido</h2>
        <p className="muted">
          Tu cuenta no tiene permisos de administrador.
        </p>
      </section>
    )
  }

  return (
    <section className="card">
      <h2 className="section-title">Administrador autenticado</h2>
      <p className="muted">Ya puedes ingresar al panel de administración.</p>
      <Link className="button" to="/admin">
        Ir al panel admin
      </Link>
    </section>
  )
}

export default AdminAccess
