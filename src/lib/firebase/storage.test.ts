import { beforeEach, describe, expect, it, vi } from 'vitest'

const { refMock, uploadBytesMock, getDownloadURLMock } = vi.hoisted(() => ({
    refMock: vi.fn((_storage: unknown, path: string) => ({ path })),
    uploadBytesMock: vi.fn(async () => undefined),
    getDownloadURLMock: vi.fn(async (storageRef: { path: string }) => `https://files.example/${storageRef.path}`),
}))

vi.mock('firebase/storage', () => ({
    ref: refMock,
    uploadBytes: uploadBytesMock,
    getDownloadURL: getDownloadURLMock,
}))

vi.mock('@/lib/firebase/client', () => ({ firebaseStorage: { bucket: 'test' } }))

import { uploadResourceFiles } from './storage'

describe('uploadResourceFiles', () => {
    beforeEach(() => vi.clearAllMocks())

    it('uploads every file under the root resources path with a sanitized unique name', async () => {
        const files = [
            new File(['receipt'], 'fuel receipt.pdf', { type: 'application/pdf' }),
            new File(['photo'], 'invoice#.png', { type: 'image/png' }),
        ]

        const urls = await uploadResourceFiles(files, 'EMP-42')

        expect(refMock).toHaveBeenCalledTimes(2)
        expect(refMock.mock.calls[0][1]).toMatch(/^resources\/EMP-42_.+_fuel_receipt\.pdf$/)
        expect(refMock.mock.calls[1][1]).toMatch(/^resources\/EMP-42_.+_invoice_\.png$/)
        expect(uploadBytesMock).toHaveBeenNthCalledWith(1, expect.anything(), files[0])
        expect(urls).toHaveLength(2)
    })
})
