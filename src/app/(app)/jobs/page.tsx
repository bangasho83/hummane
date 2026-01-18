'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, FileText, Search, Briefcase, Pencil } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function JobsPage() {
    const router = useRouter()
    const { jobs, currentCompany, deleteJob } = useApp()
    const [searchTerm, setSearchTerm] = useState('')

    const [departmentFilter, setDepartmentFilter] = useState('all')
    const [roleFilter, setRoleFilter] = useState('all')

    const departmentNames = useMemo(() => {
        const unique = [...new Set(jobs.map(job => job.departmentName).filter(Boolean) as string[])]
        return unique.sort()
    }, [jobs])

    const roleNames = useMemo(() => {
        const unique = [...new Set(jobs.map(job => job.roleName).filter(Boolean) as string[])]
        return unique.sort()
    }, [jobs])

    const filteredJobs = jobs.filter(job => {
        const matchesSearch =
            job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.experience?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesDepartment = departmentFilter === 'all' || job.departmentName === departmentFilter
        const matchesRole = roleFilter === 'all' || job.roleName === roleFilter
        return matchesSearch && matchesDepartment && matchesRole
    })

    const clearFilters = () => {
        setSearchTerm('')
        setDepartmentFilter('all')
        setRoleFilter('all')
    }

    const hasActiveFilters = searchTerm || departmentFilter !== 'all' || roleFilter !== 'all'

    const handleDelete = async (id: string, title: string) => {
        if (confirm(`Are you sure you want to delete ${title}?`)) {
            try {
                await deleteJob(id)
                toast('Job deleted', 'success')
            } catch (error) {
                toast('Failed to delete job', 'error')
            }
        }
    }



    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Jobs
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Manage job openings and hiring opportunities.
                    </p>
                </div>

                <Link href="/jobs/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 px-6 py-6 h-auto">
                        <Plus className="w-5 h-5 mr-2" />
                        Add Job
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder="Search jobs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-11 bg-slate-50 border-slate-100 h-12 rounded-2xl focus-visible:ring-blue-500/20"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                <SelectTrigger className="w-[180px] bg-slate-50 border-slate-100 h-12 rounded-2xl">
                                    <SelectValue placeholder="Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departmentNames.map((deptName) => (
                                        <SelectItem key={deptName} value={deptName}>{deptName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-[180px] bg-slate-50 border-slate-100 h-12 rounded-2xl">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    {roleNames.map((roleName) => (
                                        <SelectItem key={roleName} value={roleName}>{roleName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="text-slate-500 hover:text-red-500 font-bold"
                                >
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {filteredJobs.length === 0 ? (
                    <div className="p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                            <FileText className="w-10 h-10 text-slate-200" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            {searchTerm ? 'No results found' : 'No Jobs Yet'}
                        </h2>
                        <p className="text-slate-500 font-medium max-w-sm">
                            {searchTerm
                                ? `We couldn't find any jobs matching "${searchTerm}".`
                                : 'Add your first job opening to start hiring.'}
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="pl-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Job Title</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Role</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Department</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Type</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Mode</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Salary Range</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Applicants</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Status</TableHead>
                                <TableHead className="text-right pr-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredJobs.map((job) => (
                                <TableRow key={job.id} className="hover:bg-slate-50/50 group border-slate-50">
                                    <TableCell className="pl-8 py-5 font-bold text-slate-900">{job.title}</TableCell>
                                    <TableCell className="text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-slate-400" />
                                            {job.roleName || '—'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {job.departmentName || '—'}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {job.employmentType || '—'}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {job.employmentMode || '—'}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {job.salary.min > 0 || job.salary.max > 0
                                            ? `${currentCompany?.currency || ''} ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`.trim()
                                            : 'Not specified'
                                        }
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        <Link
                                            href={`/applicants?jobId=${job.id}`}
                                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                        >
                                            {job.applicantCount ?? 0}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                            job.status === 'open'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {job.status === 'open' ? 'Open' : 'Closed'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => router.push(`/jobs/${job.id}/edit`)}
                                                className="h-10 w-10 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(job.id, job.title)}
                                                className="h-10 w-10 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    )
}
