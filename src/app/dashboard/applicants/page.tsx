'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Plus, Trash2, Users, Search } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Applicant } from '@/types'

const createEmptyApplicant = (
    appliedDate: string
): Omit<Applicant, 'id' | 'companyId' | 'createdAt' | 'updatedAt'> => ({
    fullName: '',
    email: '',
    phone: '',
    positionApplied: '',
    jobId: '',
    yearsOfExperience: 0,
    currentSalary: '',
    expectedSalary: '',
    noticePeriod: '',
    resumeUrl: '',
    linkedinUrl: '',
    status: 'new' as Applicant['status'],
    appliedDate
})

export default function ApplicantsPage() {
    const router = useRouter()
    const { applicants, jobs, createApplicant, deleteApplicant } = useApp()
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [todayDate, setTodayDate] = useState('')
    const [newApplicant, setNewApplicant] = useState(() => createEmptyApplicant(''))

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0]
        setTodayDate(today)
        setNewApplicant(prev => ({ ...prev, appliedDate: today }))
    }, [])

    const filteredApplicants = applicants.filter(applicant =>
        applicant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        applicant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        applicant.positionApplied.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newApplicant.fullName || !newApplicant.email || !newApplicant.positionApplied) {
            toast('Please fill in all required fields', 'error')
            return
        }

        setLoading(true)
        try {
            await createApplicant(newApplicant)
            const appliedDate = todayDate || new Date().toISOString().split('T')[0]
            setNewApplicant(createEmptyApplicant(appliedDate))
            setIsAddOpen(false)
            toast('Applicant added successfully', 'success')
        } catch (error) {
            toast('Failed to add applicant', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete ${name}?`)) {
            deleteApplicant(id)
            toast('Applicant deleted', 'success')
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

    return (
        <DashboardShell>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Applicants
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Track and manage job applicants.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <Input
                                placeholder="Search applicants..."
                                className="pl-12 rounded-2xl border-slate-200 h-12 bg-slate-50"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 px-6 py-6 h-auto">
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add Applicant
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl rounded-3xl bg-white border-slate-200 max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-slate-900">Add New Applicant</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAdd} className="space-y-6 py-4">
                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-4">Personal Information</h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">Full Name *</Label>
                                                <Input
                                                    placeholder="e.g. John Smith"
                                                    className="rounded-xl border-slate-200 h-12"
                                                    value={newApplicant.fullName}
                                                    onChange={e => setNewApplicant({ ...newApplicant, fullName: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-bold text-slate-700 px-1">Email *</Label>
                                                    <Input
                                                        type="email"
                                                        placeholder="john.smith@example.com"
                                                        className="rounded-xl border-slate-200 h-12"
                                                        value={newApplicant.email}
                                                        onChange={e => setNewApplicant({ ...newApplicant, email: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-bold text-slate-700 px-1">Phone</Label>
                                                    <Input
                                                        placeholder="03252812512"
                                                        className="rounded-xl border-slate-200 h-12"
                                                        value={newApplicant.phone}
                                                        onChange={e => setNewApplicant({ ...newApplicant, phone: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-4">Professional Information</h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">Position Applied *</Label>
                                                <Input
                                                    placeholder="e.g. CRM Automation Associate"
                                                    className="rounded-xl border-slate-200 h-12"
                                                    value={newApplicant.positionApplied}
                                                    onChange={e => setNewApplicant({ ...newApplicant, positionApplied: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">Link to Job Opening</Label>
                                                <Select
                                                    value={newApplicant.jobId || "none"}
                                                    onValueChange={(value) => setNewApplicant({ ...newApplicant, jobId: value === "none" ? "" : value })}
                                                >
                                                    <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                                        <SelectValue placeholder="Select Job (Optional)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        {jobs.map((job) => (
                                                            <SelectItem key={job.id} value={job.id}>
                                                                {job.title}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-bold text-slate-700 px-1">Years of Experience</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="1"
                                                        className="rounded-xl border-slate-200 h-12"
                                                        value={newApplicant.yearsOfExperience || ''}
                                                        onChange={e => setNewApplicant({ ...newApplicant, yearsOfExperience: parseInt(e.target.value) || 0 })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-bold text-slate-700 px-1">Current Salary</Label>
                                                    <Input
                                                        placeholder="70k"
                                                        className="rounded-xl border-slate-200 h-12"
                                                        value={newApplicant.currentSalary}
                                                        onChange={e => setNewApplicant({ ...newApplicant, currentSalary: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-bold text-slate-700 px-1">Expected Salary</Label>
                                                    <Input
                                                        placeholder="80-90k"
                                                        className="rounded-xl border-slate-200 h-12"
                                                        value={newApplicant.expectedSalary}
                                                        onChange={e => setNewApplicant({ ...newApplicant, expectedSalary: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">Notice Period</Label>
                                                <Input
                                                    placeholder="I can start Immediately."
                                                    className="rounded-xl border-slate-200 h-12"
                                                    value={newApplicant.noticePeriod}
                                                    onChange={e => setNewApplicant({ ...newApplicant, noticePeriod: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-4">Documents & Links</h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">Resume URL</Label>
                                                <Input
                                                    placeholder="https://example.com/resume.pdf"
                                                    className="rounded-xl border-slate-200 h-12"
                                                    value={newApplicant.resumeUrl}
                                                    onChange={e => setNewApplicant({ ...newApplicant, resumeUrl: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">LinkedIn Profile</Label>
                                                <Input
                                                    placeholder="https://linkedin.com/in/username"
                                                    className="rounded-xl border-slate-200 h-12"
                                                    value={newApplicant.linkedinUrl}
                                                    onChange={e => setNewApplicant({ ...newApplicant, linkedinUrl: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-4">Application Status</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">Current Status</Label>
                                                <Select
                                                    value={newApplicant.status}
                                                    onValueChange={(value: any) => setNewApplicant({ ...newApplicant, status: value })}
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
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">Applied Date</Label>
                                                <Input
                                                    type="date"
                                                    className="rounded-xl border-slate-200 h-12"
                                                    value={newApplicant.appliedDate}
                                                    onChange={e => setNewApplicant({ ...newApplicant, appliedDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsAddOpen(false)}
                                            className="flex-1 rounded-xl h-12 font-bold"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 font-bold"
                                        >
                                            {loading ? 'Adding...' : 'Add Applicant'}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {filteredApplicants.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                                <Users className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">No applicants found</h3>
                            <p className="text-slate-500 mb-6">
                                {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first applicant'}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="font-extrabold text-slate-700">Name</TableHead>
                                    <TableHead className="font-extrabold text-slate-700">Position</TableHead>
                                    <TableHead className="font-extrabold text-slate-700">Experience</TableHead>
                                    <TableHead className="font-extrabold text-slate-700">Expected Salary</TableHead>
                                    <TableHead className="font-extrabold text-slate-700">Status</TableHead>
                                    <TableHead className="font-extrabold text-slate-700">Applied Date</TableHead>
                                    <TableHead className="font-extrabold text-slate-700 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredApplicants.map((applicant) => (
                                    <TableRow key={applicant.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`/dashboard/applicants/${applicant.id}`)}>
                                        <TableCell className="font-bold text-blue-600 hover:text-blue-700">{applicant.fullName}</TableCell>
                                        <TableCell className="text-slate-600">{applicant.positionApplied}</TableCell>
                                        <TableCell className="text-slate-600">{applicant.yearsOfExperience} {applicant.yearsOfExperience === 1 ? 'year' : 'years'}</TableCell>
                                        <TableCell className="text-slate-600">{applicant.expectedSalary || 'Not specified'}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(applicant.status)}`}>
                                                {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-slate-600">{new Date(applicant.appliedDate).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDelete(applicant.id, applicant.fullName)
                                                }}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100">
                        <p className="text-sm text-slate-500 font-medium">
                            {filteredApplicants.length} {filteredApplicants.length === 1 ? 'applicant' : 'applicants'}
                        </p>
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}
