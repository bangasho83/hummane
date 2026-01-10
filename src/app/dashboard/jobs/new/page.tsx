'use client'

import { JobForm } from '@/features/hiring'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NewJobPage() {
    const router = useRouter()
    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/dashboard/jobs')}
                    className="rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add New Job</h1>
                    <p className="text-slate-500 font-medium">Create a new job opening and hiring details.</p>
                </div>
            </div>
            <JobForm mode="create" />
        </div>
    )
}
