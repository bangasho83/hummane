'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import { DOCUMENT_KINDS, EMPLOYMENT_TYPES } from '@/types'
import type { Employee, EmployeeDocument, DocumentKind, EmployeeApi, EmploymentType } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { uploadFileToStorage, uploadProfilePicture } from '@/lib/firebase/storage'

const API_URL = 'https://hummane-api.vercel.app'

export default function EmployeeProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { employees, currentCompany, addDocument, deleteDocument, getDocuments, apiAccessToken, roles, refreshEmployees } = useApp()
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [docs, setDocs] = useState<EmployeeDocument[]>([])
    const [isDocDialogOpen, setIsDocDialogOpen] = useState(false)
    const [docType, setDocType] = useState<DocumentKind>(DOCUMENT_KINDS[0])
    const [docName, setDocName] = useState('')
    const [docFile, setDocFile] = useState<File | null>(null)
    const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoUploading, setPhotoUploading] = useState(false)
    const [isEmploymentDialogOpen, setIsEmploymentDialogOpen] = useState(false)
    const [employmentSaving, setEmploymentSaving] = useState(false)
    const [employmentRoleId, setEmploymentRoleId] = useState('')
    const [employmentRoleName, setEmploymentRoleName] = useState('')
    const [employmentRoleQuery, setEmploymentRoleQuery] = useState('')
    const [employmentSalary, setEmploymentSalary] = useState('')
    const [employmentType, setEmploymentType] = useState<EmploymentType>(EMPLOYMENT_TYPES[1])
    const [employmentDate, setEmploymentDate] = useState('')
    const [statusHistoryItems, setStatusHistoryItems] = useState<Array<Record<string, unknown>>>([])
    const [statusHistoryOriginal, setStatusHistoryOriginal] = useState('[]')
    const [statusHistorySaving, setStatusHistorySaving] = useState(false)
    const employeeId = params.id as string

    useEffect(() => {
        const emp = employees.find(e => e.id === employeeId)
        if (!emp && employees.length > 0) {
            toast('Employee not found', 'error')
            router.push('/team')
        } else {
            setEmployee(emp || null)
        }
    }, [employees, employeeId, router])

    useEffect(() => {
        let isActive = true

        const loadDocuments = async () => {
            if (!employee) {
                setDocs([])
                return
            }
            const list = await getDocuments(employee.id)
            if (isActive) {
                setDocs(list)
            }
        }

        void loadDocuments()
        return () => {
            isActive = false
        }
    }, [employee?.id])

    const filteredEmploymentRoles = useMemo(() => {
        const query = employmentRoleQuery.trim().toLowerCase()
        if (!query) return roles
        return roles.filter((role) => role.title.toLowerCase().includes(query))
    }, [roles, employmentRoleQuery])

    const openEmploymentEditDialog = () => {
        if (!employee) return
        setEmploymentRoleId(employee.roleId || '')
        setEmploymentRoleName(employee.roleName || employee.position || '')
        setEmploymentRoleQuery('')
        setEmploymentSalary(String(employee.salary ?? ''))
        setEmploymentType((employee.employmentType || EMPLOYMENT_TYPES[1]) as EmploymentType)
        setEmploymentDate((employee.startDate || '').split('T')[0] || '')
        setIsEmploymentDialogOpen(true)
    }

    const handleEmploymentSave = async () => {
        if (!employee) return
        if (!apiAccessToken) {
            toast('Not authenticated', 'error')
            return
        }
        if (!employmentRoleId || !employmentRoleName.trim() || !employmentSalary || !employmentType || !employmentDate) {
            toast('Please fill all employment fields', 'error')
            return
        }
        const salaryNumber = Number(employmentSalary)
        if (!Number.isFinite(salaryNumber) || salaryNumber < 0) {
            toast('Salary must be a valid number', 'error')
            return
        }
        setEmploymentSaving(true)
        try {
            const payload = {
                roleId: employmentRoleId,
                roleName: employmentRoleName.trim(),
                salary: Math.round(salaryNumber),
                employmentType,
                date: employmentDate
            }
            const response = await fetch(`${API_URL}/employees/${encodeURIComponent(employee.id)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiAccessToken}`
                },
                body: JSON.stringify(payload)
            })
            if (!response.ok) {
                const message = await response.text().catch(() => '')
                throw new Error(message || 'Failed to update employment record')
            }
            await refreshEmployees()
            setEmployee((prev) => prev ? {
                ...prev,
                roleId: employmentRoleId,
                roleName: employmentRoleName.trim(),
                salary: Math.round(salaryNumber),
                employmentType,
                startDate: employmentDate
            } : prev)
            setIsEmploymentDialogOpen(false)
            toast('Employment record updated', 'success')
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Failed to update employment record', 'error')
        } finally {
            setEmploymentSaving(false)
        }
    }

    const handleDeleteStatusHistoryItem = (indexToDelete: number) => {
        setStatusHistoryItems((prev) => prev.filter((_, index) => index !== indexToDelete))
    }

    const handleSaveStatusHistory = async () => {
        if (!employee) return
        if (!apiAccessToken) {
            toast('Not authenticated', 'error')
            return
        }

        const statusHistoryPayload = statusHistoryItems.map((entry) => ({
            date: typeof entry.date === 'string' && entry.date.trim()
                ? entry.date
                : (employee.startDate || '').split('T')[0] || '',
            roleId: typeof entry.roleId === 'string' && entry.roleId.trim()
                ? entry.roleId
                : employee.roleId,
            salary: Number.isFinite(Number(entry.salary))
                ? Math.round(Number(entry.salary))
                : Math.round(employee.salary ?? 0),
            roleName: typeof entry.roleName === 'string' && entry.roleName.trim()
                ? entry.roleName
                : (employee.roleName || employee.position || ''),
            employmentType: typeof entry.employmentType === 'string' && entry.employmentType.trim()
                ? entry.employmentType
                : employee.employmentType
        }))

        setStatusHistorySaving(true)
        try {
            const response = await fetch(`${API_URL}/employees/${encodeURIComponent(employee.id)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiAccessToken}`
                },
                body: JSON.stringify({
                    statusHistory: statusHistoryPayload
                })
            })

            if (!response.ok) {
                const message = await response.text().catch(() => '')
                throw new Error(message || 'Failed to update status history')
            }

            await refreshEmployees()
            setStatusHistoryItems(statusHistoryPayload)
            setStatusHistoryOriginal(JSON.stringify(statusHistoryPayload))
            setEmployee((prev) => prev ? {
                ...prev,
                status_history: statusHistoryPayload,
                statusHistory: statusHistoryPayload
            } : prev)
            toast('Status history updated', 'success')
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Failed to update status history', 'error')
        } finally {
            setStatusHistorySaving(false)
        }
    }


    const handleDocUpload = async () => {
        if (!docName.trim()) {
            toast('Please enter a document name', 'error')
            return
        }
        if (!docFile) {
            toast('Please select a file', 'error')
            return
        }
        try {
            const url = await uploadFileToStorage(docFile, 'team', employeeId)
            const created = await addDocument({
                employeeId,
                name: docName.trim(),
                type: docType,
                dataUrl: url
            })
            setDocs((prev) => [...prev, created])
            setIsDocDialogOpen(false)
            setDocFile(null)
            setDocName('')
            toast('Document uploaded', 'success')
        } catch (error: any) {
            toast(error?.message || 'Failed to upload', 'error')
        }
    }

    const handleDeleteDoc = async (doc: EmployeeDocument) => {
        try {
            await deleteDocument(doc.id)
            setDocs((prev) => prev.filter(item => item.id !== doc.id))
            toast('Document removed', 'success')
        } catch (error: any) {
            toast(error?.message || 'Failed to remove document', 'error')
        }
    }

    const handlePhotoUpload = async () => {
        if (!photoFile || !employee) return
        setPhotoUploading(true)
        try {
            // Use uploadProfilePicture which handles resizing and uploads to team/profile/
            const url = await uploadProfilePicture(photoFile, employeeId)
            // Update employee with new photo URL via API using PUT method
            const response = await fetch(`${API_URL}/employees/${encodeURIComponent(employeeId)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(apiAccessToken ? { Authorization: `Bearer ${apiAccessToken}` } : {})
                },
                body: JSON.stringify({
                    photoUrl: url,
                    companyId: currentCompany?.id
                })
            })
            if (!response.ok) throw new Error('Failed to update profile photo')
            setEmployee({ ...employee, profilePicture: url, photoUrl: url })
            setIsPhotoDialogOpen(false)
            setPhotoFile(null)
            toast('Profile photo updated', 'success')
        } catch (error: any) {
            toast(error?.message || 'Failed to upload photo', 'error')
        } finally {
            setPhotoUploading(false)
        }
    }

    const employmentStatusHistory = useMemo(() => {
        if (!employee) return []
        return (Array.isArray(employee.status_history) && employee.status_history.length > 0
            ? employee.status_history
            : (Array.isArray((employee as EmployeeApi).statusHistory) ? (employee as EmployeeApi).statusHistory : [])) || []
    }, [employee])
    const hasStatusHistoryChanges = JSON.stringify(statusHistoryItems) !== statusHistoryOriginal

    useEffect(() => {
        const normalizedHistory = employmentStatusHistory.map((entry) => ({ ...entry }))
        setStatusHistoryItems(normalizedHistory)
        setStatusHistoryOriginal(JSON.stringify(normalizedHistory))
    }, [employee?.id, employmentStatusHistory])

    if (!employee) {
        return (
            <div className="p-8 text-slate-500">Loading profile...</div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/team')}
                        className="rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{employee.name}</h1>
                        <p className="text-slate-500 font-medium">{employee.roleName || employee.position || '—'} • {employee.departmentName || employee.department || '—'}</p>
                    </div>
                </div>
                <Button
                    asChild
                    className="rounded-xl bg-blue-600 text-white font-bold shadow-blue-500/20"
                >
                    <Link href={`/team/edit/${employee.id}`}>Edit</Link>
                </Button>
            </div>

            <div className="flex gap-2">
                <Button
                    asChild
                    variant="default"
                    className="bg-slate-900 text-white border-slate-900"
                >
                    <Link href={`/team/${employee.id}`}>General Info</Link>
                </Button>
                <Button
                    asChild
                    variant="outline"
                    className="border-slate-200 text-slate-600"
                >
                    <Link href={`/team/${employee.id}/attendance`}>Attendance</Link>
                </Button>
                <Button
                    asChild
                    variant="outline"
                    className="border-slate-200 text-slate-600"
                >
                    <Link href={`/team/${employee.id}/feedback`}>Feedback</Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
                {/* Left Column - Information Sections */}
                <div className="space-y-6">
                    {/* Employment Information */}
                    <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                        <CardContent className="p-6 space-y-4">
                            <p className="text-sm font-bold text-slate-700">Employment Information</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <InfoRow label="Employee ID" value={employee.employeeId} />
                                <InfoRow label="Employment Mode" value={employee.employmentMode || '—'} />
                                <InfoRow label="Department" value={employee.departmentName || employee.department || '—'} />
                                <InfoRow label="Reporting Manager" value={employee.reportingManagerName || employee.reportingManager || '—'} />
                                <InfoRow label="Work Email" value={employee.email} />
                                <InfoRow label="Joining Date" value={formatDate(employee.startDate)} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Personal Information */}
                    <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                        <CardContent className="p-6 space-y-4">
                            <p className="text-sm font-bold text-slate-700">Personal Information</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <InfoRow label="Date of Birth" value={employee.dob ? formatDate(employee.dob) : '—'} />
                                <InfoRow label="Gender" value={employee.gender || '—'} />
                                <InfoRow label="Blood Group" value={(employee as EmployeeApi).personalDetails?.bloodGroup || '—'} />
                                <InfoRow label="National ID / CNIC" value={(employee as EmployeeApi).personalDetails?.nationalId || '—'} />
                                <InfoRow label="Personal Email" value={(employee as EmployeeApi).personalDetails?.personalInfo?.email || '—'} />
                                <InfoRow label="Personal Phone" value={(employee as EmployeeApi).personalDetails?.personalInfo?.number || '—'} />
                                <InfoRow label="Permanent Address" value={(employee as EmployeeApi).personalDetails?.address?.permanentAddress || '—'} />
                                <InfoRow label="Temporary Address" value={(employee as EmployeeApi).personalDetails?.address?.temporaryAddress || '—'} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bank Account */}
                    <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                        <CardContent className="p-6 space-y-4">
                            <p className="text-sm font-bold text-slate-700">Bank Account</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <InfoRow label="Account Title" value={(employee as EmployeeApi).personalDetails?.bankAccount?.title || '—'} />
                                <InfoRow label="Bank Name" value={(employee as EmployeeApi).personalDetails?.bankAccount?.bankName || '—'} />
                                <InfoRow label="Account Number" value={(employee as EmployeeApi).personalDetails?.bankAccount?.accountNumber || '—'} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Emergency Contact */}
                    <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                        <CardContent className="p-6 space-y-4">
                            <p className="text-sm font-bold text-slate-700">Emergency Contact</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <InfoRow label="Contact Name" value={(employee as EmployeeApi).personalDetails?.emergencyContact?.name || '—'} />
                                <InfoRow label="Relationship" value={(employee as EmployeeApi).personalDetails?.emergencyContact?.relation || '—'} />
                                <InfoRow label="Contact Number" value={(employee as EmployeeApi).personalDetails?.emergencyContact?.number || '—'} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Profile Photo & Documents */}
                <div className="space-y-6">
                    {/* Profile Photo */}
                    <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                        <CardContent className="p-6 flex flex-col items-center">
                            <div className="relative group">
                                {employee.profilePicture || employee.photoUrl ? (
                                    <img
                                        src={employee.profilePicture || employee.photoUrl}
                                        alt={employee.name}
                                        className="w-32 h-32 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-4xl border-2 border-slate-100">
                                        {employee.name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                                <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
                                    <DialogTrigger asChild>
                                        <button className="absolute bottom-2 right-2 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md rounded-3xl bg-white border-slate-200">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-bold text-slate-900">Update Profile Photo</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-2">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">Select Photo</Label>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                                                    className="rounded-xl border-slate-200"
                                                />
                                            </div>
                                            {photoFile && (
                                                <div className="flex justify-center">
                                                    <img
                                                        src={URL.createObjectURL(photoFile)}
                                                        alt="Preview"
                                                        className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-100"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex justify-end gap-3">
                                                <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => { setIsPhotoDialogOpen(false); setPhotoFile(null) }}>Cancel</Button>
                                                <Button
                                                    className="rounded-xl bg-blue-600 text-white"
                                                    onClick={handlePhotoUpload}
                                                    disabled={!photoFile || photoUploading}
                                                >
                                                    {photoUploading ? 'Uploading...' : 'Upload'}
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <p className="mt-4 text-lg font-bold text-slate-900">{employee.name}</p>
                            <p className="text-sm text-slate-500">{employee.roleName || employee.position || '—'}</p>
                        </CardContent>
                    </Card>

                    {/* Employment Record */}
                    <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-slate-700">Employment Record</p>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="rounded-xl bg-blue-600 text-white font-bold shadow-blue-500/20"
                                    onClick={openEmploymentEditDialog}
                                >
                                    Edit
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InfoRow label="Employment Type" value={employee.employmentType || '—'} />
                                <InfoRow label="Role" value={employee.roleName || employee.position || '—'} />
                                <InfoRow label="Salary" value={formatCurrency(employee.salary ?? 0, currentCompany?.currency)} />
                            </div>
                            {employmentStatusHistory.length > 0 && (
                                <div className="pt-1 space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wide">Status History</p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="h-8 rounded-lg bg-blue-600 px-3 text-xs text-white"
                                                onClick={handleSaveStatusHistory}
                                                disabled={statusHistorySaving || !hasStatusHistoryChanges}
                                            >
                                                {statusHistorySaving ? 'Saving...' : 'Save'}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {statusHistoryItems.map((entry, index) => {
                                            const employmentType = typeof entry?.employmentType === 'string' && entry.employmentType.trim()
                                                ? entry.employmentType
                                                : '—'
                                            const roleName = typeof entry?.roleName === 'string' && entry.roleName.trim()
                                                ? entry.roleName
                                                : '—'
                                            const salary = Number.isFinite(Number(entry?.salary))
                                                ? formatCurrency(Number(entry?.salary), currentCompany?.currency)
                                                : '—'
                                            const date = typeof entry?.date === 'string' && entry.date
                                                ? formatDate(entry.date)
                                                : '—'
                                            return (
                                                <div key={`${roleName}-${date}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-sm font-semibold text-slate-800">{roleName}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium text-slate-500">{date}</span>
                                                            <button
                                                                type="button"
                                                                aria-label="Delete history item"
                                                                className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                                onClick={() => handleDeleteStatusHistoryItem(index)}
                                                                disabled={statusHistorySaving}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {employmentType} • {salary}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                            <Dialog open={isEmploymentDialogOpen} onOpenChange={setIsEmploymentDialogOpen}>
                                <DialogContent className="sm:max-w-lg rounded-3xl bg-white border-slate-200">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-bold text-slate-900">Edit Employment Record</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700 px-1">Employment Type</Label>
                                            <Select value={employmentType} onValueChange={(value) => setEmploymentType(value as EmploymentType)}>
                                                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                                    <SelectValue placeholder="Select employment type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {EMPLOYMENT_TYPES.map((type) => (
                                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700 px-1">Date</Label>
                                            <Input
                                                type="date"
                                                value={employmentDate}
                                                onChange={(e) => setEmploymentDate(e.target.value)}
                                                className="h-12 rounded-xl border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700 px-1">Role</Label>
                                            <Select
                                                value={employmentRoleId || 'none'}
                                                onValueChange={(value) => {
                                                    const nextRoleId = value === 'none' ? '' : value
                                                    setEmploymentRoleId(nextRoleId)
                                                    const selectedRole = roles.find((role) => role.id === nextRoleId)
                                                    if (selectedRole) {
                                                        setEmploymentRoleName(selectedRole.title)
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-72 overflow-y-auto">
                                                    <div className="p-2 sticky top-0 bg-white z-10 border-b border-slate-100">
                                                        <Input
                                                            value={employmentRoleQuery}
                                                            onChange={(e) => setEmploymentRoleQuery(e.target.value)}
                                                            placeholder="Search roles..."
                                                            className="h-9 rounded-lg"
                                                            onKeyDown={(e) => e.stopPropagation()}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                    <SelectItem value="none">Select</SelectItem>
                                                    {filteredEmploymentRoles.map((role) => (
                                                        <SelectItem key={role.id} value={role.id}>
                                                            {role.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700 px-1">Salary</Label>
                                            <Input
                                                type="number"
                                                step="1"
                                                min="0"
                                                value={employmentSalary}
                                                onChange={(e) => setEmploymentSalary(e.target.value)}
                                                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                                        e.preventDefault()
                                                    }
                                                }}
                                                placeholder="e.g. 125000"
                                                className="h-12 rounded-xl border-slate-200"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-3 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="rounded-xl border-slate-200"
                                                onClick={() => setIsEmploymentDialogOpen(false)}
                                                disabled={employmentSaving}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="button"
                                                className="rounded-xl bg-blue-600 text-white"
                                                onClick={handleEmploymentSave}
                                                disabled={employmentSaving}
                                            >
                                                {employmentSaving ? 'Saving...' : 'Save'}
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Documents</p>
                                    <p className="text-xs text-slate-500">Upload and manage employee documents.</p>
                                </div>
                                <Dialog open={isDocDialogOpen} onOpenChange={setIsDocDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="rounded-xl bg-blue-600 text-white font-bold shadow-blue-500/20">Upload</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-lg rounded-3xl bg-white border-slate-200">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-bold text-slate-900">Upload Document</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-2">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">Document Type</Label>
                                                <Select value={docType} onValueChange={(v) => setDocType(v as DocumentKind)}>
                                                    <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {DOCUMENT_KINDS.map((t) => (
                                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">Document Name</Label>
                                                <Input
                                                    placeholder="e.g. Employment Contract"
                                                    value={docName}
                                                    onChange={(e) => setDocName(e.target.value)}
                                                    className="h-12 rounded-xl border-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">File</Label>
                                                <Input
                                                    type="file"
                                                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                                                    className="rounded-xl border-slate-200"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-3">
                                                <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => setIsDocDialogOpen(false)}>Cancel</Button>
                                                <Button className="rounded-xl bg-blue-600 text-white" onClick={handleDocUpload}>Upload</Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {docs.length === 0 ? (
                                <div className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4">
                                    No documents uploaded yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {docs.map((doc) => (
                                        <div key={doc.id} className="border border-slate-100 rounded-2xl bg-slate-50 p-4 flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-slate-500 font-medium">{doc.type}</p>
                                                    <p className="text-sm font-bold text-slate-900">{doc.name}</p>
                                                </div>
                                                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteDoc(doc)}>Delete</Button>
                                            </div>
                                            <a
                                                href={doc.dataUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 font-semibold hover:underline"
                                            >
                                                View file
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>


        </div>
    )
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-semibold text-slate-800">{value}</p>
        </div>
    )
}
