'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Briefcase, CalendarCheck, UserCheck } from 'lucide-react'
import type { Applicant, Employee, Job, LeaveType } from '@/types'

interface StatsCardsProps {
    employees: Employee[]
    jobs: Job[]
    leaveTypes: LeaveType[]
    applicants: Applicant[]
}

export function StatsCards({ employees, jobs, leaveTypes, applicants }: StatsCardsProps) {
    const stats = useMemo(() => {
        const totalEmployees = employees.length
        const openJobs = jobs.filter(job => job.status === 'open').length
        const activeLeaveTypes = leaveTypes.length
        const activeApplicants = applicants.filter(app => app.status !== 'rejected' && app.status !== 'hired').length

        return {
            totalEmployees,
            openJobs,
            activeLeaveTypes,
            activeApplicants
        }
    }, [employees, jobs, leaveTypes, applicants])

    const cards = [
        {
            title: 'Total Employees',
            value: stats.totalEmployees.toString(),
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            gradient: 'from-blue-600/10 to-transparent',
            caption: 'Active team members'
        },
        {
            title: 'Open Jobs',
            value: stats.openJobs.toString(),
            icon: Briefcase,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            gradient: 'from-indigo-600/10 to-transparent',
            caption: 'Hiring in progress'
        },
        {
            title: 'Leave Types',
            value: stats.activeLeaveTypes.toString(),
            icon: CalendarCheck,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            gradient: 'from-emerald-600/10 to-transparent',
            caption: 'Configured policies'
        },
        {
            title: 'Active Applicants',
            value: stats.activeApplicants.toString(),
            icon: UserCheck,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            gradient: 'from-amber-600/10 to-transparent',
            caption: 'In the pipeline'
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card) => (
                <Card key={card.title} className="relative overflow-hidden border-none shadow-premium hover:shadow-hover transition-all duration-300 group">
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.gradient} rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`} />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {card.title}
                        </CardTitle>
                        <div className={`${card.bgColor} p-2 rounded-xl transition-transform group-hover:scale-110`}>
                            <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{card.value}</div>
                        <p className="text-[11px] text-slate-400 mt-1 font-medium">{card.caption}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
