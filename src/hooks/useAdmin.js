import { useEffect, useState } from 'react'
import { getIdTokenResult } from 'firebase/auth'

export function useAdmin(user) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true

    const checkClaims = async () => {
      if (!user) {
        if (active) {
          setIsAdmin(false)
          setChecking(false)
        }
        return
      }

      try {
        const token = await getIdTokenResult(user, true)
        if (active) {
          setIsAdmin(Boolean(token?.claims?.admin))
          setChecking(false)
        }
      } catch {
        if (active) {
          setIsAdmin(false)
          setChecking(false)
        }
      }
    }

    checkClaims()

    return () => {
      active = false
    }
  }, [user])

  return { isAdmin, checking }
}
