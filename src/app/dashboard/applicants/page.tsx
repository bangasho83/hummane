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
    resumeFile: undefined,
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
                            <form
                                onSubmit={handleAdd}
                                className="space-y-6 py-4"
                            >
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
                                            <Select
                                                value={newApplicant.positionApplied || "none"}
                                                onValueChange={(value) => setNewApplicant({ ...newApplicant, positionApplied: value === "none" ? "" : value })}
                                            >
                                                <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                                    <SelectValue placeholder="Select job title" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Select</SelectItem>
                                                    {jobs.map((job) => (
                                                        <SelectItem key={job.id} value={job.title}>
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
                                            <Label className="text-sm font-bold text-slate-700 px-1">Resume (PDF, Image, DOC)</Label>
                                            <Input
                                                type="file"
                                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                                className="rounded-xl border-slate-200 h-12"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (!file) {
                                                        setNewApplicant({ ...newApplicant, resumeFile: undefined })
                                                        return
                                                    }
                                                    const reader = new FileReader()
                                                    reader.onload = () => {
                                                        setNewApplicant({
                                                            ...newApplicant,
                                                            resumeFile: {
                                                                name: file.name,
                                                                type: file.type,
                                                                dataUrl: reader.result as string
                                                            }
                                                        })
                                                    }
                                                    reader.readAsDataURL(file)
                                                }}
                                            />
                                            {newApplicant.resumeFile && (
                                                <p className="text-xs text-slate-500 px-1">Selected: {newApplicant.resumeFile.name}</p>
                                            )}
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

                <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-100">
                        <div className="relative flex-1 group max-w-md">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Search applicants..."
                                className="pl-11 bg-slate-50 border-slate-100 h-12 rounded-2xl focus-visible:ring-blue-500/20"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {filteredApplicants.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                                <Users className="w-10 h-10 text-slate-200" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                {searchTerm ? 'No results found' : 'No Applicants Yet'}
                            </h2>
                            <p className="text-slate-500 font-medium max-w-sm">
                                {searchTerm ? `We couldn't find any applicants matching "${searchTerm}".` : 'Add your first applicant to start tracking candidates.'}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="pl-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Name</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Position</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Experience</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Expected Salary</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Status</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Applied Date</TableHead>
                                    <TableHead className="text-right pr-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredApplicants.map((applicant) => (
                                    <TableRow key={applicant.id} className="hover:bg-slate-50/50 group border-slate-50" onClick={() => router.push(`/dashboard/applicants/${applicant.id}`)}>
                                        <TableCell className="pl-8 py-5 font-bold text-blue-600 hover:text-blue-700">{applicant.fullName}</TableCell>
                                        <TableCell className="text-slate-600">{applicant.positionApplied}</TableCell>
                                        <TableCell className="text-slate-600">{applicant.yearsOfExperience} {applicant.yearsOfExperience === 1 ? 'year' : 'years'}</TableCell>
                                        <TableCell className="text-slate-600">{applicant.expectedSalary || 'Not specified'}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(applicant.status)}`}>
                                                {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-slate-600">{new Date(applicant.appliedDate).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right pr-8">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDelete(applicant.id, applicant.fullName)
                                                }}
                                                className="h-10 w-10 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </DashboardShell>
    )
}
