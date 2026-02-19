'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { BLOOD_GROUP_OPTIONS, EMPLOYMENT_MODES, EMPLOYMENT_TYPES, GENDER_OPTIONS, type BloodGroup, type Employee, type EmployeeApi, type EmployeePersonalDetails, type EmploymentMode, type EmploymentType, type Gender } from '@/types'
import { useApp } from '@/lib/context/AppContext'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { employeeSchema } from '@/lib/validation/schemas'
import { z } from 'zod'
import { uploadProfilePicture } from '@/lib/firebase/storage'
import { Camera, X } from 'lucide-react'

export interface PhotoUploadDebugInfo {
    curl: string
    response: string
    status: number
}

interface EmployeeFormProps {
    employee?: EmployeeApi | null
    onSubmit: (data: Omit<Employee, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => Promise<void>
    onCancel: () => void
    submitLabel?: string
    loading?: boolean
    showEmploymentSection?: boolean
    onRoleChange?: (roleId: string) => void
    onPhotoUploadDebug?: (info: PhotoUploadDebugInfo) => void
}

type EmployeeFormState = {
    // Basic Info
    employeeId: string
    name: string
    email: string
    departmentId: string
    roleId: string
    startDate: string
    employmentType: EmploymentType
    employmentMode: EmploymentMode
    reportingManager: string
    gender: Gender
    salary: string
    // Profile photo
    profilePicture: string
    // Date fields
    dateOfBirth: string
    jobConfirmationDate: string
    // Additional Info fields (will be structured as JSON)
    personalEmail: string
    personalContact: string
    nationalId: string
    permanentAddress: string
    temporaryAddress: string
    emergencyContactRelation: string
    emergencyContactName: string
    emergencyContactNumber: string
    bloodGroup: BloodGroup | ''
    bankAccountTitle: string
    bankName: string
    accountNumber: string
}

const getDefaultFormData = (): EmployeeFormState => ({
    employeeId: '',
    name: '',
    email: '',
    departmentId: '',
    roleId: '',
    startDate: '',
    employmentType: EMPLOYMENT_TYPES[1],
    employmentMode: EMPLOYMENT_MODES[0],
    reportingManager: 'self',
    gender: GENDER_OPTIONS[0],
    salary: '',
    // Profile photo
    profilePicture: '',
    // Date fields
    dateOfBirth: '',
    jobConfirmationDate: '',
    // Additional Info fields
    personalEmail: '',
    personalContact: '',
    nationalId: '',
    permanentAddress: '',
    temporaryAddress: '',
    emergencyContactRelation: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    bloodGroup: '',
    bankAccountTitle: '',
    bankName: '',
    accountNumber: ''
})

const toDateInputValue = (value?: string | null) => {
    if (!value) return ''
    return value.split('T')[0] || ''
}

const normalizeEnumValue = <T extends readonly string[]>(
    value: string | null | undefined,
    options: T
): T[number] | undefined => {
    if (!value) return undefined
    const trimmed = value.trim()
    if (!trimmed) return undefined
    const normalizeKey = (input: string) =>
        input
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim()
    const normalizedValue = normalizeKey(trimmed)
    return options.find(option => normalizeKey(option) === normalizedValue)
}

export function EmployeeForm({
    employee,
    onSubmit,
    onCancel,
    submitLabel = 'Save Employee',
    loading = false,
    showEmploymentSection = true,
    onRoleChange,
    onPhotoUploadDebug
}: EmployeeFormProps) {
    const { departments, roles, employees, apiAccessToken, currentCompany } = useApp()
    const [formData, setFormData] = useState<EmployeeFormState>(getDefaultFormData)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const [departmentQuery, setDepartmentQuery] = useState('')
    const [roleQuery, setRoleQuery] = useState('')
    const [managerQuery, setManagerQuery] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
        console.log('EmployeeForm useEffect triggered - employee:', !!employee, 'deps.length:', departments.length, roles.length, employees.length)
        if (employee) {
            const departmentIdFromName = employee.departmentName || employee.department
                ? departments.find(dept => dept.name === (employee.departmentName || employee.department))?.id
                : undefined
            const roleFromName = employee.roleName
                ? roles.find(role => role.title === employee.roleName)?.id
                : undefined

            const rawEmploymentType = employee.employmentType?.trim() || ''
            const rawEmploymentMode = employee.employmentMode?.trim() || ''
            const rawGender = employee.gender?.trim() || ''

            const normalizedEmploymentType = normalizeEnumValue(rawEmploymentType || null, EMPLOYMENT_TYPES)
            const normalizedEmploymentMode = normalizeEnumValue(rawEmploymentMode || null, EMPLOYMENT_MODES)
            const normalizedGender = normalizeEnumValue(rawGender || null, GENDER_OPTIONS)

            const employmentTypeValue = normalizedEmploymentType || rawEmploymentType || EMPLOYMENT_TYPES[1]
            const employmentModeValue = normalizedEmploymentMode || rawEmploymentMode || EMPLOYMENT_MODES[0]
            const genderValue = normalizedGender || rawGender || GENDER_OPTIONS[0]

            const managerId = employee.reportingManagerId?.trim()
            const reportingManagerFromName = employee.reportingManager
                ? employees.find(e => e.name === employee.reportingManager)?.id
                : undefined
            const reportingManagerValue = managerId && managerId !== employee.id
                ? managerId
                : reportingManagerFromName || 'self'

            // Extract from personalDetails if available, fallback to legacy fields
            const personalDetails = employee.personalDetails || {}

            // Debug: log what we're reading from employee
            console.log('EmployeeForm - employee.personalDetails:', employee.personalDetails)
            console.log('EmployeeForm - personalDetails.bloodGroup:', personalDetails.bloodGroup)
            console.log('EmployeeForm - employee.bloodGroup:', employee.bloodGroup)

            setFormData({
                employeeId: employee.employeeId || '',
                name: employee.name || '',
                email: employee.email || '',
                departmentId: employee.departmentId?.trim() || departmentIdFromName?.trim() || '',
                roleId: employee.roleId?.trim() || roleFromName?.trim() || '',
                startDate: toDateInputValue(employee.startDate),
                employmentType: employmentTypeValue as EmploymentType,
                employmentMode: employmentModeValue as EmploymentMode,
                reportingManager: reportingManagerValue,
                gender: genderValue as Gender,
                salary: employee.salary != null ? employee.salary.toString() : '',
                // Profile photo - use photoUrl from API if available, fallback to profilePicture
                profilePicture: employee.photoUrl || employee.profilePicture || '',
                // Date fields - prefer dob from API, fallback to dateOfBirth
                dateOfBirth: toDateInputValue(employee.dob || employee.dateOfBirth),
                jobConfirmationDate: toDateInputValue(employee.jobConfirmationDate),
                // Personal Details - prefer personalDetails JSON, fallback to legacy fields
                personalEmail: personalDetails.personalInfo?.email || employee.personalEmail || '',
                personalContact: personalDetails.personalInfo?.number || employee.personalContact || '',
                nationalId: personalDetails.nationalId || employee.cnicNumber || '',
                permanentAddress: personalDetails.address?.permanentAddress || employee.permanentAddress || '',
                temporaryAddress: personalDetails.address?.temporaryAddress || employee.temporaryAddress || '',
                emergencyContactRelation: personalDetails.emergencyContact?.relation || '',
                emergencyContactName: personalDetails.emergencyContact?.name || employee.emergencyContactName || '',
                emergencyContactNumber: personalDetails.emergencyContact?.number || employee.emergencyContactNumber || '',
                bloodGroup: (personalDetails.bloodGroup || employee.bloodGroup) as BloodGroup || '',
                bankAccountTitle: personalDetails.bankAccount?.title || employee.bankAccountTitle || '',
                bankName: personalDetails.bankAccount?.bankName || employee.bankName || '',
                accountNumber: personalDetails.bankAccount?.accountNumber || employee.accountNumber || ''
            })

            // Debug: log the bloodGroup value that was set
            const bloodGroupValue = (personalDetails.bloodGroup || employee.bloodGroup) as BloodGroup || ''
            console.log('EmployeeForm - bloodGroup value being set:', bloodGroupValue, 'type:', typeof bloodGroupValue)
        } else {
            console.log('EmployeeForm - NO EMPLOYEE, resetting to default!')
            setFormData(getDefaultFormData())
        }
        setErrors({})
    }, [employee, employees, departments, roles])

    useEffect(() => {
        if (!employee) return
        const managerId = employee.reportingManagerId?.trim()
        if (!managerId || managerId === employee.id) return
        setFormData((prev) => {
            if (prev.reportingManager === managerId) return prev
            return { ...prev, reportingManager: managerId }
        })
    }, [employee?.id, employee?.reportingManagerId, employees.length])

    useEffect(() => {
        if (!employee) return
        const rawEmploymentType = employee.employmentType?.trim() || ''
        const rawEmploymentMode = employee.employmentMode?.trim() || ''
        const rawGender = employee.gender?.trim() || ''
        const normalizedEmploymentType = normalizeEnumValue(rawEmploymentType || null, EMPLOYMENT_TYPES)
        const normalizedEmploymentMode = normalizeEnumValue(rawEmploymentMode || null, EMPLOYMENT_MODES)
        const normalizedGender = normalizeEnumValue(rawGender || null, GENDER_OPTIONS)
        const employmentTypeValue = normalizedEmploymentType || rawEmploymentType
        const employmentModeValue = normalizedEmploymentMode || rawEmploymentMode
        const genderValue = normalizedGender || rawGender

        setFormData((prev) => {
            if (!employmentTypeValue && !employmentModeValue && !genderValue) return prev
            let changed = false
            const next = { ...prev }
            if (employmentTypeValue && prev.employmentType !== employmentTypeValue) {
                next.employmentType = employmentTypeValue as EmploymentType
                changed = true
            }
            if (employmentModeValue && prev.employmentMode !== employmentModeValue) {
                next.employmentMode = employmentModeValue as EmploymentMode
                changed = true
            }
            if (genderValue && prev.gender !== genderValue) {
                next.gender = genderValue as Gender
                changed = true
            }
            return changed ? next : prev
        })
    }, [employee?.id, employee?.employmentType, employee?.employmentMode, employee?.gender])

    const managerOptions = employees.filter(emp => !employee || emp.id !== employee.id)
    const reportingManagerId = employee?.reportingManagerId?.trim()
    const reportingManagerEntry = reportingManagerId
        ? managerOptions.find(emp => emp.id === reportingManagerId)
        : undefined
    const showMissingManager = reportingManagerId
        && reportingManagerId !== employee?.id
        && !reportingManagerEntry
    const missingManagerLabel = reportingManagerId
        ? `${employee?.reportingManager?.trim() || 'Unknown'} [${reportingManagerEntry?.employeeId || 'Unknown'}] ${reportingManagerId}`
        : ''
    const normalizedEmploymentTypeValue = normalizeEnumValue(formData.employmentType as string, EMPLOYMENT_TYPES)
    const normalizedEmploymentModeValue = normalizeEnumValue(formData.employmentMode as string, EMPLOYMENT_MODES)
    const showMissingEmploymentType = Boolean(formData.employmentType && !normalizedEmploymentTypeValue)
    const showMissingEmploymentMode = Boolean(formData.employmentMode && !normalizedEmploymentModeValue)
    const normalizedGenderValue = normalizeEnumValue(formData.gender as string, GENDER_OPTIONS)
    const showMissingGender = Boolean(formData.gender && !normalizedGenderValue)
    const filteredDepartments = useMemo(() => {
        const query = departmentQuery.trim().toLowerCase()
        if (!query) return departments
        return departments.filter((dept) => dept.name.toLowerCase().includes(query))
    }, [departments, departmentQuery])
    const filteredRoles = useMemo(() => {
        const query = roleQuery.trim().toLowerCase()
        if (!query) return roles
        return roles.filter((role) => role.title.toLowerCase().includes(query))
    }, [roles, roleQuery])
    const filteredManagers = useMemo(() => {
        const query = managerQuery.trim().toLowerCase()
        if (!query) return managerOptions
        return managerOptions.filter((emp) => {
            const haystack = `${emp.name} ${emp.employeeId}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [managerOptions, managerQuery])

    useEffect(() => {
        if (onRoleChange) {
            onRoleChange(formData.roleId || '')
        }
    }, [formData.roleId, onRoleChange])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})

        try {
            const managerName = formData.reportingManager === 'self'
                ? formData.name
                : employees.find(emp => emp.id === formData.reportingManager)?.name || formData.name
            const departmentName = departments.find(dept => dept.id === formData.departmentId)?.name
                || employee?.departmentName
                || employee?.department
                || ''
            // Build personalDetails JSON structure (matches API)
            const personalDetails: EmployeePersonalDetails = {}

            // Personal Info
            if (formData.personalEmail || formData.personalContact) {
                personalDetails.personalInfo = {
                    email: formData.personalEmail || undefined,
                    number: formData.personalContact || undefined
                }
            }

            // National ID
            if (formData.nationalId) {
                personalDetails.nationalId = formData.nationalId
            }

            // Address
            if (formData.permanentAddress || formData.temporaryAddress) {
                personalDetails.address = {
                    permanentAddress: formData.permanentAddress || undefined,
                    temporaryAddress: formData.temporaryAddress || undefined
                }
            }

            // Emergency Contact
            if (formData.emergencyContactRelation || formData.emergencyContactName || formData.emergencyContactNumber) {
                personalDetails.emergencyContact = {
                    relation: formData.emergencyContactRelation || undefined,
                    name: formData.emergencyContactName || undefined,
                    number: formData.emergencyContactNumber || undefined
                }
            }

            // Blood Group
            if (formData.bloodGroup) {
                personalDetails.bloodGroup = formData.bloodGroup as BloodGroup
            }

            // Bank Account
            if (formData.bankAccountTitle || formData.bankName || formData.accountNumber) {
                personalDetails.bankAccount = {
                    title: formData.bankAccountTitle || undefined,
                    bankName: formData.bankName || undefined,
                    accountNumber: formData.accountNumber || undefined
                }
            }

            const employeeData = {
                employeeId: formData.employeeId,
                name: formData.name,
                email: formData.email,
                position: employee?.position || '',
                department: departmentName,
                departmentId: formData.departmentId || undefined,
                roleId: formData.roleId,
                startDate: formData.startDate,
                employmentType: formData.employmentType,
                employmentMode: formData.employmentMode,
                reportingManager: managerName,
                gender: formData.gender,
                salary: parseFloat(formData.salary),
                // Profile photo URL - include if already uploaded
                photoUrl: formData.profilePicture || undefined,
                // Date fields - use dob for API
                dob: formData.dateOfBirth || undefined,
                jobConfirmationDate: formData.jobConfirmationDate || undefined,
                // Personal Details as JSON (matches API structure)
                personalDetails: Object.keys(personalDetails).length > 0 ? personalDetails : undefined
            }
            const reportingManagerId = formData.reportingManager === 'self' ? undefined : formData.reportingManager

            // Validate with Zod schema
            const validated = employeeSchema.parse(employeeData)
            await onSubmit({
                ...validated,
                position: validated.position || '',
                reportingManagerId,
                // Include fields that aren't in the schema
                photoUrl: employeeData.photoUrl,
                dob: employeeData.dob,
                jobConfirmationDate: employeeData.jobConfirmationDate,
                personalDetails: employeeData.personalDetails
            })
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Record<string, string> = {}
                error.issues.forEach((err) => {
                    const path = err.path.join('.')
                    fieldErrors[path] = err.message
                })
                setErrors(fieldErrors)
            } else {
                console.error('Form submission error:', error)
            }
        }
    }

    // Debug: log formData.bloodGroup on every render
    console.log('EmployeeForm RENDER - formData.bloodGroup:', formData.bloodGroup)

    const handleChange = <K extends keyof EmployeeFormState>(field: K, value: EmployeeFormState[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
        if (field === 'departmentId' && errors.department) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors.department
                return newErrors
            })
        }
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({ ...prev, profilePicture: 'Please select an image file' }))
            return
        }

        setUploadingPhoto(true)
        try {
            // uploadProfilePicture handles resizing (max 4096px) and size validation (max 5MB)
            const url = await uploadProfilePicture(file, formData.employeeId || 'emp')
            handleChange('profilePicture', url)

            // If editing an existing employee, update photoUrl in database
            if (employee?.id && apiAccessToken && currentCompany) {
                const apiUrl = `https://hummane-api.vercel.app/employees/${encodeURIComponent(employee.id)}`
                const payload = {
                    photoUrl: url,
                    companyId: currentCompany.id
                }

                // Build curl command for debug
                const curlCommand = `curl -X PUT "${apiUrl}" \\
  -H "Authorization: Bearer ${apiAccessToken}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload)}'`

                const response = await fetch(apiUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${apiAccessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                })

                const responseText = await response.text()

                // Call debug callback if provided
                if (onPhotoUploadDebug) {
                    onPhotoUploadDebug({
                        curl: curlCommand,
                        response: responseText,
                        status: response.status
                    })
                }

                if (!response.ok) {
                    console.error('Failed to update employee photo in database')
                }
            }

            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors.profilePicture
                return newErrors
            })
        } catch (error) {
            console.error('Failed to upload photo:', error)
            const message = error instanceof Error ? error.message : 'Failed to upload photo'
            setErrors(prev => ({ ...prev, profilePicture: message }))
        } finally {
            setUploadingPhoto(false)
        }
    }

    const handleRemovePhoto = () => {
        handleChange('profilePicture', '')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const SectionHeader = ({ title }: { title: string }) => (
        <div className="pb-2 mb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
        </div>
    )

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* ═══════════════════════════════════════════════════════════════════════════
                SECTION: Basic Information
            ═══════════════════════════════════════════════════════════════════════════ */}
            <div>
                <SectionHeader title="Basic Information" />
                <div className="flex flex-col-reverse md:flex-row gap-6">
                    {/* Basic Fields */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="employeeId">Employee ID</Label>
                            <Input
                                id="employeeId"
                                placeholder="EMP-00123"
                                value={formData.employeeId}
                                onChange={(e) => handleChange('employeeId', e.target.value)}
                                required
                                className={errors.employeeId ? 'border-red-500' : ''}
                            />
                            {errors.employeeId && <p className="text-xs text-red-600 mt-1">{errors.employeeId}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="Jane Smith"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                required
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                        </div>
                    </div>

                    {/* Profile Picture */}
                    <div className="flex flex-col items-center gap-2">
                        <Label className="text-center">Profile Picture</Label>
                        <div className="relative">
                            <div className="w-28 h-28 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden">
                                {formData.profilePicture ? (
                                    <img
                                        src={formData.profilePicture}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Camera className="w-8 h-8 text-slate-400" />
                                )}
                                {uploadingPhoto && (
                                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                            {formData.profilePicture && (
                                <button
                                    type="button"
                                    onClick={handleRemovePhoto}
                                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="profilePictureInput"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPhoto}
                            className="text-xs"
                        >
                            {formData.profilePicture ? 'Change Photo' : 'Upload Photo'}
                        </Button>
                        {errors.profilePicture && <p className="text-xs text-red-600">{errors.profilePicture}</p>}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                SECTION: Employment Details
            ═══════════════════════════════════════════════════════════════════════════ */}
            {showEmploymentSection && (
                <div>
                    <SectionHeader title="Employment Details" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Work Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="jane@company.com"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            required
                            className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        {departments.length > 0 ? (
                            <>
                                <Select key={`${formData.departmentId}-${departments.length}`} value={formData.departmentId} onValueChange={(value) => handleChange('departmentId', value)}>
                                    <SelectTrigger id="department" className={`rounded-xl border-slate-200 ${errors.department ? 'border-red-500' : ''}`}>
                                        <SelectValue placeholder="Select Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="p-2 sticky top-0 bg-white z-10 border-b border-slate-100">
                                            <Input
                                                value={departmentQuery}
                                                onChange={(e) => setDepartmentQuery(e.target.value)}
                                                placeholder="Search departments..."
                                                className="h-9 rounded-lg"
                                                onKeyDown={(e) => e.stopPropagation()}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        {filteredDepartments.map((dept) => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {errors.department && <p className="text-xs text-red-600 mt-1">{errors.department}</p>}
                            </>
                        ) : (
                            <div className="text-sm p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
                                No departments found. <Link href="/departments" className="text-blue-600 font-bold hover:underline">Create one</Link> first.
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role / Job Description</Label>
                        {roles.length > 0 ? (
                            <>
                                <Select key={`${formData.roleId}-${roles.length}`} value={formData.roleId} onValueChange={(value) => handleChange('roleId', value)}>
                                    <SelectTrigger id="role" className={`rounded-xl border-slate-200 ${errors.roleId ? 'border-red-500' : ''}`}>
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="p-2 sticky top-0 bg-white z-10 border-b border-slate-100">
                                            <Input
                                                value={roleQuery}
                                                onChange={(e) => setRoleQuery(e.target.value)}
                                                placeholder="Search roles..."
                                                className="h-9 rounded-lg"
                                                onKeyDown={(e) => e.stopPropagation()}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        {filteredRoles.map((role) => <SelectItem key={role.id} value={role.id}>{role.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {errors.roleId && <p className="text-xs text-red-600 mt-1">{errors.roleId}</p>}
                            </>
                        ) : (
                            <div className="text-sm p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
                                No roles defined. <Link href="/roles" className="text-blue-600 font-bold hover:underline">Create one</Link>.
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="employmentType">Employment Type</Label>
                        <Select value={formData.employmentType} onValueChange={(value) => handleChange('employmentType', value as EmploymentType)} key={formData.employmentType}>
                            <SelectTrigger id="employmentType" className="rounded-xl border-slate-200">
                                <SelectValue placeholder="Select employment type" />
                            </SelectTrigger>
                            <SelectContent>
                                {showMissingEmploymentType && <SelectItem value={formData.employmentType}>{formData.employmentType}</SelectItem>}
                                {EMPLOYMENT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="employmentMode">Employment Mode</Label>
                        <Select value={formData.employmentMode} onValueChange={(value) => handleChange('employmentMode', value as EmploymentMode)} key={formData.employmentMode}>
                            <SelectTrigger id="employmentMode" className="rounded-xl border-slate-200">
                                <SelectValue placeholder="Select employment mode" />
                            </SelectTrigger>
                            <SelectContent>
                                {showMissingEmploymentMode && <SelectItem value={formData.employmentMode}>{formData.employmentMode}</SelectItem>}
                                {EMPLOYMENT_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="startDate">Joining Date</Label>
                        <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => handleChange('startDate', e.target.value)} required className={errors.startDate ? 'border-red-500' : ''} />
                        {errors.startDate && <p className="text-xs text-red-600 mt-1">{errors.startDate}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reportingManager">Reporting Manager</Label>
                        <Select value={formData.reportingManager || "self"} onValueChange={(value) => handleChange('reportingManager', value)} key={`${formData.reportingManager}-${employees.length}`}>
                            <SelectTrigger id="reportingManager" className={`rounded-xl border-slate-200 ${errors.reportingManager ? 'border-red-500' : ''}`}>
                                <SelectValue placeholder="Select Manager" />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="p-2 sticky top-0 bg-white z-10 border-b border-slate-100">
                                    <Input
                                        value={managerQuery}
                                        onChange={(e) => setManagerQuery(e.target.value)}
                                        placeholder="Search managers..."
                                        className="h-9 rounded-lg"
                                        onKeyDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <SelectItem value="self">Self / This employee leads</SelectItem>
                                {showMissingManager && <SelectItem value={reportingManagerId as string}>{missingManagerLabel}</SelectItem>}
                                {filteredManagers.map((emp) => <SelectItem key={emp.id} value={emp.id}>{emp.name} [{emp.employeeId}]</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="salary">Monthly Salary</Label>
                        <Input
                            id="salary"
                            type="number"
                            placeholder="50000"
                            step="1"
                            min="0"
                            value={formData.salary}
                            onChange={(e) => handleChange('salary', e.target.value)}
                            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                    e.preventDefault()
                                }
                            }}
                            required
                            className={errors.salary ? 'border-red-500' : ''}
                        />
                        {errors.salary && <p className="text-xs text-red-600 mt-1">{errors.salary}</p>}
                    </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════════════
                SECTION: Personal Details
            ═══════════════════════════════════════════════════════════════════════════ */}
            <div>
                <SectionHeader title="Personal Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="personalEmail">Personal Email</Label>
                        <Input id="personalEmail" type="email" placeholder="jane.personal@email.com" value={formData.personalEmail} onChange={(e) => handleChange('personalEmail', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="personalContact">Personal Contact</Label>
                        <Input id="personalContact" type="tel" placeholder="+92 300 1234567" value={formData.personalContact} onChange={(e) => handleChange('personalContact', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nationalId">National ID</Label>
                        <Input id="nationalId" placeholder="12345-1234567-1" value={formData.nationalId} onChange={(e) => handleChange('nationalId', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value as Gender)} key={formData.gender}>
                            <SelectTrigger id="gender" className="rounded-xl border-slate-200">
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                {showMissingGender && <SelectItem value={formData.gender}>{formData.gender}</SelectItem>}
                                {GENDER_OPTIONS.map((gender) => <SelectItem key={gender} value={gender}>{gender}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {errors.gender && <p className="text-xs text-red-600 mt-1">{errors.gender}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bloodGroup">Blood Group</Label>
                        <Select value={formData.bloodGroup || employee?.personalDetails?.bloodGroup || ''} onValueChange={(value) => handleChange('bloodGroup', value as BloodGroup)}>
                            <SelectTrigger id="bloodGroup" className="rounded-xl border-slate-200">
                                <SelectValue placeholder="Select blood group" />
                            </SelectTrigger>
                            <SelectContent>
                                {BLOOD_GROUP_OPTIONS.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                SECTION: Address Information
            ═══════════════════════════════════════════════════════════════════════════ */}
            <div>
                <SectionHeader title="Address Information" />
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="permanentAddress">Permanent Address</Label>
                        <Input id="permanentAddress" placeholder="House #, Street, City, Country" value={formData.permanentAddress} onChange={(e) => handleChange('permanentAddress', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="temporaryAddress">Temporary / Current Address</Label>
                        <Input id="temporaryAddress" placeholder="House #, Street, City, Country" value={formData.temporaryAddress} onChange={(e) => handleChange('temporaryAddress', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                SECTION: Emergency Contact
            ═══════════════════════════════════════════════════════════════════════════ */}
            <div>
                <SectionHeader title="Emergency Contact" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="emergencyContactRelation">Relation</Label>
                        <Input id="emergencyContactRelation" placeholder="Spouse, Parent, etc." value={formData.emergencyContactRelation} onChange={(e) => handleChange('emergencyContactRelation', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="emergencyContactName">Name</Label>
                        <Input id="emergencyContactName" placeholder="John Doe" value={formData.emergencyContactName} onChange={(e) => handleChange('emergencyContactName', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="emergencyContactNumber">Number</Label>
                        <Input id="emergencyContactNumber" type="tel" placeholder="+92 300 1234567" value={formData.emergencyContactNumber} onChange={(e) => handleChange('emergencyContactNumber', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                SECTION: Banking Details
            ═══════════════════════════════════════════════════════════════════════════ */}
            <div>
                <SectionHeader title="Banking Details" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="bankAccountTitle">Account Title</Label>
                        <Input id="bankAccountTitle" placeholder="Jane Smith" value={formData.bankAccountTitle} onChange={(e) => handleChange('bankAccountTitle', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input id="bankName" placeholder="HBL, Meezan, etc." value={formData.bankName} onChange={(e) => handleChange('bankName', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number / IBAN</Label>
                        <Input id="accountNumber" placeholder="PK00XXXX0000000000000000" value={formData.accountNumber} onChange={(e) => handleChange('accountNumber', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                SECTION: Form Actions
            ═══════════════════════════════════════════════════════════════════════════ */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : submitLabel}
                </Button>
            </div>
        </form>
    )
}
