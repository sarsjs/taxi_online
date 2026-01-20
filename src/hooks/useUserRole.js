import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useUserRole(user) {
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasConflict, setHasConflict] = useState(false)

  useEffect(() => {
    if (!user) {
      setRole(null)
      setHasConflict(false)
      setLoading(false)
      return
    }

    let driverExists = null
    let passengerExists = null

    const evaluateRole = () => {
      if (driverExists === null || passengerExists === null) return
      if (driverExists && passengerExists) {
        setRole(null)
        setHasConflict(true)
        setLoading(false)
        return
      }
      if (driverExists) {
        setRole('taxista')
        setHasConflict(false)
        setLoading(false)
        return
      }
      if (passengerExists) {
        setRole('pasajero')
        setHasConflict(false)
        setLoading(false)
        return
      }
      setRole(null)
      setHasConflict(false)
      setLoading(false)
    }

    const driverRef = doc(db, 'drivers', user.uid)
    const passengerRef = doc(db, 'passengers', user.uid)

    const unsubscribeDriver = onSnapshot(driverRef, (snapshot) => {
      driverExists = snapshot.exists()
      evaluateRole()
    })

    const unsubscribePassenger = onSnapshot(passengerRef, (snapshot) => {
      passengerExists = snapshot.exists()
      evaluateRole()
    })

    return () => {
      unsubscribeDriver()
      unsubscribePassenger()
    }
  }, [user])

  return { role, loading, hasConflict }
}
