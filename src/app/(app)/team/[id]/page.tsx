'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import { DOCUMENT_KINDS } from '@/types'
import type { Employee, EmployeeDocument, DocumentKind, EmployeeApi } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { ArrowLeft, Pencil } from 'lucide-react'
import Link from 'next/link'
import { uploadFileToStorage, uploadProfilePicture } from '@/lib/firebase/storage'

const API_URL = 'https://hummane-api.vercel.app'

export default function EmployeeProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { employees, currentCompany, addDocument, deleteDocument, getDocuments, apiAccessToken } = useApp()
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [docs, setDocs] = useState<EmployeeDocument[]>([])
    const [isDocDialogOpen, setIsDocDialogOpen] = useState(false)
    const [docType, setDocType] = useState<DocumentKind>(DOCUMENT_KINDS[0])
    const [docName, setDocName] = useState('')
    const [docFile, setDocFile] = useState<File | null>(null)
    const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoUploading, setPhotoUploading] = useState(false)
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
                                <InfoRow label="Work Email" value={employee.email} />
                                <InfoRow label="Department" value={employee.departmentName || employee.department || '—'} />
                                <InfoRow label="Role" value={employee.roleName || employee.position || '—'} />
                                <InfoRow label="Reporting Manager" value={employee.reportingManagerName || employee.reportingManager || '—'} />
                                <InfoRow label="Employment Type" value={employee.employmentType} />
                                <InfoRow label="Employment Mode" value={employee.employmentMode || '—'} />
                                <InfoRow label="Joining Date" value={formatDate(employee.startDate)} />
                                <InfoRow label="Monthly Salary" value={formatCurrency(employee.salary ?? 0, currentCompany?.currency)} />
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
