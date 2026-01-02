'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Calendar as CalendarIcon, X } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'

const fallbackTimezones = ['UTC', 'EST (UTC -5)', 'PST (UTC -8)', 'CET (UTC +1)', 'IST (UTC +5:30)', 'PKT (UTC +5)']
const currencies = ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED']
const workingHoursDefaultStart = 9
const workingHoursDefaultEnd = 17

export function GeneralTab() {
    const { holidays, createHoliday, deleteHoliday } = useApp()
    const [timezones, setTimezones] = useState<string[]>(fallbackTimezones)
    const [timezone, setTimezone] = useState('UTC')
    const [currency, setCurrency] = useState('USD')
    const [hours, setHours] = useState<boolean[]>(() =>
        Array.from({ length: 24 }, (_, i) => i >= workingHoursDefaultStart && i < workingHoursDefaultEnd)
    )
    const [holidayRows, setHolidayRows] = useState([{ date: '', name: '' }])
    const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('https://aisenseapi.com/services/v1/timezones')
                if (!res.ok) throw new Error('tz fetch failed')
                const data = await res.json()
                if (Array.isArray(data) && data.length) {
                    setTimezones(data)
                    setTimezone(data[0])
                }
            } catch {
                setTimezones(fallbackTimezones)
                setTimezone(fallbackTimezones[0])
            }
        }
        load()
    }, [])

    const selectedRange = useMemo(() => {
        const selectedHours = hours.map((val, idx) => (val ? idx : null)).filter((v) => v !== null) as number[]
        if (selectedHours.length === 0) return 'No hours selected'
        const min = Math.min(...selectedHours)
        const max = Math.max(...selectedHours) + 1
        return `${min.toString().padStart(2, '0')}:00 - ${max.toString().padStart(2, '0')}:00`
    }, [hours])

    const toggleHour = (index: number) => {
        setHours((prev) => prev.map((v, i) => (i === index ? !v : v)))
    }

    const addHolidayRows = () => {
        setHolidayRows((prev) => [...prev, { date: '', name: '' }])
    }

    const updateHolidayRow = (index: number, field: 'date' | 'name', value: string) => {
        setHolidayRows((prev) =>
            prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
        )
    }

    const saveHolidays = () => {
        const cleaned = holidayRows
            .filter((row) => row.date && row.name)
            .map((row) => ({ date: row.date, name: row.name }))
        if (cleaned.length === 0) {
            setIsHolidayDialogOpen(false)
            return
        }
        try {
            cleaned.forEach((h) => {
                createHoliday({ date: h.date, name: h.name })
            })
            setHolidayRows([{ date: '', name: '' }])
            setIsHolidayDialogOpen(false)
        } catch (error: any) {
            console.error(error)
        }
    }

    const removeHoliday = (id: string) => {
        deleteHoliday(id)
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        General Settings
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Configure time, currency, and working hours for your organization.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">Timezone</Label>
                            <Select value={timezone} onValueChange={setTimezone}>
                                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                    <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                    {timezones.map((tz) => (
                                        <SelectItem key={tz} value={tz}>
                                            {tz}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">Currency</Label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currencies.map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-700 px-1">Working Hours</p>
                                <p className="text-xs text-slate-500 font-medium">{selectedRange}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-2">
                            {hours.map((selected, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => toggleHour(idx)}
                                    className={cn(
                                        "rounded-xl border text-xs font-semibold px-2 py-3 transition-all",
                                        selected
                                            ? "bg-blue-600 text-white border-blue-500 shadow-blue-500/20 shadow-md"
                                            : "bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-200"
                                    )}
                                >
                                    {idx.toString().padStart(2, '0')}:00
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-700 px-1">Holidays</p>
                            <p className="text-xs text-slate-500 font-medium">Add upcoming holidays for your org calendar.</p>
                        </div>
                        <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl bg-blue-600 text-white font-bold shadow-blue-500/20">
                                    <Plus className="w-4 h-4 mr-2" /> Add Holiday
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg rounded-3xl bg-white border-slate-200">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-slate-900">Add Holidays</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    {holidayRows.map((row, idx) => (
                                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">Date</Label>
                                                <Input
                                                    type="date"
                                                    className="h-12 rounded-xl border-slate-200"
                                                    value={row.date}
                                                    onChange={(e) => updateHolidayRow(idx, 'date', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 px-1">Holiday Name</Label>
                                                <Input
                                                    placeholder="Founders Day"
                                                    className="h-12 rounded-xl border-slate-200"
                                                    value={row.name}
                                                    onChange={(e) => updateHolidayRow(idx, 'name', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2">
                                        <Button type="button" variant="ghost" onClick={addHolidayRows} className="rounded-xl text-slate-600">
                                            <Plus className="w-4 h-4 mr-2" /> Add another
                                        </Button>
                                        <div className="flex gap-3">
                                            <Button variant="outline" onClick={() => setIsHolidayDialogOpen(false)} className="rounded-xl border-slate-200">
                                                Cancel
                                            </Button>
                                            <Button onClick={saveHolidays} className="rounded-xl bg-blue-600 text-white">
                                                Save Holidays
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {holidays.length === 0 ? (
                        <div className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4">
                            No holidays added yet. Add upcoming dates to keep everyone aligned.
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {holidays.map((h) => (
                                <div
                                    key={h.id}
                                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-sm font-semibold"
                                >
                                    <CalendarIcon className="w-4 h-4" />
                                    <span>{h.name}</span>
                                    <span className="text-xs text-blue-500">{h.date}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeHoliday(h.id)}
                                        className="text-blue-500 hover:text-blue-700"
                                        aria-label="Remove holiday"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
