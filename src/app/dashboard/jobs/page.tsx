'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Plus, Trash2, FileText, Search, DollarSign, Briefcase } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Job } from '@/types'

export default function JobsPage() {
    const router = useRouter()
    const { jobs, roles, createJob, deleteJob } = useApp()
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [newJob, setNewJob] = useState({
        title: '',
        roleId: '',
        salary: { min: 0, max: 0, currency: 'USD' },
        experience: '',
        status: 'open' as 'open' | 'closed'
    })

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.experience?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newJob.title || !newJob.experience) {
            toast('Please fill in all required fields', 'error')
            return
        }

        setLoading(true)
        try {
            await createJob(newJob)
            setNewJob({
                title: '',
                roleId: '',
                salary: { min: 0, max: 0, currency: 'USD' },
                experience: '',
                status: 'open'
            })
            setIsAddOpen(false)
            toast('Job created successfully', 'success')
        } catch (error) {
            toast('Failed to create job', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = (id: string, title: string) => {
        if (confirm(`Are you sure you want to delete ${title}?`)) {
            deleteJob(id)
            toast('Job deleted', 'success')
        }
    }

    const getRoleTitle = (roleId?: string) => {
        if (!roleId) return 'No role assigned'
        const role = roles.find(r => r.id === roleId)
        return role?.title || 'Unknown role'
    }

    return (
        <DashboardShell>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Open Jobs
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Manage job openings and hiring opportunities.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search jobs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 rounded-xl border-slate-200 h-11"
                            />
                        </div>

                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 px-6 py-6 h-auto">
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add Job
                                </Button>
                            </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-3xl bg-white border-slate-200">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-slate-900">Add New Job</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAdd} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 px-1">Job Title *</Label>
                                    <Input
                                        placeholder="e.g. Senior Software Engineer"
                                        className="rounded-xl border-slate-200 h-12"
                                        value={newJob.title}
                                        onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 px-1">Role</Label>
                                    <Select
                                        value={newJob.roleId || "none"}
                                        onValueChange={(value) => setNewJob({ ...newJob, roleId: value === "none" ? "" : value })}
                                    >
                                        <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {roles.map((role) => (
                                                <SelectItem key={role.id} value={role.id}>
                                                    {role.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 px-1">Min Salary</Label>
                                        <Input
                                            type="number"
                                            placeholder="50000"
                                            className="rounded-xl border-slate-200 h-12"
                                            value={newJob.salary.min || ''}
                                            onChange={e => setNewJob({
                                                ...newJob,
                                                salary: { ...newJob.salary, min: parseInt(e.target.value) || 0 }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 px-1">Max Salary</Label>
                                        <Input
                                            type="number"
                                            placeholder="80000"
                                            className="rounded-xl border-slate-200 h-12"
                                            value={newJob.salary.max || ''}
                                            onChange={e => setNewJob({
                                                ...newJob,
                                                salary: { ...newJob.salary, max: parseInt(e.target.value) || 0 }
                                            })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 px-1">Experience Required *</Label>
                                    <Input
                                        placeholder="e.g. 3-5 years"
                                        className="rounded-xl border-slate-200 h-12"
                                        value={newJob.experience}
                                        onChange={e => setNewJob({ ...newJob, experience: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 px-1">Status</Label>
                                    <Select
                                        value={newJob.status}
                                        onValueChange={(value: 'open' | 'closed') => setNewJob({ ...newJob, status: value })}
                                    >
                                        <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                        {loading ? 'Creating...' : 'Create Job'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                    </div>

                    {filteredJobs.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                                <FileText className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">No jobs found</h3>
                            <p className="text-slate-500 mb-6">
                                {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first job opening'}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="font-extrabold text-slate-700">Job Title</TableHead>
                                    <TableHead className="font-extrabold text-slate-700">Role</TableHead>
                                    <TableHead className="font-extrabold text-slate-700">Salary Range</TableHead>
                                    <TableHead className="font-extrabold text-slate-700">Experience</TableHead>
                                    <TableHead className="font-extrabold text-slate-700">Status</TableHead>
                                    <TableHead className="font-extrabold text-slate-700 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredJobs.map((job) => (
                                    <TableRow key={job.id} className="hover:bg-slate-50">
                                        <TableCell className="font-bold text-slate-900">{job.title}</TableCell>
                                        <TableCell className="text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="w-4 h-4 text-slate-400" />
                                                {getRoleTitle(job.roleId)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-slate-400" />
                                                {job.salary.min > 0 || job.salary.max > 0
                                                    ? `${job.salary.currency} ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`
                                                    : 'Not specified'
                                                }
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600">{job.experience}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                job.status === 'open'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {job.status === 'open' ? 'Open' : 'Closed'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(job.id, job.title)}
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
                </div>
            </div>
        </DashboardShell>
    )
}

