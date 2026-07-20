'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { Resource } from '@/types'
import { fetchResourceApi } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LibraryBookForm } from '@/features/resources'
import { isLibraryBook } from '@/features/resources/library'

export default function EditLibraryBookPage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const { apiAccessToken, isHydrating } = useApp()
    const [book, setBook] = useState<Resource | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async () => {
        if (!apiAccessToken || !params.id) { setLoading(false); return }
        setLoading(true)
        setError(null)
        try {
            const resource = await fetchResourceApi(params.id, apiAccessToken)
            if (!isLibraryBook(resource)) throw new Error('Book not found')
            setBook(resource)
        } catch (loadError) {
            setBook(null)
            setError(loadError instanceof Error ? loadError.message : 'Book not found')
        } finally { setLoading(false) }
    }, [apiAccessToken, params.id])

    useEffect(() => { if (!isHydrating) void load() }, [isHydrating, load])

    if (isHydrating || loading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
    if (error || !book) return <div className="space-y-6"><Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.push('/resources/library')}><ArrowLeft /></Button><Card className="border-red-100 bg-red-50/50"><CardContent className="space-y-4 p-8 text-center"><p className="text-sm font-medium text-red-700">{error || 'Book not found'}</p><Button variant="outline" className="rounded-xl" onClick={() => void load()}>Try again</Button></CardContent></Card></div>

    return <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500"><div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Edit Book</h1><p className="font-medium text-slate-500">Update this book&apos;s catalog information without changing its checkout.</p></div><LibraryBookForm resource={book} /></div>
}
