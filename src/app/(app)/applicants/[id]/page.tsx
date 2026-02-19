'use client'

import 'quill/dist/quill.snow.css'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { FileText, ExternalLink, Linkedin } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { APPLICANT_STATUSES, type Applicant, type ApplicantStatus, type FeedbackCard, type FeedbackEntry } from '@/types'
import { Progress } from '@/components/ui/progress'
import { fetchApplicantApi, fetchFeedbackEntriesApi } from '@/lib/api/client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hummane-api.vercel.app'

interface CardQuestion {
    id: string
    kind: 'content' | 'score' | 'comment'
    prompt: string
    weight?: number
    answer?: {
        answer: string
        questionId: string
    }
}

interface FeedbackEntryDetail {
    id: string
    subjectName?: string
    subjectType?: string
    authorName?: string
    type?: string
    createdAt: string
    card?: {
        id: string
        title: string
        questions: CardQuestion[]
    }
}

export default function ApplicantDetailPage() {
    const router = useRouter()
    const params = useParams()
    const { applicants, feedbackEntries, feedbackCards, apiAccessToken, updateApplicant, employees } = useApp()
    const [applicant, setApplicant] = useState<Applicant | null>(null)
    const [pageFeedbackEntries, setPageFeedbackEntries] = useState<FeedbackEntry[] | null>(null)
    const [feedbackEntryDetails, setFeedbackEntryDetails] = useState<Record<string, FeedbackEntryDetail>>({})
    const [statusUpdating, setStatusUpdating] = useState<ApplicantStatus | null>(null)
    const [pendingStatus, setPendingStatus] = useState<ApplicantStatus | null>(null)
    const [selectedStatusEmployeeId, setSelectedStatusEmployeeId] = useState('')
    const [statusEmployeeQuery, setStatusEmployeeQuery] = useState('')
    const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'details' | 'feedback'>('details')
    const lastFetchedApplicantId = useRef<string | null>(null)

    const fetchApplicantFromApi = useCallback(async () => {
        if (!apiAccessToken || !params.id) return null

        try {
            const apiApplicant = await fetchApplicantApi(params.id as string, apiAccessToken)
            return apiApplicant
        } catch (error) {
            console.error('Error fetching applicant from API:', error)
            return null
        }
    }, [apiAccessToken, params.id])

    useEffect(() => {
        const loadApplicant = async () => {
            const applicantId = params.id as string | undefined
            if (!applicantId) {
                setApplicant(null)
                setPageLoading(false)
                return
            }

            // Avoid refetching on unrelated context updates (e.g., global AppContext bootstrap updates).
            if (apiAccessToken && lastFetchedApplicantId.current === applicantId) {
                setPageLoading(false)
                return
            }

            setPageLoading(true)
            // First try to fetch from API
            if (apiAccessToken) {
                const apiApplicant = await fetchApplicantFromApi()
                if (apiApplicant) {
                    setApplicant(apiApplicant)
                    lastFetchedApplicantId.current = applicantId
                    setPageLoading(false)
                    return
                }
            }
            // Fallback to context data
            const found = applicants.find(a => a.id === applicantId)
            if (found) {
                setApplicant(found)
            }
            setPageLoading(false)
        }
        loadApplicant()
    }, [params.id, applicants, apiAccessToken, fetchApplicantFromApi])

    useEffect(() => {
        const loadFeedbackEntries = async () => {
            if (!apiAccessToken) return
            try {
                const entries = await fetchFeedbackEntriesApi(apiAccessToken)
                setPageFeedbackEntries(entries)
            } catch (error) {
                console.error('Error fetching feedback entries from API:', error)
                setPageFeedbackEntries(null)
            }
        }
        void loadFeedbackEntries()
    }, [apiAccessToken])

    const feedbackSource = pageFeedbackEntries ?? feedbackEntries
    const applicantId = applicant?.id
    const applicantName = applicant?.fullName?.trim().toLowerCase() || ''

    const applicantFeedback = useMemo(
        () => feedbackSource.filter(e => {
            const rawType = (e.type || e.subjectType || '').toString().toLowerCase()
            const isApplicantType = rawType === 'applicant'
            const subjectIdMatches = !!applicantId && e.subjectId === applicantId
            const subjectNameMatches =
                !!applicantName &&
                typeof e.subjectName === 'string' &&
                e.subjectName.trim().toLowerCase() === applicantName
            return isApplicantType && (subjectIdMatches || subjectNameMatches)
        }),
        [feedbackSource, applicantId, applicantName]
    )
    const cardsById = useMemo(
        () => new Map(feedbackCards.map(card => [card.id, card])),
        [feedbackCards]
    )

    useEffect(() => {
        if (!apiAccessToken || applicantFeedback.length === 0) return
        const entriesToLoad = applicantFeedback.filter(entry => !feedbackEntryDetails[entry.id])
        if (entriesToLoad.length === 0) return

        const loadFeedbackDetails = async () => {
            try {
                const details = await Promise.all(
                    entriesToLoad.map(async (entry) => {
                        const response = await fetch(`${API_BASE_URL}/feedback-entries/${encodeURIComponent(entry.id)}`, {
                            method: 'GET',
                            headers: {
                                Authorization: `Bearer ${apiAccessToken}`,
                            },
                        })
                        if (!response.ok) return null
                        const data = await response.json().catch(() => null)
                        const detail = (data?.data || data) as FeedbackEntryDetail | null
                        return detail && detail.id ? detail : null
                    })
                )

                const byId = details.reduce<Record<string, FeedbackEntryDetail>>((acc, detail) => {
                    if (detail?.id) acc[detail.id] = detail
                    return acc
                }, {})
                if (Object.keys(byId).length > 0) {
                    setFeedbackEntryDetails(prev => ({ ...prev, ...byId }))
                }
            } catch (error) {
                console.error('Error fetching feedback entry details:', error)
            }
        }

        void loadFeedbackDetails()
    }, [apiAccessToken, applicantFeedback, feedbackEntryDetails])
    const feedbackScoreSummary = useMemo(() => {
        return applicantFeedback
            .map((entry) => {
                const detail = feedbackEntryDetails[entry.id]
                const card = cardsById.get(entry.cardId) as FeedbackCard | undefined
                const questions = detail?.card?.questions || []
                const answerByQuestionId = new Map(entry.answers.map(answer => [answer.questionId, answer]))
                const scoreQuestions = questions.filter(question => question.kind === 'score')

                const getScore = (question: CardQuestion) => {
                    if (question.answer?.answer) {
                        const parsed = parseFloat(question.answer.answer)
                        if (!Number.isNaN(parsed)) return parsed
                    }
                    const entryAnswer = question.id ? answerByQuestionId.get(question.id) : undefined
                    if (typeof entryAnswer?.score === 'number') return entryAnswer.score
                    if (entryAnswer?.answer) {
                        const parsed = parseFloat(entryAnswer.answer)
                        if (!Number.isNaN(parsed)) return parsed
                    }
                    return 0
                }
                const total = scoreQuestions.reduce((sum, question) => sum + getScore(question), 0)
                const max = scoreQuestions.length * 5
                return {
                    id: entry.id,
                    title: detail?.card?.title || card?.title || 'Feedback',
                    total,
                    max,
                    complete: max > 0 ? total >= max : false,
                    createdAt: detail?.createdAt || entry.createdAt
                }
            })
            .filter(item => item.max > 0)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [applicantFeedback, feedbackEntryDetails, cardsById])

    const employeeNameById = useMemo(
        () => new Map(employees.map(employee => [employee.id, employee.name])),
        [employees]
    )

    const currentStatusAssignment = applicant?.assignments?.find(item => item.status === applicant.status)
    const currentStatusEmployeeName = currentStatusAssignment?.employeeId
        ? employeeNameById.get(currentStatusAssignment.employeeId) || 'Unknown employee'
        : null
    const filteredStatusEmployees = useMemo(() => {
        const query = statusEmployeeQuery.trim().toLowerCase()
        if (!query) return employees
        return employees.filter((employee) => {
            const haystack = `${employee.name} ${employee.employeeId}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [employees, statusEmployeeQuery])

    if (pageLoading) {
        return (
            <div className="text-center py-16">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-4 text-slate-500">Loading applicant details...</p>
            </div>
        )
    }

    if (!applicant) {
        return (
            <div className="text-center py-16">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Applicant not found</h3>
                <Button onClick={() => router.push('/applicants')} className="mt-4">
                    Back to Applicants
                </Button>
            </div>
        )
    }

    const getStatusColor = (status: ApplicantStatus) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-700'
            case 'first interview': return 'bg-yellow-100 text-yellow-700'
            case 'second interview': return 'bg-purple-100 text-purple-700'
            case 'final interview': return 'bg-indigo-100 text-indigo-700'
            case 'initiate documentation': return 'bg-green-100 text-green-700'
            case 'rejected': return 'bg-red-100 text-red-700'
            case 'hired': return 'bg-emerald-100 text-emerald-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    const handleStatusChange = async (status: ApplicantStatus, assignments?: Applicant['assignments']) => {
        if (!applicant || status === applicant.status || statusUpdating) return
        setStatusUpdating(status)
        try {
            const updated = await updateApplicant(applicant.id, { status, assignments })
            setApplicant(prev => (prev
                ? {
                    ...prev,
                    status: updated?.status || status,
                    assignments: updated?.assignments || assignments || prev.assignments
                }
                : prev
            ))
            toast('Applicant status updated', 'success')
        } catch (error) {
            console.error('Failed to update applicant status:', error)
            toast('Failed to update applicant status', 'error')
        } finally {
            setStatusUpdating(null)
        }
    }

    const formatStatusLabel = (status: ApplicantStatus) =>
        status
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')

    const openStatusAssignmentDialog = (status: ApplicantStatus) => {
        if (!applicant || status === applicant.status || statusUpdating) return
        setPendingStatus(status)
        setSelectedStatusEmployeeId('')
        setStatusEmployeeQuery('')
        setIsAssignmentDialogOpen(true)
    }

    const confirmStatusAssignment = async () => {
        if (!applicant || !pendingStatus) return
        if (!selectedStatusEmployeeId) {
            toast('Please select an employee for this status', 'error')
            return
        }
        const existingAssignments = applicant.assignments || []
        const mergedAssignments: NonNullable<Applicant['assignments']> = [
            ...existingAssignments.filter(item => item.status !== pendingStatus),
            { status: pendingStatus, employeeId: selectedStatusEmployeeId }
        ]
        await handleStatusChange(pendingStatus, mergedAssignments)
        setIsAssignmentDialogOpen(false)
        setPendingStatus(null)
        setSelectedStatusEmployeeId('')
        setStatusEmployeeQuery('')
    }

    // Handle resumeFile as either a string URL (from API) or an object with dataUrl
    const getResumeUrl = (): string | null => {
        if (!applicant.resumeFile) return null
        if (typeof applicant.resumeFile === 'string') return applicant.resumeFile
        if (typeof applicant.resumeFile === 'object' && applicant.resumeFile.dataUrl) return applicant.resumeFile.dataUrl
        return null
    }

    const documentFiles = applicant.documents?.files && applicant.documents.files.length > 0
        ? applicant.documents.files
        : getResumeUrl()
            ? [getResumeUrl()!]
            : []
    const linkedinUrl = applicant.linkedinUrl
        ? applicant.linkedinUrl.startsWith('http://') || applicant.linkedinUrl.startsWith('https://')
            ? applicant.linkedinUrl
            : `https://${applicant.linkedinUrl}`
        : ''

    return (
        <>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div className="flex items-center gap-4 mb-8">
                <Button
                    variant="outline"
                    onClick={() => {
                        if (typeof window !== 'undefined') {
                            const backTarget = sessionStorage.getItem('applicantDetailBack')
                            if (backTarget) {
                                router.push(backTarget)
                                return
                            }
                        }
                        router.push('/applicants')
                    }}
                    className="rounded-xl"
                >
                    Back
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {applicant.fullName}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Applicant Details
                    </p>
                </div>
            </div>

            {applicantFeedback.length > 0 && (
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={activeTab === 'details' ? 'default' : 'outline'}
                        className={activeTab === 'details' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600'}
                        onClick={() => setActiveTab('details')}
                    >
                        Details
                    </Button>
                    <Button
                        variant={activeTab === 'feedback' ? 'default' : 'outline'}
                        className={activeTab === 'feedback' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600'}
                        onClick={() => setActiveTab('feedback')}
                    >
                        Feedback
                    </Button>
                </div>
            )}

            {activeTab === 'details' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-6">Professional Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Position Applied</p>
                                    {applicant.jobId ? (
                                        <Link
                                            href={`/applicants?jobId=${applicant.jobId}`}
                                            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                                        >
                                            {applicant.positionApplied || 'Not specified'}
                                        </Link>
                                    ) : (
                                        <p className="text-slate-900 font-semibold">{applicant.positionApplied || 'Not specified'}</p>
                                    )}
                                </div>
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Department</p>
                                    <p className="text-slate-900 font-semibold">{applicant.departmentName || 'Not specified'}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Experience</p>
                                    <p className="text-slate-900 font-semibold">
                                        {applicant.yearsOfExperience !== undefined && applicant.yearsOfExperience !== null
                                            ? `${applicant.yearsOfExperience} ${applicant.yearsOfExperience === 1 ? 'year' : 'years'}`
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Salary</p>
                                    <p className="text-slate-900 font-semibold">
                                        {applicant.currentSalary ? applicant.currentSalary.toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Expected Salary</p>
                                    <p className="text-slate-900 font-semibold">
                                        {applicant.expectedSalary ? applicant.expectedSalary.toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notice Period</p>
                                    <p className="text-slate-900 font-semibold">{applicant.noticePeriod || 'Not specified'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-6">Personal Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</p>
                                    <p className="text-slate-900 font-semibold break-all">{applicant.email}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone</p>
                                    <p className="text-slate-900 font-semibold">{applicant.phone || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-4">Feedback Scores</h2>
                            {feedbackScoreSummary.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('feedback')}
                                            className="text-xs font-extrabold uppercase tracking-widest text-blue-700 hover:text-blue-900 hover:underline transition-colors"
                                            title="Open feedback details"
                                        >
                                            {feedbackScoreSummary[0].title}
                                        </button>
                                        <p className="text-3xl font-black text-slate-900 mt-1">
                                            {feedbackScoreSummary[0].total} / {feedbackScoreSummary[0].max}
                                        </p>
                                        <p className={`text-xs font-extrabold uppercase tracking-widest mt-2 ${feedbackScoreSummary[0].complete ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            {feedbackScoreSummary[0].complete ? 'Complete' : 'Incomplete'}
                                        </p>
                                    </div>
                                    {feedbackScoreSummary.slice(1).map(item => (
                                        <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                                            <div>
                                                <p className="text-lg font-extrabold text-slate-900">{item.total} / {item.max}</p>
                                                <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                                            </div>
                                            <p className={`text-xs font-extrabold uppercase tracking-widest ${item.complete ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                {item.complete ? 'Complete' : 'Incomplete'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">No applicant feedback scores yet.</p>
                            )}
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-6">Application Status</h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Status</p>
                                    <div className="flex items-center gap-3">
                                        <Select
                                            value={applicant.status}
                                            onValueChange={(value) => openStatusAssignmentDialog(value as ApplicantStatus)}
                                            disabled={!!statusUpdating}
                                        >
                                            <SelectTrigger
                                                className={`h-9 w-auto min-w-[170px] rounded-full border-0 px-4 text-sm font-bold shadow-none ${getStatusColor(applicant.status)}`}
                                            >
                                                <SelectValue>
                                                    {formatStatusLabel(applicant.status)}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {APPLICANT_STATUSES.map((status) => (
                                                    <SelectItem key={status} value={status}>
                                                        {formatStatusLabel(status)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {statusUpdating && (
                                            <span className="text-xs font-semibold text-slate-500">Updating...</span>
                                        )}
                                    </div>
                                    {currentStatusEmployeeName && (
                                        <p className="text-xs font-semibold text-slate-500 mt-2">
                                            Assigned: {currentStatusEmployeeName}
                                        </p>
                                    )}
                                </div>
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Applied Date</p>
                                    <p className="text-slate-900 font-semibold">
                                        {applicant.appliedDate
                                            ? new Date(applicant.appliedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                            : 'Not specified'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-4">Documents & Links</h2>
                            <div className="space-y-3">
                                {documentFiles.length > 0 ? (
                                    documentFiles.map((url) => (
                                        <a
                                            key={url}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-900">Resume</p>
                                                <p className="text-xs text-slate-500">View document</p>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-slate-400" />
                                        </a>
                                    ))
                                ) : (
                                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-500">Documents</p>
                                            <p className="text-xs text-slate-400">Not provided</p>
                                        </div>
                                    </div>
                                )}

                                {linkedinUrl ? (
                                    <a
                                        href={linkedinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <Linkedin className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900">LinkedIn Profile</p>
                                            <p className="text-xs text-slate-500">View profile</p>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-slate-400" />
                                    </a>
                                ) : (
                                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                            <Linkedin className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-500">LinkedIn Profile</p>
                                            <p className="text-xs text-slate-400">Not provided</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'feedback' && (
                <div className="space-y-6">
                    {applicantFeedback.length === 0 ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                            <p className="text-sm text-slate-500">No feedback entries found for this applicant.</p>
                        </div>
                    ) : (
                        applicantFeedback.map((entry) => {
                            const detail = feedbackEntryDetails[entry.id]
                            const card = cardsById.get(entry.cardId) as FeedbackCard | undefined
                            const questions = detail?.card?.questions || []
                            const answerByQuestionId = new Map(entry.answers.map(answer => [answer.questionId, answer]))
                            const scoreQuestions = questions
                                .map((question, index) => ({
                                    question,
                                    index,
                                    questionId: question.id || question.answer?.questionId || `q-${index}`
                                }))
                                .filter(item => item.question.kind === 'score')

                            const getScore = (questionId: string, questionScore?: string) => {
                                if (questionScore) {
                                    const parsedQuestionScore = parseFloat(questionScore)
                                    if (!Number.isNaN(parsedQuestionScore)) return parsedQuestionScore
                                }
                                const answer = answerByQuestionId.get(questionId)
                                if (!answer) return 0
                                if (typeof answer.score === 'number') return answer.score
                                if (answer.answer) {
                                    const parsed = parseFloat(answer.answer)
                                    if (!Number.isNaN(parsed)) return parsed
                                }
                                return 0
                            }

                            const totalScore = scoreQuestions.reduce(
                                (sum, item) => sum + getScore(item.questionId, item.question.answer?.answer),
                                0
                            )
                            const maxScore = scoreQuestions.length * 5
                            const percentScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
                            const avgScore = scoreQuestions.length > 0 ? (totalScore / scoreQuestions.length).toFixed(1) : '0.0'

                            return (
                                <div key={entry.id} className="space-y-6">
                                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="p-8 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type</p>
                                                    <p className="font-semibold text-slate-900">{entry.type || entry.subjectType || 'Applicant'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">From</p>
                                                    <p className="font-semibold text-slate-900">{detail?.authorName || entry.authorName || 'Unknown'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Card</p>
                                                    <p className="font-semibold text-slate-900">{detail?.card?.title || card?.title || 'Feedback Card'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</p>
                                                    <p className="font-semibold text-slate-900">{new Date((detail?.createdAt || entry.createdAt)).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                                <div className="rounded-2xl border border-slate-200 p-4">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Score</p>
                                                    <p className="text-2xl font-extrabold text-slate-900">{totalScore} / {maxScore}</p>
                                                </div>
                                                <div className="rounded-2xl border border-slate-200 p-4">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Average</p>
                                                    <p className="text-2xl font-extrabold text-slate-900">{avgScore}</p>
                                                </div>
                                                <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score %</p>
                                                    <p className="text-2xl font-extrabold text-slate-900">{percentScore}%</p>
                                                    <Progress value={percentScore} className="h-2" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="p-6 space-y-4">
                                            {questions.length === 0 ? (
                                                <p className="text-sm text-slate-500">No question details available for this feedback entry.</p>
                                            ) : (
                                                questions.map((question, index) => {
                                                    const questionId = question.id || question.answer?.questionId || `q-${index}`
                                                    const answer = answerByQuestionId.get(questionId) || (
                                                        question.answer?.questionId
                                                            ? answerByQuestionId.get(question.answer.questionId)
                                                            : undefined
                                                    )
                                                    if (question.kind === 'content') {
                                                        return (
                                                            <div key={`${entry.id}-content-${questionId}-${index}`} className="pt-2">
                                                                <div className="ql-snow">
                                                                    <div
                                                                        className="ql-editor p-0 text-sm text-slate-700"
                                                                        dangerouslySetInnerHTML={{ __html: question.prompt }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )
                                                    }

                                                    if (question.kind === 'score') {
                                                        const selectedScore = getScore(questionId, question.answer?.answer)
                                                        return (
                                                            <div key={`${entry.id}-${questionId}-${index}`} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                                                                <p className="text-sm font-semibold text-slate-800">{question.prompt}</p>
                                                                <div className="flex items-center gap-2">
                                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                                        <div
                                                                            key={s}
                                                                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                                                                selectedScore === s
                                                                                    ? 'bg-blue-600 text-white shadow-md'
                                                                                    : 'bg-slate-100 text-slate-400'
                                                                            }`}
                                                                        >
                                                                            {s}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )
                                                    }

                                                    return (
                                                        <div key={`${entry.id}-${questionId}-${index}`} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                                                            <p className="text-sm font-semibold text-slate-800">{question.prompt}</p>
                                                            <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                                                {question.answer?.answer || answer?.comment || answer?.answer || '—'}
                                                            </p>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}
            </div>

            <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Assign Employee</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                            Select who will handle <span className="font-semibold">{pendingStatus ? formatStatusLabel(pendingStatus) : 'this stage'}</span>.
                        </p>
                        <Select value={selectedStatusEmployeeId} onValueChange={setSelectedStatusEmployeeId}>
                            <SelectTrigger className="h-11 rounded-xl">
                                <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72 overflow-y-auto">
                                <div className="p-2 sticky top-0 bg-white z-10 border-b border-slate-100">
                                    <Input
                                        value={statusEmployeeQuery}
                                        onChange={(e) => setStatusEmployeeQuery(e.target.value)}
                                        placeholder="Search employees..."
                                        className="h-9 rounded-lg"
                                        onKeyDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                {filteredStatusEmployees.map(employee => (
                                    <SelectItem key={employee.id} value={employee.id}>
                                        {employee.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsAssignmentDialogOpen(false)
                                    setPendingStatus(null)
                                    setSelectedStatusEmployeeId('')
                                    setStatusEmployeeQuery('')
                                }}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => void confirmStatusAssignment()}
                                className="rounded-xl"
                                disabled={!selectedStatusEmployeeId || !!statusUpdating}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </>
    )
}
