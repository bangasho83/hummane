import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { firebaseStorage } from '@/lib/firebase/client'

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_')

export const uploadFileToStorage = async (file: File, folder: string, prefix?: string) => {
    if (!firebaseStorage) {
        throw new Error('Firebase storage is not initialized')
    }

    const safeName = sanitizeFileName(file.name)
    const uniqueId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const name = prefix ? `${prefix}_${uniqueId}_${safeName}` : `${uniqueId}_${safeName}`
    const path = `${folder}/${name}`
    const storageRef = ref(firebaseStorage, path)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
}
