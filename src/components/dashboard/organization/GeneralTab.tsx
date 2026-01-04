'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Calendar as CalendarIcon, X } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'

const fallbackTimezones = ['UTC', 'EST (UTC -5)', 'PST (UTC -8)', 'CET (UTC +1)', 'IST (UTC +5:30)', 'PKT (UTC +5)']
const currencies = ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED']

export function GeneralTab() {
    const { currentCompany, updateCompany, holidays, createHoliday, deleteHoliday } = useApp()
    const [timezones, setTimezones] = useState<string[]>(fallbackTimezones)
    const [timezone, setTimezone] = useState('UTC')
    const [currency, setCurrency] = useState('')
    const [schedule, setSchedule] = useState(() => [
        { day: 'Monday', open: true, start: '09:00', end: '17:00' },
        { day: 'Tuesday', open: true, start: '09:00', end: '17:00' },
        { day: 'Wednesday', open: true, start: '09:00', end: '17:00' },
        { day: 'Thursday', open: true, start: '09:00', end: '17:00' },
        { day: 'Friday', open: true, start: '09:00', end: '17:00' },
        { day: 'Saturday', open: false, start: '09:00', end: '17:00' },
        { day: 'Sunday', open: false, start: '09:00', end: '17:00' },
    ])
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

    useEffect(() => {
        if (currentCompany?.currency !== undefined) {
            setCurrency(currentCompany.currency || '')
        }
    }, [currentCompany])

    const handleCurrencyChange = (value: string) => {
        setCurrency(value)
        if (currentCompany) {
            updateCompany(currentCompany.id, { currency: value })
        }
    }

    const toggleDay = (day: string) => {
        setSchedule((prev) =>
            prev.map((row) => (row.day === day ? { ...row, open: !row.open } : row))
        )
    }

    const updateHours = (day: string, field: 'start' | 'end', value: string) => {
        setSchedule((prev) =>
            prev.map((row) => (row.day === day ? { ...row, [field]: value } : row))
        )
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
                            <Select value={currency} onValueChange={handleCurrencyChange}>
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
                                <p className="text-xs text-slate-500 font-medium">Choose working days and hours.</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {schedule.map((row) => (
                                <div
                                    key={row.day}
                                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/50"
                                >
                                    <div className="w-28 font-bold text-slate-800">{row.day}</div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleDay(row.day)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${row.open ? 'bg-blue-600' : 'bg-slate-300'
                                                }`}
                                            aria-pressed={row.open}
                                        >
                                            <span
                                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${row.open ? 'translate-x-5' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                        <span className="text-sm font-semibold text-slate-700">
                                            {row.open ? 'Open' : 'Closed'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-1">
                                        <Input
                                            type="time"
                                            value={row.start}
                                            disabled={!row.open}
                                            onChange={(e) => updateHours(row.day, 'start', e.target.value)}
                                            className="h-11 rounded-xl border-slate-200 max-w-[140px]"
                                        />
                                        <span className="text-slate-400 font-semibold">—</span>
                                        <Input
                                            type="time"
                                            value={row.end}
                                            disabled={!row.open}
                                            onChange={(e) => updateHours(row.day, 'end', e.target.value)}
                                            className="h-11 rounded-xl border-slate-200 max-w-[140px]"
                                        />
                                    </div>
                                </div>
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
