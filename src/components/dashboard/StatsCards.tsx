'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building2, DollarSign, UserPlus } from 'lucide-react'
import type { Employee } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { useApp } from '@/lib/context/AppContext'

interface StatsCardsProps {
    employees: Employee[]
}

export function StatsCards({ employees }: StatsCardsProps) {
    const { currentCompany } = useApp()
    const stats = useMemo(() => {
        const totalEmployees = employees.length

        const uniqueDepartments = new Set(employees.map(emp => emp.department)).size

        const totalSalary = employees.reduce((sum, emp) => sum + emp.salary, 0)
        const avgSalary = totalEmployees > 0 ? totalSalary / totalEmployees : 0

        // Find newest hire
        const newestHire = [...employees].sort((a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        )[0]

        return {
            totalEmployees,
            uniqueDepartments,
            avgSalary,
            newestHireName: newestHire?.name || 'N/A'
        }
    }, [employees])

    const cards = [
        {
            title: 'Total Employees',
            value: stats.totalEmployees.toString(),
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            gradient: 'from-blue-600/10 to-transparent'
        },
        {
            title: 'Departments',
            value: stats.uniqueDepartments.toString(),
            icon: Building2,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            gradient: 'from-purple-600/10 to-transparent'
        },
        {
            title: 'Average Salary',
            value: formatCurrency(stats.avgSalary, currentCompany?.currency),
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            gradient: 'from-green-600/10 to-transparent'
        },
        {
            title: 'Newest Hire',
            value: stats.newestHireName,
            icon: UserPlus,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            gradient: 'from-orange-600/10 to-transparent'
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
                        <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Updated just now</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
