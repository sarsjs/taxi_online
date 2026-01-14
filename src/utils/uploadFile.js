import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '../firebase'

export async function uploadFile({ file, path }) {
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
