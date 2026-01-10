'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import { Button } from '@/components/ui/button'
import { Plus, CalendarCheck, Briefcase, UserPlus, FileText } from 'lucide-react'
import { StatsCards } from '@/features/dashboard'
import { formatCurrency, formatDate } from '@/lib/utils'
import { EMPLOYMENT_TYPES } from '@/types'

export default function DashboardPage() {
    const router = useRouter()
    const { currentUser, currentCompany, employees, departments, roles, leaveTypes, leaves, jobs, applicants, holidays } = useApp()
    const todayKey = useMemo(() => new Date().toISOString().split('T')[0], [])

    const totalEmployees = employees.length
    const currency = currentCompany?.currency

    const avgSalary = useMemo(() => {
        if (employees.length === 0) return 0
        const total = employees.reduce((sum, emp) => sum + emp.salary, 0)
        return total / employees.length
    }, [employees])

    const employmentCounts = useMemo(() => {
        return employees.reduce<Record<string, number>>((acc, emp) => {
            acc[emp.employmentType] = (acc[emp.employmentType] || 0) + 1
            return acc
        }, {})
    }, [employees])

    const employmentStats = useMemo(() => {
        return EMPLOYMENT_TYPES.map(type => {
            const count = employmentCounts[type] || 0
            const percent = totalEmployees ? Math.round((count / totalEmployees) * 100) : 0
            return { type, count, percent }
        })
    }, [employmentCounts, totalEmployees])

    const topDepartments = useMemo(() => {
        const counts = employees.reduce<Record<string, number>>((acc, emp) => {
            if (!emp.department) return acc
            acc[emp.department] = (acc[emp.department] || 0) + 1
            return acc
        }, {})
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
    }, [employees])

    const currentMonthKey = todayKey ? todayKey.slice(0, 7) : ''

    const onLeaveToday = useMemo(() => {
        if (!todayKey) return 0
        const unique = new Set(
            leaves
                .filter(leave => leave.date.split('T')[0] === todayKey)
                .map(leave => leave.employeeId)
        )
        return unique.size
    }, [leaves, todayKey])

    const leaveEntriesThisMonth = useMemo(() => {
        if (!currentMonthKey) return 0
        return leaves.filter(leave => leave.date.split('T')[0].startsWith(currentMonthKey)).length
    }, [leaves, currentMonthKey])

    const leaveTypeNameById = useMemo(() => {
        return new Map(leaveTypes.map(leaveType => [leaveType.id, leaveType.name]))
    }, [leaveTypes])

    const leaveTypeUsage = useMemo(() => {
        const counts = new Map<string, number>()
        leaves.forEach(leave => {
            const name = leave.leaveTypeId
                ? leaveTypeNameById.get(leave.leaveTypeId) || leave.type
                : leave.type
            const key = name || 'Leave'
            counts.set(key, (counts.get(key) || 0) + 1)
        })
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, count]) => ({ name, count }))
    }, [leaves, leaveTypeNameById])

    const upcomingHolidays = useMemo(() => {
        if (!todayKey) return []
        return holidays
            .filter(holiday => holiday.date >= todayKey)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 3)
    }, [holidays, todayKey])

    const applicantCounts = useMemo(() => {
        return applicants.reduce(
            (acc, applicant) => {
                acc[applicant.status] += 1
                return acc
            },
            {
                new: 0,
                screening: 0,
                interview: 0,
                offer: 0,
                hired: 0,
                rejected: 0
            }
        )
    }, [applicants])

    const activeApplicants =
        applicantCounts.new +
        applicantCounts.screening +
        applicantCounts.interview +
        applicantCounts.offer

    const recentApplicants = useMemo(() => {
        return [...applicants]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)
    }, [applicants])

    const employeeById = useMemo(() => new Map(employees.map(emp => [emp.id, emp])), [employees])

    const latestEmployee = useMemo(() => {
        return [...employees].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    }, [employees])

    const latestLeave = useMemo(() => {
        return [...leaves].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    }, [leaves])

    const latestApplicant = useMemo(() => {
        return [...applicants].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    }, [applicants])

    const activityItems = useMemo(() => {
        const items: { title: string; detail: string; tone: string; icon: typeof UserPlus }[] = []
        if (latestEmployee) {
            items.push({
                title: 'New employee added',
                detail: `${latestEmployee.name} • Joined ${formatDate(latestEmployee.startDate)}`,
                tone: 'bg-blue-100 text-blue-600',
                icon: UserPlus
            })
        }
        if (latestLeave) {
            const employee = employeeById.get(latestLeave.employeeId)
            const leaveName = latestLeave.leaveTypeId
                ? leaveTypeNameById.get(latestLeave.leaveTypeId) || latestLeave.type
                : latestLeave.type
            items.push({
                title: 'Leave registered',
                detail: `${employee?.name || 'Employee'} • ${leaveName || 'Leave'}`,
                tone: 'bg-amber-100 text-amber-600',
                icon: CalendarCheck
            })
        }
        if (latestApplicant) {
            items.push({
                title: 'New applicant',
                detail: `${latestApplicant.fullName} • ${latestApplicant.positionApplied}`,
                tone: 'bg-emerald-100 text-emerald-600',
                icon: FileText
            })
        }
        return items
    }, [employeeById, latestApplicant, latestEmployee, latestLeave, leaveTypeNameById])

    // Redirect if not logged in or no company
    if (!currentUser) {
        router.push('/login')
        return null
    }

    if (!currentCompany) {
        router.push('/company-setup')
        return null
    }

    const handleAddEmployee = () => {
        router.push('/dashboard/team/add')
    }

    return (
        <>
            <section className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                    <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-[0.3em]">
                            Dashboard
                        </p>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Overview
                        </h2>
                        <p className="text-slate-500 font-medium">
                            A real-time snapshot of people, attendance, and hiring at {currentCompany.name}.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            onClick={handleAddEmployee}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 h-12 px-5"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Employee
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard/attendance')}
                            className="rounded-2xl h-12 px-5 font-bold border-slate-200"
                        >
                            <CalendarCheck className="w-4 h-4 mr-2" />
                            Register Leave
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard/jobs/new')}
                            className="rounded-2xl h-12 px-5 font-bold border-slate-200"
                        >
                            <Briefcase className="w-4 h-4 mr-2" />
                            Post Job
                        </Button>
                    </div>
                </div>
                <StatsCards employees={employees} jobs={jobs} leaveTypes={leaveTypes} applicants={applicants} />
            </section>

            <section className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-premium border border-slate-100 xl:col-span-2">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-slate-900">Organization Snapshot</h3>
                        <p className="text-sm text-slate-500">Headcount mix, departments, and core configuration.</p>
                    </div>
    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Departments</p>
                            <p className="text-xl font-bold text-slate-900 mt-2">{departments.length}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Roles</p>
                            <p className="text-xl font-bold text-slate-900 mt-2">{roles.length}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Leave Types</p>
                            <p className="text-xl font-bold text-slate-900 mt-2">{leaveTypes.length}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Avg Salary</p>
                            <p className="text-xl font-bold text-slate-900 mt-2">
                                {formatCurrency(avgSalary, currency)}
                            </p>
                        </div>
                    </div>
    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-4">Employment Type</h4>
                            <div className="space-y-4">
                                {employmentStats.map(stat => (
                                    <div key={stat.type} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-semibold text-slate-700">{stat.type}</span>
                                            <span className="text-slate-500">{stat.count}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                            <div
                                                className="h-2 rounded-full bg-blue-500"
                                                style={{ width: `${stat.percent}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-4">Top Departments</h4>
                            {topDepartments.length === 0 ? (
                                <p className="text-sm text-slate-500">No department assignments yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {topDepartments.map(([dept, count]) => (
                                        <div key={dept} className="flex items-center justify-between text-sm">
                                            <span className="font-semibold text-slate-700">{dept}</span>
                                            <span className="text-slate-500">{count} members</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
    
                <div className="bg-white p-8 rounded-3xl shadow-premium border border-slate-100">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-slate-900">Attendance & Leave</h3>
                        <p className="text-sm text-slate-500">Daily coverage and policy utilization.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">On Leave Today</p>
                            <p className="text-xl font-bold text-slate-900 mt-2">{onLeaveToday}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Leaves This Month</p>
                            <p className="text-xl font-bold text-slate-900 mt-2">{leaveEntriesThisMonth}</p>
                        </div>
                    </div>
    
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-3">Upcoming Holidays</h4>
                            {upcomingHolidays.length === 0 ? (
                                <p className="text-sm text-slate-500">No upcoming holidays scheduled.</p>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingHolidays.map(holiday => (
                                        <div key={holiday.id} className="flex items-center justify-between text-sm">
                                            <span className="font-semibold text-slate-700">{holiday.name}</span>
                                            <span className="text-slate-500">{formatDate(holiday.date)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-3">Top Leave Types</h4>
                            {leaveTypeUsage.length === 0 ? (
                                <p className="text-sm text-slate-500">No leave activity recorded yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {leaveTypeUsage.map(item => (
                                        <div key={item.name} className="flex items-center justify-between text-sm">
                                            <span className="font-semibold text-slate-700">{item.name}</span>
                                            <span className="text-slate-500">{item.count} entries</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-premium border border-slate-100 xl:col-span-2">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-slate-900">Hiring Pipeline</h3>
                        <p className="text-sm text-slate-500">Track open roles and applicant movement.</p>
                    </div>
    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Open Jobs</p>
                            <p className="text-xl font-bold text-slate-900 mt-2">{jobs.filter(job => job.status === 'open').length}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Total Applicants</p>
                            <p className="text-xl font-bold text-slate-900 mt-2">{applicants.length}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Active Applicants</p>
                            <p className="text-xl font-bold text-slate-900 mt-2">{activeApplicants}</p>
                        </div>
                    </div>
    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-4">Stage Breakdown</h4>
                            <div className="space-y-3">
                                {[
                                    { key: 'new', label: 'New', tone: 'bg-blue-100 text-blue-700' },
                                    { key: 'screening', label: 'Screening', tone: 'bg-amber-100 text-amber-700' },
                                    { key: 'interview', label: 'Interview', tone: 'bg-purple-100 text-purple-700' },
                                    { key: 'offer', label: 'Offer', tone: 'bg-emerald-100 text-emerald-700' },
                                    { key: 'hired', label: 'Hired', tone: 'bg-slate-100 text-slate-700' },
                                    { key: 'rejected', label: 'Rejected', tone: 'bg-red-100 text-red-700' }
                                ].map(stage => (
                                    <div key={stage.key} className="flex items-center justify-between text-sm">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stage.tone}`}>
                                            {stage.label}
                                        </span>
                                        <span className="font-semibold text-slate-700">
                                            {applicantCounts[stage.key as keyof typeof applicantCounts]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-4">Recent Applicants</h4>
                            {recentApplicants.length === 0 ? (
                                <p className="text-sm text-slate-500">No applicants yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {recentApplicants.map(applicant => (
                                        <div key={applicant.id} className="flex items-center justify-between text-sm">
                                            <div>
                                                <p className="font-semibold text-slate-700">{applicant.fullName}</p>
                                                <p className="text-xs text-slate-500">{applicant.positionApplied}</p>
                                            </div>
                                            <span className="text-xs text-slate-400">{formatDate(applicant.appliedDate)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
    
                <div className="bg-white p-8 rounded-3xl shadow-premium border border-slate-100">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
                        <p className="text-sm text-slate-500">Latest additions and updates.</p>
                    </div>
                    {activityItems.length === 0 ? (
                        <p className="text-sm text-slate-500">No activity logged yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {activityItems.map(item => (
                                <div key={item.title} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.tone}`}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{item.title}</p>
                                        <p className="text-xs text-slate-500">{item.detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </>
    )
}
