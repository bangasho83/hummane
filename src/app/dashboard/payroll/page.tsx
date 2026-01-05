'use client'

import { useMemo, useState } from 'react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Calculator, Search, DollarSign } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'

export default function PayrollPage() {
    const { employees, currentCompany } = useApp()
    const [searchTerm, setSearchTerm] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState('all')
    const [positionFilter, setPositionFilter] = useState('all')
    const [config, setConfig] = useState({
        daysPerMonth: 30,
        hoursPerDay: 8
    })

    const departments = useMemo(() => {
        const unique = [...new Set(employees.map(emp => emp.department))]
        return unique.sort()
    }, [employees])

    const positions = useMemo(() => {
        const unique = [...new Set(employees.map(emp => emp.position))]
        return unique.sort()
    }, [employees])

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch =
                emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.position.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesDepartment = departmentFilter === 'all' || emp.department === departmentFilter
            const matchesPosition = positionFilter === 'all' || emp.position === positionFilter

            return matchesSearch && matchesDepartment && matchesPosition
        })
    }, [employees, searchTerm, departmentFilter, positionFilter])

    const hasActiveFilters = searchTerm || departmentFilter !== 'all' || positionFilter !== 'all'

    const clearFilters = () => {
        setSearchTerm('')
        setDepartmentFilter('all')
        setPositionFilter('all')
    }

    const formatMoney = (amount: number) => formatCurrency(amount, currentCompany?.currency)

    const calculateSalary = (annualSalary: number) => {
        const monthly = annualSalary / 12
        const daily = monthly / (config.daysPerMonth || 1)
        const hourly = daily / (config.hoursPerDay || 1)

        return {
            monthly,
            daily,
            hourly
        }
    }

    const totals = filteredEmployees.reduce(
        (acc, emp) => {
            const salary = calculateSalary(emp.salary)
            acc.monthly += salary.monthly
            acc.daily += salary.daily
            acc.hourly += salary.hourly
            return acc
        },
        { monthly: 0, daily: 0, hourly: 0 }
    )

    return (
        <DashboardShell>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Payroll
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Calculate salary breakdowns based on customizable work schedules.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                                <Calculator className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Payroll Configuration</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Days / Month</Label>
                                <Input
                                    type="number"
                                    value={config.daysPerMonth}
                                    onChange={(e) => setConfig({ ...config, daysPerMonth: Number(e.target.value) })}
                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold text-slate-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hours / Day</Label>
                                <Input
                                    type="number"
                                    value={config.hoursPerDay}
                                    onChange={(e) => setConfig({ ...config, hoursPerDay: Number(e.target.value) })}
                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold text-slate-900"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-b border-slate-100">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex-1 min-w-[300px]">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        placeholder="Search employees..."
                                        className="pl-11 bg-slate-50 border-slate-100 h-12 rounded-2xl focus-visible:ring-blue-500/20"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                    <SelectTrigger className="w-[180px] bg-slate-50 border-slate-100 h-12 rounded-2xl">
                                        <SelectValue placeholder="Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map(dept => (
                                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={positionFilter} onValueChange={setPositionFilter}>
                                    <SelectTrigger className="w-[180px] bg-slate-50 border-slate-100 h-12 rounded-2xl">
                                        <SelectValue placeholder="Position" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Positions</SelectItem>
                                        {positions.map(pos => (
                                            <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="text-slate-500 hover:text-red-500 font-bold"
                                    >
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="pl-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Employee</TableHead>
                                <TableHead className="text-right py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Monthly</TableHead>
                                <TableHead className="text-right py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Daily ({config.daysPerMonth}d)</TableHead>
                                <TableHead className="text-right pr-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Hourly ({config.hoursPerDay}h)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEmployees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="border-0">
                                        <div className="p-20 flex flex-col items-center justify-center text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                                                <DollarSign className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                                {searchTerm ? 'No results found' : 'No Employees Yet'}
                                            </h2>
                                            <p className="text-slate-500 font-medium max-w-sm">
                                                {searchTerm
                                                    ? `We couldn't find any employees matching "${searchTerm}".`
                                                    : 'Add employees to start calculating payroll.'}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEmployees.map((emp) => {
                                    const salary = calculateSalary(emp.salary)
                                    return (
                                        <TableRow key={emp.id} className="hover:bg-slate-50/50 group border-slate-50">
                                            <TableCell className="pl-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                        {emp.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-base">{emp.name}</p>
                                                        <p className="text-xs text-slate-400 font-medium">{emp.position}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-slate-900">
                                                {formatMoney(salary.monthly)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-slate-500">
                                                {formatMoney(salary.daily)}
                                            </TableCell>
                                            <TableCell className="text-right pr-8 font-medium text-slate-500">
                                                {formatMoney(salary.hourly)}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                        {filteredEmployees.length > 0 && (
                            <TableFooter className="bg-slate-50/70">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableCell className="pl-8 py-5 font-extrabold text-slate-900">Totals</TableCell>
                                    <TableCell className="text-right font-extrabold text-slate-900">
                                        {formatMoney(totals.monthly)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-700">
                                        {formatMoney(totals.daily)}
                                    </TableCell>
                                    <TableCell className="text-right pr-8 font-bold text-slate-700">
                                        {formatMoney(totals.hourly)}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>

                    <div className="p-8 border-t border-slate-50 bg-slate-50/30">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {filteredEmployees.length} {filteredEmployees.length === 1 ? 'Employee' : 'Employees'} • Payroll Calculated
                        </p>
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}
