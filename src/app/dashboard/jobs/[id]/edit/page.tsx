'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { JobForm } from '@/features/hiring'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import type { Job } from '@/types'
import { toast } from '@/components/ui/toast'

export default function EditJobPage() {
    const params = useParams()
    const router = useRouter()
    const { jobs } = useApp()
    const jobId = params.id as string
    const job = useMemo(() => jobs.find(j => j.id === jobId), [jobs, jobId])
    const [current, setCurrent] = useState<Job | null>(job || null)

    useEffect(() => {
        if (job) {
            setCurrent(job)
        } else if (jobs.length > 0 && !job) {
            toast('Job not found', 'error')
            router.push('/dashboard/jobs')
        }
    }, [job, jobs.length, router])

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
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Job</h1>
                    <p className="text-slate-500 font-medium">Update the job details and requirements.</p>
                </div>
            </div>
            <JobForm mode="edit" job={current} />
        </div>
    )
}
