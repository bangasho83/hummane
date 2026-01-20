'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Briefcase, Calendar, FileText, Linkedin, ExternalLink, Clock, Building2 } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { Button } from '@/components/ui/button'
import { type Applicant, type ApplicantStatus, type FeedbackCard } from '@/types'
import { Progress } from '@/components/ui/progress'
import { fetchApplicantApi } from '@/lib/api/client'

export default function ApplicantDetailPage() {
    const router = useRouter()
    const params = useParams()
    const { applicants, feedbackEntries, feedbackCards, apiAccessToken, currentCompany } = useApp()
    const [applicant, setApplicant] = useState<Applicant | null>(null)
    const [pageLoading, setPageLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'details' | 'feedback'>('details')

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
            setPageLoading(true)
            // First try to fetch from API
            if (apiAccessToken) {
                const apiApplicant = await fetchApplicantFromApi()
                if (apiApplicant) {
                    setApplicant(apiApplicant)
                    setPageLoading(false)
                    return
                }
            }
            // Fallback to context data
            const found = applicants.find(a => a.id === params.id)
            if (found) {
                setApplicant(found)
            }
            setPageLoading(false)
        }
        loadApplicant()
    }, [params.id, applicants, apiAccessToken, fetchApplicantFromApi])

    const applicantFeedback = useMemo(
        () => feedbackEntries.filter(e => e.type === 'Applicant' && e.subjectId === applicant?.id),
        [feedbackEntries, applicant?.id]
    )
    const cardsById = useMemo(
        () => new Map(feedbackCards.map(card => [card.id, card])),
        [feedbackCards]
    )

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
            case 'screening': return 'bg-yellow-100 text-yellow-700'
            case 'interview': return 'bg-purple-100 text-purple-700'
            case 'offer': return 'bg-green-100 text-green-700'
            case 'rejected': return 'bg-red-100 text-red-700'
            case 'hired': return 'bg-emerald-100 text-emerald-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    const documentFiles = applicant.documents?.files && applicant.documents.files.length > 0
        ? applicant.documents.files
        : applicant.resumeFile?.dataUrl
            ? [applicant.resumeFile.dataUrl]
            : []

    return (
        <>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div className="flex items-center gap-4 mb-8">
                <Button
                    variant="ghost"
                    size="icon"
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
                    className="rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                >
                    <ArrowLeft className="w-5 h-5" />
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
                            <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-6">Personal Information</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</p>
                                        <p className="text-slate-900 font-medium">{applicant.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Phone className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</p>
                                        <p className="text-slate-900 font-medium">{applicant.phone || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-6">Professional Information</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <Briefcase className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Position Applied</p>
                                            {applicant.jobId ? (
                                                <Link
                                                    href={`/applicants?jobId=${applicant.jobId}`}
                                                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                                                >
                                                    {applicant.positionApplied || 'Not specified'}
                                                </Link>
                                            ) : (
                                                <p className="text-slate-900 font-medium">{applicant.positionApplied || 'Not specified'}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</p>
                                            <p className="text-slate-900 font-medium">{applicant.departmentName || 'Not specified'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Experience</p>
                                        <p className="text-slate-900 font-bold text-lg">
                                            {applicant.yearsOfExperience !== undefined && applicant.yearsOfExperience !== null
                                                ? `${applicant.yearsOfExperience} ${applicant.yearsOfExperience === 1 ? 'year' : 'years'}`
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Salary</p>
                                        <p className="text-slate-900 font-bold text-lg">
                                            {applicant.currentSalary
                                                ? applicant.currentSalary.toLocaleString()
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Expected Salary</p>
                                        <p className="text-slate-900 font-bold text-lg">
                                            {applicant.expectedSalary
                                                ? applicant.expectedSalary.toLocaleString()
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notice Period</p>
                                        <p className="text-slate-900 font-medium">{applicant.noticePeriod || 'Not specified'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-6">Application Status</h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Status</p>
                                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(applicant.status)}`}>
                                        {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-slate-100 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Applied Date</p>
                                            <p className="text-slate-900 font-medium">
                                                {applicant.appliedDate
                                                    ? new Date(applicant.appliedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                                    : 'Not specified'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Documents & Links */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-4">Documents & Links</h2>
                            <div className="space-y-3">
                                {documentFiles.length > 0 ? (
                                    documentFiles.map((url) => {
                                        const name = 'Resume'
                                        return (
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
                                                    <p className="text-sm font-bold text-slate-900">{name}</p>
                                                    <p className="text-xs text-slate-500">View document</p>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-slate-400" />
                                            </a>
                                        )
                                    })
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

                                {applicant.linkedinUrl ? (
                                    <a
                                        href={applicant.linkedinUrl}
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
                    {applicantFeedback.map((entry) => {
                        const card = cardsById.get(entry.cardId) as FeedbackCard | undefined
                        const questionById = new Map(card?.questions.map(q => [q.id, q]) || [])
                        const scoreAnswers = entry.answers.filter(a => (questionById.get(a.questionId)?.kind || 'score') === 'score')
                        // Get score from API 'answer' field or 'score' field
                        const getScore = (a: typeof entry.answers[0]) => {
                            if (a.score !== undefined) return a.score
                            if (a.answer) {
                                const parsed = parseFloat(a.answer)
                                if (!isNaN(parsed)) return parsed
                            }
                            return 0
                        }
                        const totalScore = scoreAnswers.reduce((sum, a) => sum + getScore(a), 0)
                        const maxScore = scoreAnswers.length * 5
                        const percentScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
                        return (
                            <div key={entry.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Feedback</p>
                                        <p className="text-lg font-extrabold text-slate-900">{card?.title || 'Feedback Card'}</p>
                                        <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score</p>
                                        <p className="text-2xl font-extrabold text-slate-900">{totalScore} / {maxScore}</p>
                                        <div className="mt-2 w-40">
                                            <Progress value={percentScore} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {entry.answers.map((answer) => {
                                        const question = questionById.get(answer.questionId)
                                        return (
                                            <div key={answer.questionId} className="rounded-2xl border border-slate-200 p-4">
                                                <p className="text-sm font-semibold text-slate-800">{question?.prompt || 'Question'}</p>
                                                {question?.kind === 'comment' ? (
                                                    <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{answer.comment || '—'}</p>
                                                ) : (
                                                    <div className="mt-3 flex items-center gap-3">
                                                        {[1, 2, 3, 4, 5].map((score) => (
                                                            <span
                                                                key={score}
                                                                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${answer.score === score ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                                                            >
                                                                {score}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

        </>
    )
}
