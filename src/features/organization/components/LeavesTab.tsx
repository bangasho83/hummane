'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/lib/context/AppContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, Leaf, Search, Pencil } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { EMPLOYMENT_TYPES, LEAVE_UNITS, type EmploymentType, type LeaveType, type LeaveUnit } from '@/types'

type LeaveFormState = {
    name: string
    code: string
    unit: LeaveUnit
    quota: string
    employmentType: EmploymentType
}

const getDefaultLeaveForm = (): LeaveFormState => ({
    name: '',
    code: '',
    unit: LEAVE_UNITS[0],
    quota: '0',
    employmentType: EMPLOYMENT_TYPES[1]
})

export function LeavesTab() {
    const { leaveTypes, createLeaveType, updateLeaveType, deleteLeaveType } = useApp()
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [form, setForm] = useState<LeaveFormState>(getDefaultLeaveForm)
    const [editForm, setEditForm] = useState<LeaveFormState>(getDefaultLeaveForm)
    const [editing, setEditing] = useState<LeaveType | null>(null)
    const [loading, setLoading] = useState(false)
    const [editLoading, setEditLoading] = useState(false)

    const filtered = useMemo(() => {
        return leaveTypes.filter(lt =>
            lt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lt.code.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [leaveTypes, searchTerm])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await createLeaveType({
                name: form.name,
                code: form.code,
                unit: form.unit,
                quota: parseFloat(form.quota) || 0,
                employmentType: form.employmentType
            })
            toast('Leave type added', 'success')
            setForm(getDefaultLeaveForm())
            setIsAddOpen(false)
        } catch (error: any) {
            toast(error?.message || 'Failed to add leave type', 'error')
        } finally {
            setLoading(false)
        }
    }

    const openEdit = (lt: LeaveType) => {
        setEditing(lt)
        setEditForm({
            name: lt.name,
            code: lt.code,
            unit: lt.unit,
            quota: String(lt.quota),
            employmentType: lt.employmentType
        })
        setIsEditOpen(true)
    }

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editing) return
        setEditLoading(true)
        try {
            await updateLeaveType(editing.id, {
                name: editForm.name,
                code: editForm.code,
                unit: editForm.unit,
                quota: parseFloat(editForm.quota) || 0,
                employmentType: editForm.employmentType
            })
            toast('Leave type updated', 'success')
            setIsEditOpen(false)
        } catch (error: any) {
            toast(error?.message || 'Failed to update leave type', 'error')
        } finally {
            setEditLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('Delete this leave type?')) {
            try {
                await deleteLeaveType(id)
                toast('Leave type deleted', 'success')
            } catch (error: any) {
                toast(error?.message || 'Failed to delete leave type', 'error')
            }
        }
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Leave Types
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Define allowances and units for each leave category.
                    </p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 px-6 py-6 h-auto">
                            <Plus className="w-5 h-5 mr-2" />
                            Add Leave Type
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl rounded-3xl bg-white border-slate-200">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-slate-900">Add Leave Type</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 px-1">Leave Name</Label>
                                    <Input
                                        placeholder="Casual"
                                        className="rounded-xl border-slate-200 h-12"
                                        value={form.name}
                                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 px-1">Leave Code</Label>
                                    <Input
                                        placeholder="C1"
                                        className="rounded-xl border-slate-200 h-12 uppercase"
                                        value={form.code}
                                        onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 px-1">Units of Measure</Label>
                                    <Select
                                        value={form.unit}
                                        onValueChange={(value) => setForm(prev => ({ ...prev, unit: value as LeaveUnit }))}
                                    >
                                        <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                            <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LEAVE_UNITS.map((unit) => (
                                                <SelectItem key={unit} value={unit}>
                                                    {unit}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 px-1">Employment Type</Label>
                                    <Select
                                        value={form.employmentType}
                                        onValueChange={(value) => setForm(prev => ({ ...prev, employmentType: value as EmploymentType }))}
                                    >
                                        <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                            <SelectValue placeholder="Select employment type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EMPLOYMENT_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 px-1">Quota (per year)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        className="rounded-xl border-slate-200 h-12"
                                        value={form.quota}
                                        onChange={(e) => setForm(prev => ({ ...prev, quota: e.target.value }))}
                                        placeholder="e.g. 10"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl font-bold border-slate-200 h-12 px-6">
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-12 px-6" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Leave Type'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={isEditOpen}
                    onOpenChange={(open) => {
                        setIsEditOpen(open)
                        if (!open) {
                            setEditing(null)
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-xl rounded-3xl bg-white border-slate-200">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-slate-900">Edit Leave Type</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleEdit} className="space-y-4 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 px-1">Leave Name</Label>
                                    <Input
                                        className="rounded-xl border-slate-200 h-12"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 px-1">Leave Code</Label>
                                    <Input
                                        className="rounded-xl border-slate-200 h-12 uppercase"
                                        value={editForm.code}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 px-1">Units of Measure</Label>
                                    <Select
                                        value={editForm.unit}
                                        onValueChange={(value) => setEditForm(prev => ({ ...prev, unit: value as LeaveUnit }))}
                                    >
                                        <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                            <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LEAVE_UNITS.map((unit) => (
                                                <SelectItem key={unit} value={unit}>
                                                    {unit}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 px-1">Employment Type</Label>
                                    <Select
                                        value={editForm.employmentType}
                                        onValueChange={(value) => setEditForm(prev => ({ ...prev, employmentType: value as EmploymentType }))}
                                    >
                                        <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                            <SelectValue placeholder="Select employment type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EMPLOYMENT_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 px-1">Quota (per year)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        className="rounded-xl border-slate-200 h-12"
                                        value={editForm.quota}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, quota: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl font-bold border-slate-200 h-12 px-6">
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-12 px-6" disabled={editLoading}>
                                    {editLoading ? 'Saving...' : 'Save Changes'}
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
                            placeholder="Search leave types..."
                            className="pl-11 bg-slate-50 border-slate-100 h-12 rounded-2xl focus-visible:ring-blue-500/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="pl-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Leave Name</TableHead>
                            <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Code</TableHead>
                            <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Unit</TableHead>
                            <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Employment Type</TableHead>
                            <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Quota</TableHead>
                            <TableHead className="text-right pr-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="p-20 text-center text-slate-500">
                                    No leave types yet. Add your first one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((lt) => (
                                <TableRow key={lt.id} className="hover:bg-slate-50/50 group border-slate-50">
                                    <TableCell className="pl-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                                <Leaf className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-base">{lt.name}</p>
                                                <p className="text-xs text-slate-400 font-medium">Created {new Date(lt.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs font-bold text-slate-600">{lt.code}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium text-slate-500">{lt.unit}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium text-slate-500">{lt.employmentType}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium text-slate-500">{lt.quota}</span>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                onClick={() => openEdit(lt)}
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                onClick={() => handleDelete(lt.id)}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <div className="p-8 border-t border-slate-50 bg-slate-50/30">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {filtered.length} {filtered.length === 1 ? 'Leave Type' : 'Leave Types'} Defined
                    </p>
                </div>
            </div>
        </div>
    )
}
