import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { firebaseStorage } from '@/lib/firebase/client'

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_')

const MAX_IMAGE_DIMENSION = 4096
const MAX_FILE_SIZE_MB = 5

/**
 * Resize an image file if it exceeds max dimensions or file size
 */
export const resizeImage = (file: File, maxDimension = MAX_IMAGE_DIMENSION, maxSizeMB = MAX_FILE_SIZE_MB): Promise<File> => {
    return new Promise((resolve, reject) => {
        // If not an image, return as-is
        if (!file.type.startsWith('image/')) {
            resolve(file)
            return
        }

        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
            URL.revokeObjectURL(url)

            let { width, height } = img

            // Check if resize is needed based on dimensions
            const needsResize = width > maxDimension || height > maxDimension

            if (!needsResize && file.size <= maxSizeMB * 1024 * 1024) {
                resolve(file)
                return
            }

            // Calculate new dimensions maintaining aspect ratio
            if (width > height) {
                if (width > maxDimension) {
                    height = Math.round((height * maxDimension) / width)
                    width = maxDimension
                }
            } else {
                if (height > maxDimension) {
                    width = Math.round((width * maxDimension) / height)
                    height = maxDimension
                }
            }

            // Create canvas and draw resized image
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')

            if (!ctx) {
                reject(new Error('Could not get canvas context'))
                return
            }

            ctx.drawImage(img, 0, 0, width, height)

            // Convert to blob with quality adjustment to meet size limit
            const tryConvert = (quality: number) => {
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to convert canvas to blob'))
                            return
                        }

                        // If still too large and quality can be reduced, try again
                        if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.1) {
                            tryConvert(quality - 0.1)
                            return
                        }

                        const resizedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        })
                        resolve(resizedFile)
                    },
                    'image/jpeg',
                    quality
                )
            }

            tryConvert(0.9)
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('Failed to load image for resizing'))
        }

        img.src = url
    })
}

/**
 * Upload a profile picture to team/profile path with resizing
 */
export const uploadProfilePicture = async (file: File, employeeId: string): Promise<string> => {
    if (!firebaseStorage) {
        throw new Error('Firebase storage is not initialized')
    }

    // Resize the image before upload
    const resizedFile = await resizeImage(file)

    // Validate final size
    if (resizedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`Image must be less than ${MAX_FILE_SIZE_MB}MB after compression`)
    }

    const safeName = sanitizeFileName(file.name)
    const uniqueId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const name = `${employeeId}_${uniqueId}_${safeName}`
    const path = `team/profile/${name}`
    const storageRef = ref(firebaseStorage, path)
    await uploadBytes(storageRef, resizedFile)
    return await getDownloadURL(storageRef)
}

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
