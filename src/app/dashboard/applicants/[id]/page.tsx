'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { ArrowLeft, Mail, Phone, Briefcase, DollarSign, Calendar, FileText, Linkedin, ExternalLink, Edit } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import type { Applicant } from '@/types'

export default function ApplicantDetailPage() {
    const router = useRouter()
    const params = useParams()
    const { applicants, jobs, updateApplicant } = useApp()
    const [applicant, setApplicant] = useState<Applicant | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [editData, setEditData] = useState<Partial<Applicant>>({})

    useEffect(() => {
        const found = applicants.find(a => a.id === params.id)
        if (found) {
            setApplicant(found)
            setEditData(found)
        }
    }, [params.id, applicants])

    if (!applicant) {
        return (
            <DashboardShell>
                <div className="text-center py-16">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Applicant not found</h3>
                    <Button onClick={() => router.push('/dashboard/applicants')} className="mt-4">
                        Back to Applicants
                    </Button>
                </div>
            </DashboardShell>
        )
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await updateApplicant(applicant.id, editData)
            setIsEditOpen(false)
            toast('Applicant updated successfully', 'success')
        } catch (error) {
            toast('Failed to update applicant', 'error')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
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

    const getJobTitle = (jobId?: string) => {
        if (!jobId) return 'Not linked to any job'
        const job = jobs.find(j => j.id === jobId)
        return job?.title || 'Unknown job'
    }

    return (
        <DashboardShell>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/dashboard/applicants')}
                        className="rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            {applicant.fullName}
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Applicant Details
                        </p>
                    </div>
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 px-6 py-6 h-auto">
                                <Edit className="w-5 h-5 mr-2" />
                                Edit Details
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl rounded-3xl bg-white border-slate-200 max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-slate-900">Edit Applicant</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleUpdate} className="space-y-6 py-4">
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-4">Personal Information</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700 px-1">Full Name</Label>
                                            <Input
                                                className="rounded-xl border-slate-200 h-12"
                                                value={editData.fullName || ''}
                                                onChange={e => setEditData({ ...editData, fullName: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">Email</Label>
                                                <Input
                                                    type="email"
                                                    className="rounded-xl border-slate-200 h-12"
                                                    value={editData.email || ''}
                                                    onChange={e => setEditData({ ...editData, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">Phone</Label>
                                                <Input
                                                    className="rounded-xl border-slate-200 h-12"
                                                    value={editData.phone || ''}
                                                    onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-4">Professional Information</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700 px-1">Position Applied</Label>
                                            <Input
                                                className="rounded-xl border-slate-200 h-12"
                                                value={editData.positionApplied || ''}
                                                onChange={e => setEditData({ ...editData, positionApplied: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">Years of Experience</Label>
                                                <Input
                                                    type="number"
                                                    className="rounded-xl border-slate-200 h-12"
                                                    value={editData.yearsOfExperience || ''}
                                                    min={0}
                                                    step={0.1}
                                                    inputMode="numeric"
                                                    onKeyDown={(e) => {
                                                        if (e.key === '-' || e.key === '+' || e.key.toLowerCase() === 'e') {
                                                            e.preventDefault()
                                                        }
                                                    }}
                                                    onChange={e => {
                                                        const raw = e.target.value
                                                        if (raw === '') {
                                                            setEditData({ ...editData, yearsOfExperience: 0 })
                                                            return
                                                        }
                                                        const parsed = Number.parseFloat(raw)
                                                        setEditData({
                                                            ...editData,
                                                            yearsOfExperience: Number.isFinite(parsed) && parsed >= 0
                                                                ? Number.parseFloat(parsed.toFixed(1))
                                                                : 0
                                                        })
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">Current Salary</Label>
                                                <Input
                                                    type="number"
                                                    className="rounded-xl border-slate-200 h-12"
                                                    value={editData.currentSalary || ''}
                                                    min={0}
                                                    step={1}
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    onKeyDown={(e) => {
                                                        if (e.key === '-' || e.key === '+' || e.key.toLowerCase() === 'e' || e.key === '.') {
                                                            e.preventDefault()
                                                        }
                                                    }}
                                                    onChange={e => {
                                                        const raw = e.target.value
                                                        if (raw === '') {
                                                            setEditData({ ...editData, currentSalary: 0 })
                                                            return
                                                        }
                                                        const parsed = Number.parseInt(raw, 10)
                                                        setEditData({
                                                            ...editData,
                                                            currentSalary: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
                                                        })
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">Expected Salary</Label>
                                                <Input
                                                    type="number"
                                                    className="rounded-xl border-slate-200 h-12"
                                                    value={editData.expectedSalary || ''}
                                                    min={0}
                                                    step={1}
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    onKeyDown={(e) => {
                                                        if (e.key === '-' || e.key === '+' || e.key.toLowerCase() === 'e' || e.key === '.') {
                                                            e.preventDefault()
                                                        }
                                                    }}
                                                    onChange={e => {
                                                        const raw = e.target.value
                                                        if (raw === '') {
                                                            setEditData({ ...editData, expectedSalary: 0 })
                                                            return
                                                        }
                                                        const parsed = Number.parseInt(raw, 10)
                                                        setEditData({
                                                            ...editData,
                                                            expectedSalary: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
                                                        })
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700 px-1">Notice Period</Label>
                                            <Input
                                                className="rounded-xl border-slate-200 h-12"
                                                value={editData.noticePeriod || ''}
                                                onChange={e => setEditData({ ...editData, noticePeriod: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-4">Application Status</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700 px-1">Current Status</Label>
                                            <Select
                                                value={editData.status}
                                                onValueChange={(value: any) => setEditData({ ...editData, status: value })}
                                            >
                                                <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="new">New</SelectItem>
                                                    <SelectItem value="screening">Screening</SelectItem>
                                                    <SelectItem value="interview">Interview</SelectItem>
                                                    <SelectItem value="offer">Offer</SelectItem>
                                                    <SelectItem value="rejected">Rejected</SelectItem>
                                                    <SelectItem value="hired">Hired</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditOpen(false)}
                                        className="flex-1 rounded-xl h-12 font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 font-bold"
                                    >
                                        {loading ? 'Updating...' : 'Update Applicant'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-6">Personal Information</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</p>
                                        <p className="text-slate-900 font-medium">{applicant.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Phone className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</p>
                                        <p className="text-slate-900 font-medium">{applicant.phone || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-6">Professional Information</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Briefcase className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Position Applied</p>
                                        <p className="text-slate-900 font-medium">{applicant.positionApplied}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Briefcase className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Linked Job Opening</p>
                                        <p className="text-slate-900 font-medium">{getJobTitle(applicant.jobId)}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 pt-2">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Experience</p>
                                        <p className="text-slate-900 font-bold text-lg">{applicant.yearsOfExperience} {applicant.yearsOfExperience === 1 ? 'year' : 'years'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Salary</p>
                                        <p className="text-slate-900 font-bold text-lg">{applicant.currentSalary || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Expected Salary</p>
                                        <p className="text-slate-900 font-bold text-lg">{applicant.expectedSalary || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notice Period</p>
                                    <p className="text-slate-900 font-medium">{applicant.noticePeriod || 'Not specified'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-6">Documents & Links</h2>
                            <div className="space-y-3">
                                {applicant.resumeFile ? (
                                    <a
                                        href={applicant.resumeFile.dataUrl}
                                        download={applicant.resumeFile.name}
                                        className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900">Resume</p>
                                            <p className="text-xs text-slate-500">View document</p>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-slate-400" />
                                    </a>
                                ) : (
                                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-500">Resume</p>
                                            <p className="text-xs text-slate-400">Not provided</p>
                                        </div>
                                    </div>
                                )}

                                {applicant.linkedinUrl ? (
                                    <a
                                        href={applicant.linkedinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <Linkedin className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900">LinkedIn Profile</p>
                                            <p className="text-xs text-slate-500">View profile</p>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-slate-400" />
                                    </a>
                                ) : (
                                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                            <Linkedin className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-500">LinkedIn Profile</p>
                                            <p className="text-xs text-slate-400">Not provided</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-6">Application Status</h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Status</p>
                                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(applicant.status)}`}>
                                        {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Applied Date</p>
                                            <p className="text-slate-900 font-medium">{new Date(applicant.appliedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}
