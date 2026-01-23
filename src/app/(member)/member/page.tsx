'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useApp } from '@/lib/context/AppContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    CalendarDays,
    MessageSquare,
    User,
    Calendar,
    Star,
    TrendingUp,
    Clock,
    Loader2,
    CalendarPlus,
    Users
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { LeaveRecord, FeedbackEntry, Employee } from '@/types'

const API_BASE_URL = 'https://api.hummane.com'

export default function MemberDashboardPage() {
    const {
        employees,
        leaves,
        leaveTypes,
        feedbackCards,
        holidays,
        meProfile,
        apiAccessToken,
        isHydrating
    } = useApp()

    const [employee, setEmployee] = useState<Employee | null>(null)
    const [myLeaves, setMyLeaves] = useState<LeaveRecord[]>([])
    const [myFeedback, setMyFeedback] = useState<FeedbackEntry[]>([])
    const [loading, setLoading] = useState(true)

    const employeeId = meProfile?.employeeId

    const isDataLoading = isHydrating || !meProfile

    const todayKey = useMemo(() => new Date().toISOString().split('T')[0], [])

    // Fetch all data on mount
    useEffect(() => {
        if (!employeeId || !apiAccessToken) {
            setEmployee(null)
            setMyLeaves([])
            setMyFeedback([])
            setLoading(false)
            return
        }

        const fetchData = async () => {
            setLoading(true)
            try {
                const [empRes, leavesRes, feedbackRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/employees/${encodeURIComponent(employeeId)}`, {
                        method: 'GET',
                        headers: { Authorization: `Bearer ${apiAccessToken}` },
                    }),
                    fetch(`${API_BASE_URL}/leaves?employeeId=${encodeURIComponent(employeeId)}`, {
                        method: 'GET',
                        headers: { Authorization: `Bearer ${apiAccessToken}` },
                    }),
                    fetch(`${API_BASE_URL}/feedback-entries?subjectId=${encodeURIComponent(employeeId)}`, {
                        method: 'GET',
                        headers: { Authorization: `Bearer ${apiAccessToken}` },
                    })
                ])

                if (empRes.ok) {
                    const empData = await empRes.json()
                    setEmployee(empData)
                } else {
                    setEmployee(null)
                }

                if (leavesRes.ok) {
                    const leavesData = await leavesRes.json()
                    const leavesList = leavesData?.records || leavesData?.data || leavesData?.leaves || leavesData
                    setMyLeaves(Array.isArray(leavesList) ? leavesList : [])
                } else {
                    setMyLeaves([])
                }

                if (feedbackRes.ok) {
                    const feedbackData = await feedbackRes.json()
                    setMyFeedback(Array.isArray(feedbackData) ? feedbackData : [])
                } else {
                    setMyFeedback([])
                }
            } catch (error) {
                console.error('Error fetching data:', error)
                setEmployee(null)
                setMyLeaves([])
                setMyFeedback([])
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [employeeId, apiAccessToken])

    const myLeavesThisYear = useMemo(() => {
        const year = new Date().getFullYear().toString()
        return myLeaves.filter(l => (l.startDate || l.date)?.startsWith(year))
    }, [myLeaves])

    // Leave balance calculation
    const leaveBalance = useMemo(() => {
        if (!employee) return []
        const empLeaveTypes = leaveTypes.filter(lt => lt.employmentType === employee.employmentType)
        return empLeaveTypes.map(lt => {
            const used = myLeavesThisYear
                .filter(l => l.leaveTypeId === lt.id)
                .reduce((sum, l) => sum + (l.amount || 1), 0)
            return {
                id: lt.id,
                name: lt.name,
                code: lt.code,
                quota: lt.quota,
                used,
                remaining: Math.max(0, lt.quota - used),
                unit: lt.unit
            }
        })
    }, [employee, leaveTypes, myLeavesThisYear])

    // Calculate average feedback score
    const avgFeedbackScore = useMemo(() => {
        if (myFeedback.length === 0) return null
        let totalScore = 0
        let totalMax = 0
        myFeedback.forEach(entry => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const scoreAnswers = entry.answers.filter((a: any) => a.question?.kind === 'score')
            scoreAnswers.forEach((a: { answer?: string }) => {
                const val = parseInt(a.answer || '0', 10)
                if (!isNaN(val) && val > 0) {
                    totalScore += val
                    totalMax += 5
                }
            })
        })
        if (totalMax === 0) return null
        return Math.round((totalScore / totalMax) * 100)
    }, [myFeedback])

    // Team on leave today
    const onLeaveToday = useMemo(() => {
        return employees.filter(emp => {
            return leaves.some(l => {
                if (l.employeeId !== emp.id) return false
                // Check various date formats
                if (l.leaveDays?.some(d => d.date?.split('T')[0] === todayKey)) return true
                if (l.startDate && l.endDate) {
                    const start = l.startDate.split('T')[0]
                    const end = l.endDate.split('T')[0]
                    return todayKey >= start && todayKey <= end
                }
                return l.date?.split('T')[0] === todayKey
            })
        })
    }, [employees, leaves, todayKey])

    // Upcoming holidays
    const upcomingHolidays = useMemo(() => {
        return holidays
            .filter(h => h.date >= todayKey)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 3)
    }, [holidays, todayKey])

    // Recent feedback
    const recentFeedback = useMemo(() => {
        return [...myFeedback]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)
    }, [myFeedback])

    const cardsById = useMemo(
        () => new Map(feedbackCards.map(c => [c.id, c])),
        [feedbackCards]
    )

    if (isDataLoading || loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    const greeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 17) return 'Good afternoon'
        return 'Good evening'
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            {/* Welcome Header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-[0.3em]">
                        Dashboard
                    </p>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {greeting()}, {employee?.name?.split(' ')[0] || 'there'}!
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Here&apos;s what&apos;s happening with your profile today.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link href="/member/leaves">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 h-12 px-5">
                            <CalendarPlus className="w-4 h-4 mr-2" />
                            Apply Leave
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border border-slate-100 shadow-premium rounded-2xl bg-white">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <CalendarDays className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Leaves Used</p>
                                <p className="text-2xl font-bold text-slate-900">{myLeavesThisYear.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 shadow-premium rounded-2xl bg-white">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Feedback</p>
                                <p className="text-2xl font-bold text-slate-900">{myFeedback.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 shadow-premium rounded-2xl bg-white">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <Star className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Avg Score</p>
                                <p className="text-2xl font-bold text-slate-900">{avgFeedbackScore !== null ? `${avgFeedbackScore}%` : '—'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 shadow-premium rounded-2xl bg-white">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">On Leave Today</p>
                                <p className="text-2xl font-bold text-slate-900">{onLeaveToday.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column - Leave Balance & Recent Feedback */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Leave Balance */}
                    <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Leave Balance</h3>
                                    <p className="text-sm text-slate-500">Your leave quota for this year</p>
                                </div>
                                <Link href="/member/leaves" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                                    View All →
                                </Link>
                            </div>
                            {leaveBalance.length === 0 ? (
                                <p className="text-sm text-slate-500 py-4">No leave types configured for your employment type.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {leaveBalance.map(lb => (
                                        <div key={lb.id} className="rounded-2xl border border-slate-100 p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-slate-700">{lb.name}</span>
                                                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{lb.code}</span>
                                            </div>
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-2xl font-bold text-slate-900">{lb.remaining}</p>
                                                    <p className="text-xs text-slate-500">of {lb.quota} {lb.unit}s remaining</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-amber-600">{lb.used} used</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                                                <div
                                                    className="h-2 rounded-full bg-blue-500"
                                                    style={{ width: `${lb.quota > 0 ? (lb.remaining / lb.quota) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Feedback */}
                    <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Recent Feedback</h3>
                                    <p className="text-sm text-slate-500">Latest feedback you&apos;ve received</p>
                                </div>
                                <Link href="/member/feedback" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                                    View All →
                                </Link>
                            </div>
                            {recentFeedback.length === 0 ? (
                                <div className="py-8 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-sm text-slate-500">No feedback received yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentFeedback.map(entry => {
                                        const card = cardsById.get(entry.cardId)
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        const scoreAnswers = entry.answers.filter((a: any) => a.question?.kind === 'score')
                                        let entryScore: number | null = null
                                        if (scoreAnswers.length > 0) {
                                            let total = 0, max = 0
                                            scoreAnswers.forEach((a: { answer?: string }) => {
                                                const val = parseInt(a.answer || '0', 10)
                                                if (!isNaN(val) && val > 0) { total += val; max += 5 }
                                            })
                                            if (max > 0) entryScore = Math.round((total / max) * 100)
                                        }
                                        return (
                                            <Link
                                                key={entry.id}
                                                href={`/member/feedback/${entry.id}`}
                                                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                                        <TrendingUp className="w-5 h-5 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{card?.title || 'Feedback'}</p>
                                                        <p className="text-xs text-slate-500">From {entry.authorName || 'Anonymous'} • {formatDate(entry.createdAt)}</p>
                                                    </div>
                                                </div>
                                                {entryScore !== null && (
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-slate-900">{entryScore}%</p>
                                                        <p className="text-xs text-slate-500">Score</p>
                                                    </div>
                                                )}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Who's On Leave & Holidays */}
                <div className="space-y-6">
                    {/* Who's On Leave Today */}
                    <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">On Leave Today</h3>
                                    <p className="text-sm text-slate-500">Team members away</p>
                                </div>
                                <Link href="/member/attendance" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                                    View All →
                                </Link>
                            </div>
                            {onLeaveToday.length === 0 ? (
                                <div className="py-6 text-center">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <Users className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <p className="text-sm font-medium text-emerald-600">Everyone is in today!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {onLeaveToday.slice(0, 5).map(emp => (
                                        <div key={emp.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                                {emp.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{emp.name}</p>
                                                <p className="text-xs text-slate-500">{emp.departmentName || emp.department || 'No department'}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {onLeaveToday.length > 5 && (
                                        <p className="text-xs text-center text-slate-500">+{onLeaveToday.length - 5} more</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Upcoming Holidays */}
                    <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                        <CardContent className="p-6">
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-slate-900">Upcoming Holidays</h3>
                                <p className="text-sm text-slate-500">Company holidays ahead</p>
                            </div>
                            {upcomingHolidays.length === 0 ? (
                                <div className="py-6 text-center">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <Calendar className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-sm text-slate-500">No upcoming holidays</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingHolidays.map(holiday => {
                                        const holidayDate = new Date(holiday.date)
                                        const daysUntil = Math.ceil((holidayDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                        return (
                                            <div key={holiday.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex flex-col items-center justify-center">
                                                        <span className="text-xs font-bold text-blue-600 uppercase">
                                                            {holidayDate.toLocaleDateString('en-US', { month: 'short' })}
                                                        </span>
                                                        <span className="text-lg font-bold text-blue-700">{holidayDate.getDate()}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">{holiday.name}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>


                </div>
            </div>
        </div>
    )
}
