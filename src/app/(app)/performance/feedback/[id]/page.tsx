'use client'

import 'quill/dist/quill.snow.css'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useApp } from '@/lib/context/AppContext'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hummane-api.vercel.app'

// Types for the API card structure
interface CardQuestion {
    type: 'content' | 'score' | 'text'  // API uses 'type' and 'text' for comments
    prompt: string
    weight?: number
    answer?: {
        answer: string
        questionId: string
    }
}

interface ApiCard {
    id: string
    companyId: string
    title: string
    subject: string
    questions: CardQuestion[]
    createdAt: string
    updatedAt: string
}

interface ApiEntry {
    id: string
    subjectName?: string
    subjectType?: string
    type?: string
    createdAt: string
    card: ApiCard
}

export default function FeedbackDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { apiAccessToken } = useApp()

    const entryId = params.id as string

    // API data state
    const [apiEntry, setApiEntry] = useState<ApiEntry | null>(null)
    const [apiResponse, setApiResponse] = useState<string>('')
    const [curlCommand, setCurlCommand] = useState<string>('')
    const [loading, setLoading] = useState(true)

    // Fetch from API
    useEffect(() => {
        if (!entryId || !apiAccessToken) return

        const url = `${API_BASE_URL}/feedback-entries/${encodeURIComponent(entryId)}`
        const curl = `curl -X GET '${url}' \\
  -H 'Authorization: Bearer ${apiAccessToken}'`
        setCurlCommand(curl)

        fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${apiAccessToken}`,
            },
        })
            .then(res => res.json())
            .then(data => {
                setApiResponse(JSON.stringify(data, null, 2))
                // Extract entry from response (handle wrapped or direct response)
                const entry = data?.data || data
                setApiEntry(entry)
                setLoading(false)
            })
            .catch(err => {
                setApiResponse(`Error: ${err.message}`)
                setLoading(false)
            })
    }, [entryId, apiAccessToken])

    if (loading) {
        return (
            <div className="p-8 text-center text-slate-500">
                Loading feedback entry...
            </div>
        )
    }

    if (!apiEntry || !apiEntry.card) {
        return (
            <div className="p-8 text-center text-slate-500">
                Feedback entry not found.
            </div>
        )
    }

    const card = apiEntry.card
    const questions = card.questions || []

    // Filter questions by type (API uses 'type' not 'kind', and 'text' for comments)
    const contentBlocks = questions.filter(q => q.type === 'content')
    const scoreQuestions = questions.filter(q => q.type === 'score')
    const commentQuestions = questions.filter(q => q.type === 'text')

    // Calculate scores
    const getScore = (q: CardQuestion) => {
        if (q.answer?.answer) {
            const parsed = parseFloat(q.answer.answer)
            if (!isNaN(parsed)) return parsed
        }
        return 0
    }
    const totalScore = scoreQuestions.reduce((sum, q) => sum + getScore(q), 0)
    const maxScore = scoreQuestions.length * 5
    const percentScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
    const avgScore = scoreQuestions.length > 0 ? (totalScore / scoreQuestions.length).toFixed(1) : '0.0'
    const isIncomplete = scoreQuestions.some(q => getScore(q) <= 0)

    // Display type
    const displayType = apiEntry.type || (apiEntry.subjectType === 'Employee' ? 'Team Member' : apiEntry.subjectType) || '—'


    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        if (typeof window !== 'undefined') {
                            const backTarget = sessionStorage.getItem('feedbackDetailBack')
                            if (backTarget) {
                                router.push(backTarget)
                                return
                            }
                        }
                        router.push('/performance/feedback')
                    }}
                    className="rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Feedback Detail</p>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {apiEntry.subjectName || 'Unknown'} <span className="text-slate-400 font-medium text-lg">({apiEntry.id})</span>
                    </h1>
                </div>
            </div>
                <div className="flex items-center gap-3">
                    {isIncomplete && (
                        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Incomplete</Badge>
                    )}
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => router.push(`/performance/feedback/${apiEntry.id}/edit`)}
                    >
                        Edit Feedback
                    </Button>
                </div>
            </div>

            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-8 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type</p>
                            <p className="font-semibold text-slate-900">{displayType}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recipient</p>
                            <p className="font-semibold text-slate-900">{apiEntry.subjectName || 'Unknown'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Card</p>
                            <p className="font-semibold text-slate-900">{card.title || 'Unknown'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</p>
                            <p className="font-semibold text-slate-900">{new Date(apiEntry.createdAt).toLocaleDateString()}</p>
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
                </CardContent>
            </Card>

            <Card className="border-none shadow-premium rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-6 space-y-4">
                    {/* Render questions in order from API */}
                    {questions.map((q, index) => {
                        if (q.type === 'content') {
                            // Content block - section header
                            return (
                                <div key={index} className="pt-2">
                                    <div className="ql-snow">
                                        <div
                                            className="ql-editor p-0 text-sm text-slate-700"
                                            dangerouslySetInnerHTML={{ __html: q.prompt }}
                                        />
                                    </div>
                                </div>
                            )
                        } else if (q.type === 'score') {
                            // Score question
                            const score = getScore(q)
                            return (
                                <div key={index} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                                    <p className="text-sm font-semibold text-slate-800">
                                        {q.prompt}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <div
                                                key={s}
                                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                                    score === s
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
                        } else if (q.type === 'text') {
                            // Comment/text question
                            return (
                                <div key={index} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                                    <p className="text-sm font-semibold text-slate-800">
                                        {q.prompt}
                                    </p>
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                        {q.answer?.answer || '—'}
                                    </p>
                                </div>
                            )
                        }
                        return null
                    })}
                </CardContent>
            </Card>

            {/* API Debug */}
            <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Curl Command</p>
                <pre className="bg-slate-900 text-green-400 p-4 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap">
                    {curlCommand || 'No API access token available'}
                </pre>

                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">API Response</p>
                <pre className="bg-slate-900 text-blue-400 p-4 rounded-xl text-xs overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                    {apiResponse || 'Loading...'}
                </pre>
            </div>
        </div>
    )
}
