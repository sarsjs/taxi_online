import GoogleAuth from './GoogleAuth'
import PhoneAuth from './PhoneAuth'

function AuthOptions({ recaptchaId }) {
  return (
    <div className="grid auth-grid">
      <GoogleAuth />
      <PhoneAuth recaptchaId={recaptchaId} />
    </div>
  )
}

export default AuthOptions
