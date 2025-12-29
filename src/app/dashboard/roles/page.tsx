'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Plus, Trash2, Briefcase, Search } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function RolesPage() {
    const router = useRouter()
    const { roles, createRole, deleteRole, employees } = useApp()
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [newRole, setNewRole] = useState({ title: '', description: '' })

    const filteredRoles = roles.filter(role =>
        role.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newRole.title) return

        setLoading(true)
        try {
            await createRole(newRole)
            setNewRole({ title: '', description: '' })
            setIsAddOpen(false)
            toast('Role created successfully', 'success')
        } catch (error) {
            toast('Failed to create role', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = (id: string, title: string) => {
        const hasEmployees = employees.some(emp => emp.roleId === id)
        if (hasEmployees) {
            toast('Cannot delete role assigned to employees', 'error')
            return
        }

        if (confirm(`Are you sure you want to delete ${title}?`)) {
            deleteRole(id)
            toast('Role deleted', 'success')
        }
    }

    return (
        <DashboardShell>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Roles & Job Descriptions
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Define roles and job descriptions for your organization.
                        </p>
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 px-6 py-6 h-auto">
                                <Plus className="w-5 h-5 mr-2" />
                                Add Role
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-3xl bg-white border-slate-200">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-slate-900">Add New Role</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAdd} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 px-1">Role Title</Label>
                                    <Input
                                        placeholder="e.g. Senior Software Engineer"
                                        className="rounded-xl border-slate-200 h-12"
                                        value={newRole.title}
                                        onChange={e => setNewRole({ ...newRole, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 px-1">Job Description</Label>
                                    <Textarea
                                        placeholder="Describe the responsibilities and requirements..."
                                        className="rounded-xl border-slate-200 min-h-32"
                                        value={newRole.description}
                                        onChange={e => setNewRole({ ...newRole, description: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl font-bold border-slate-200 h-12 px-6">
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-12 px-6" disabled={loading}>
                                        {loading ? 'Creating...' : 'Create Role'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Search roles..."
                                className="pl-11 bg-slate-50 border-slate-100 h-12 rounded-2xl focus-visible:ring-blue-500/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {filteredRoles.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                                <Briefcase className="w-10 h-10 text-slate-200" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                {searchTerm ? 'No results found' : 'No Roles Yet'}
                            </h2>
                            <p className="text-slate-500 font-medium max-w-sm">
                                {searchTerm ? `We couldn't find any roles matching "${searchTerm}"` : 'Create your first role to define job descriptions for your team.'}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="pl-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Role Title</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Job Description</TableHead>
                                    <TableHead className="text-center py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Employees</TableHead>
                                    <TableHead className="text-right pr-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRoles.map((role) => {
                                    const employeeCount = employees.filter(e => e.roleId === role.id).length
                                    return (
                                        <TableRow key={role.id} className="hover:bg-slate-50/50 group border-slate-50">
                                            <TableCell className="pl-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                        <Briefcase className="w-5 h-5" />
                                                    </div>
                                                    <span className="font-bold text-slate-900 text-base">{role.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm text-slate-500 font-medium max-w-md line-clamp-2">
                                                    {role.description || 'No description provided.'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-sm font-bold text-slate-600">
                                                    {employeeCount}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                    onClick={() => handleDelete(role.id, role.title)}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                    <div className="p-8 border-t border-slate-50 bg-slate-50/30">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {filteredRoles.length} {filteredRoles.length === 1 ? 'Role' : 'Roles'} Defined
                        </p>
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}


