'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'
import type { Applicant, ApplicantStatus, Job } from '@/types'
import { Briefcase } from 'lucide-react'

const STATUSES = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected'] as const satisfies ApplicantStatus[]

export default function ApplicantsProgressPage() {
    const router = useRouter()
    const { applicants, jobs, roles, updateApplicant } = useApp()

    const rolesById = useMemo(() => {
        const map = new Map<string, string>()
        roles.forEach(role => map.set(role.id, role.title))
        return map
    }, [roles])

    const jobById = useMemo(() => new Map(jobs.map(job => [job.id, job])), [jobs])
    const jobByTitle = useMemo(() => new Map(jobs.map(job => [job.title, job])), [jobs])

    const getApplicantJob = (applicant: Applicant): Job | undefined => {
        if (applicant.jobId && jobById.has(applicant.jobId)) {
            return jobById.get(applicant.jobId)
        }
        return jobByTitle.get(applicant.positionApplied)
    }

    const getRoleTitle = (roleId?: string) => {
        if (!roleId) return 'No role assigned'
        return rolesById.get(roleId) || 'Unknown role'
    }

    const getStatusColor = (status: ApplicantStatus) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-700'
            case 'screening': return 'bg-yellow-100 text-yellow-700'
            case 'interview': return 'bg-purple-100 text-purple-700'
            case 'offer': return 'bg-green-100 text-green-700'
            case 'rejected': return 'bg-red-100 text-red-700'
            case 'hired': return 'bg-emerald-100 text-emerald-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    const applicantsByStatus = useMemo(() => {
        const map = new Map<Applicant['status'], Applicant[]>()
        STATUSES.forEach(status => map.set(status, []))
        applicants.forEach(applicant => {
            const list = map.get(applicant.status)
            if (list) list.push(applicant)
        })
        return map
    }, [applicants])

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Applicants
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Track candidate status across the pipeline.
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="flex gap-6 min-w-[900px]">
                    {STATUSES.map((status) => {
                        const list = applicantsByStatus.get(status) || []
                                return (
                            <Card
                                key={status}
                                className="min-w-[280px] border border-slate-100 shadow-premium rounded-3xl bg-white"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={async (e) => {
                                    e.preventDefault()
                                    const applicantId = e.dataTransfer.getData('text/applicant')
                                    if (!applicantId) return
                                    const applicant = applicants.find(a => a.id === applicantId)
                                    if (!applicant || applicant.status === status) return
                                    try {
                                        await updateApplicant(applicantId, { status })
                                        toast('Applicant status updated', 'success')
                                    } catch (error) {
                                        toast('Failed to update applicant status', 'error')
                                    }
                                }}
                            >
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">{status}</p>
                                            <p className="text-sm font-bold text-slate-900">{list.length} candidate{list.length === 1 ? '' : 's'}</p>
                                        </div>
                                        <Badge className={`border-none ${getStatusColor(status)}`}>
                                            {status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3">
                                        {list.length === 0 ? (
                                            <div className="text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-center">
                                                No applicants
                                            </div>
                                        ) : (
                                            list.map((applicant) => {
                                                const job = getApplicantJob(applicant)
                                                        return (
                                                    <button
                                                        key={applicant.id}
                                                        type="button"
                                                        onClick={() => {
                                                            if (typeof window !== 'undefined') {
                                                                sessionStorage.setItem('applicantDetailBack', '/dashboard/applicants/progress')
                                                            }
                                                            router.push(`/dashboard/applicants/${applicant.id}`)
                                                        }}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData('text/applicant', applicant.id)
                                                            e.dataTransfer.effectAllowed = 'move'
                                                        }}
                                                        className="w-full text-left border border-slate-100 rounded-2xl p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
                                                    >
                                                        <p className="text-sm font-bold text-slate-900">{applicant.fullName}</p>
                                                        <p className="text-xs text-slate-500 mt-1">{applicant.positionApplied}</p>
                                                        <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                                                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>{job ? getRoleTitle(job.roleId) : '—'}</span>
                                                        </div>
                                                    </button>
    )
                                                })
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </div>
)
}
