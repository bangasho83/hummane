'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import { DOCUMENT_KINDS } from '@/types'
import type { Employee, EmployeeDocument, DocumentKind } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { uploadFileToStorage } from '@/lib/firebase/storage'

export default function EmployeeProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { employees, getDocuments, addDocument, deleteDocument, currentCompany } = useApp()
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [docs, setDocs] = useState<EmployeeDocument[]>([])
    const [isDocDialogOpen, setIsDocDialogOpen] = useState(false)
    const [docType, setDocType] = useState<DocumentKind>(DOCUMENT_KINDS[0])
    const [docFile, setDocFile] = useState<File | null>(null)
    const employeeId = params.id as string

    useEffect(() => {
        const emp = employees.find(e => e.id === employeeId)
        if (!emp && employees.length > 0) {
            toast('Employee not found', 'error')
            router.push('/dashboard/team')
        } else {
            setEmployee(emp || null)
        }
    }, [employees, employeeId, router])

    useEffect(() => {
        if (employeeId) {
            setDocs(getDocuments(employeeId))
        }
    }, [employeeId])

    const handleDocUpload = async () => {
        if (!docFile) {
            toast('Please select a file', 'error')
            return
        }
        try {
            const url = await uploadFileToStorage(docFile, 'team', employeeId)
            const saved = addDocument({
                employeeId,
                name: docFile.name,
                type: docType,
                dataUrl: url
            })
            setDocs(prev => [...prev, saved])
            setIsDocDialogOpen(false)
            setDocFile(null)
            toast('Document uploaded', 'success')
        } catch (error: any) {
            toast(error?.message || 'Failed to upload', 'error')
        }
    }

    const handleDeleteDoc = (id: string) => {
        deleteDocument(id)
        setDocs(prev => prev.filter(d => d.id !== id))
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
                        onClick={() => router.push('/dashboard/team')}
                        className="rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{employee.name}</h1>
                        <p className="text-slate-500 font-medium">{employee.position} • {employee.department}</p>
                    </div>
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-blue-100">{employee.employmentType}</Badge>
            </div>

            <div className="flex gap-2">
                <Button
                    asChild
                    variant="default"
                    className="bg-slate-900 text-white border-slate-900"
                >
                    <Link href={`/dashboard/team/${employee.id}`}>General Info</Link>
                </Button>
                <Button
                    asChild
                    variant="outline"
                    className="border-slate-200 text-slate-600"
                >
                    <Link href={`/dashboard/team/${employee.id}/attendance`}>Attendance</Link>
                </Button>
                <Button
                    asChild
                    variant="outline"
                    className="border-slate-200 text-slate-600"
                >
                    <Link href={`/dashboard/team/${employee.id}/feedback`}>Feedback</Link>
                </Button>
            </div>

            <div className="space-y-6">
                <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                    <CardContent className="p-6 space-y-4">
                        <p className="text-sm font-bold text-slate-700">Basic Information</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoRow label="Employee ID" value={employee.employeeId} />
                            <InfoRow label="Email" value={employee.email} />
                            <InfoRow label="Department" value={employee.department} />
                            <InfoRow label="Position" value={employee.position} />
                            <InfoRow label="Manager" value={employee.reportingManager} />
                            <InfoRow label="Employment Type" value={employee.employmentType} />
                            <InfoRow label="Joining Date" value={formatDate(employee.startDate)} />
                            <InfoRow label="Gender" value={employee.gender} />
                            <InfoRow label="Monthly Salary" value={formatCurrency(employee.salary, currentCompany?.currency)} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-700">Documents</p>
                                <p className="text-xs text-slate-500">Upload and manage employee documents.</p>
                            </div>
                            <Dialog open={isDocDialogOpen} onOpenChange={setIsDocDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="rounded-xl bg-blue-600 text-white font-bold shadow-blue-500/20">Upload Document</Button>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {docs.map((doc) => (
                                    <div key={doc.id} className="border border-slate-100 rounded-2xl bg-slate-50 p-4 flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{doc.name}</p>
                                                <p className="text-xs text-slate-500">{doc.type}</p>
                                            </div>
                                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteDoc(doc.id)}>Delete</Button>
                                        </div>
                                        <a
                                            href={doc.dataUrl}
                                            download={doc.name}
                                            className="text-sm text-blue-600 font-semibold hover:underline"
                                        >
                                            Download
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
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
