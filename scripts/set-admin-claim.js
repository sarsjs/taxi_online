/* global process */
import admin from 'firebase-admin'

const [uid] = process.argv.slice(2)

if (!uid) {
  console.error('Uso: node scripts/set-admin-claim.js <UID>')
  process.exit(1)
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    'Falta GOOGLE_APPLICATION_CREDENTIALS (ruta al service account JSON).',
  )
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
})

async function setAdminClaim() {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true })
    console.log(`Claim admin establecido para UID ${uid}`)
    process.exit(0)
  } catch (error) {
    console.error('Error al establecer el claim admin:', error.message)
    process.exit(1)
  }
}

setAdminClaim()
