import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null)
      setInitializing(false)
    })

    return () => unsubscribe()
  }, [])

  return {
    user,
    initializing,
    signOut: async () => {
      await signOut(auth)
      window.location.href = '/'
    },
  }
}
