'use client'

import { useEffect, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastMessage {
    message: string
    type: ToastType
    id: number
}

let toastCounter = 0
const toastCallbacks: ((toast: ToastMessage) => void)[] = []

export function toast(message: string, type: ToastType = 'success') {
    const toastMessage: ToastMessage = {
        message,
        type,
        id: toastCounter++
    }
    toastCallbacks.forEach(callback => callback(toastMessage))
}

export function Toaster() {
    const [toasts, setToasts] = useState<ToastMessage[]>([])

    useEffect(() => {
        const callback = (toast: ToastMessage) => {
            setToasts(prev => [...prev, toast])
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toast.id))
            }, 3000)
        }
        toastCallbacks.push(callback)
        return () => {
            const index = toastCallbacks.indexOf(callback)
            if (index > -1) {
                toastCallbacks.splice(index, 1)
            }
        }
    }, [])

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`rounded-lg border px-4 py-3 shadow-lg transition-all animate-in slide-in-from-right ${t.type === 'success'
                            ? 'border-green-500 bg-green-50 text-green-900'
                            : t.type === 'error'
                                ? 'border-red-500 bg-red-50 text-red-900'
                                : 'border-blue-500 bg-blue-50 text-blue-900'
                        }`}
                >
                    {t.message}
                </div>
            ))}
        </div>
    )
}
