'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Calendar as CalendarIcon, X } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'

const fallbackTimezones = ['UTC', 'EST (UTC -5)', 'PST (UTC -8)', 'CET (UTC +1)', 'IST (UTC +5:30)', 'PKT (UTC +5)']
const currencies = ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED']
const dayKeys = [
    { label: 'Monday', key: 'monday' },
    { label: 'Tuesday', key: 'tuesday' },
    { label: 'Wednesday', key: 'wednesday' },
    { label: 'Thursday', key: 'thursday' },
    { label: 'Friday', key: 'friday' },
    { label: 'Saturday', key: 'saturday' },
    { label: 'Sunday', key: 'sunday' }
] as const

type DayLabel = typeof dayKeys[number]['label']
type ScheduleRow = { day: DayLabel; open: boolean; start: string; end: string }
type SettingsField = 'companyName' | 'timezone' | 'industry' | 'currency'
type SettingsErrors = Partial<Record<SettingsField, string>>

const to12Hour = (time: string) => {
    const trimmed = time.trim()
    if (/[AP]M$/i.test(trimmed)) return trimmed
    const [rawHour, rawMinute] = trimmed.split(':')
    const hour = Number(rawHour)
    const minute = Number(rawMinute ?? '0')
    if (Number.isNaN(hour) || Number.isNaN(minute)) return trimmed
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = ((hour + 11) % 12) + 1
    return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
}

const to24Hour = (time: string) => {
    const trimmed = time.trim()
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i)
    if (!match) return trimmed
    const hour = Number(match[1])
    const minute = match[2]
    const period = match[3].toUpperCase()
    const normalized = period === 'PM' ? (hour % 12) + 12 : hour % 12
    return `${String(normalized).padStart(2, '0')}:${minute}`
}

const formatHolidayDate = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return ''
    return trimmed.split('T')[0] || trimmed
}

export function GeneralTab() {
    const { currentCompany, updateCompany, holidays, createHoliday, deleteHoliday } = useApp()
    const [timezones, setTimezones] = useState<string[]>(fallbackTimezones)
    const [timezone, setTimezone] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [industry, setIndustry] = useState('')
    const [currency, setCurrency] = useState('')
    const [about, setAbout] = useState('')
    const [isEditingSettings, setIsEditingSettings] = useState(false)
    const [settingsLoading, setSettingsLoading] = useState(false)
    const [isEditingAbout, setIsEditingAbout] = useState(false)
    const [aboutLoading, setAboutLoading] = useState(false)
    const [settingsErrors, setSettingsErrors] = useState<SettingsErrors>({})
    const [schedule, setSchedule] = useState<ScheduleRow[]>([])
    const [holidayRows, setHolidayRows] = useState([{ date: '', name: '' }])
    const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false)
    const [isEditingHours, setIsEditingHours] = useState(false)
    const [hoursLoading, setHoursLoading] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('https://aisenseapi.com/services/v1/timezones')
                if (!res.ok) throw new Error('tz fetch failed')
                const data = await res.json()
                if (Array.isArray(data) && data.length) {
                    setTimezones(data)
                    if (!isEditingSettings) {
                        setTimezone(currentCompany?.timezone || '')
                    }
                }
            } catch {
                setTimezones(fallbackTimezones)
                if (!isEditingSettings) {
                    setTimezone(currentCompany?.timezone || '')
                }
            }
        }
        load()
    }, [currentCompany?.timezone, isEditingSettings])

    useEffect(() => {
        if (!currentCompany || isEditingSettings) return
        setCompanyName(currentCompany.name || '')
        setCurrency(currentCompany.currency || '')
        setIndustry(currentCompany.industry || '')
        if (currentCompany.timezone) {
            setTimezone(currentCompany.timezone)
        }
    }, [currentCompany, isEditingSettings])

    useEffect(() => {
        if (!currentCompany || isEditingAbout) return
        setAbout(currentCompany.about || '')
    }, [currentCompany, isEditingAbout])

    useEffect(() => {
        if (!currentCompany || isEditingHours) return
        if (!currentCompany.workingHours) {
            setSchedule([])
            return
        }
        const nextSchedule = dayKeys.map(({ label, key }) => {
            const entry = currentCompany.workingHours?.[key]
            return {
                day: label,
                open: entry?.open ?? false,
                start: entry?.start ? to24Hour(entry.start) : '',
                end: entry?.end ? to24Hour(entry.end) : ''
            }
        })
        setSchedule(nextSchedule)
    }, [currentCompany, isEditingHours])

    const handleCurrencyChange = (value: string) => {
        setCurrency(value)
        if (settingsErrors.currency) {
            setSettingsErrors((prev) => {
                const next = { ...prev }
                delete next.currency
                return next
            })
        }
    }

    const handleIndustryChange = (value: string) => {
        setIndustry(value)
        if (settingsErrors.industry) {
            setSettingsErrors((prev) => {
                const next = { ...prev }
                delete next.industry
                return next
            })
        }
    }

    const handleTimezoneChange = (value: string) => {
        setTimezone(value)
        if (settingsErrors.timezone) {
            setSettingsErrors((prev) => {
                const next = { ...prev }
                delete next.timezone
                return next
            })
        }
    }

    const handleCompanyNameChange = (value: string) => {
        setCompanyName(value)
        if (settingsErrors.companyName) {
            setSettingsErrors((prev) => {
                const next = { ...prev }
                delete next.companyName
                return next
            })
        }
    }

    const handleSaveSettings = async () => {
        if (!currentCompany) return
        const trimmedName = companyName.trim()
        const trimmedTimezone = timezone.trim()
        const trimmedIndustry = industry.trim()
        const trimmedCurrency = currency.trim()
        const nextErrors: SettingsErrors = {}

        if (!trimmedName) nextErrors.companyName = 'Company name is required'
        if (!trimmedTimezone) nextErrors.timezone = 'Timezone is required'
        if (!trimmedIndustry) nextErrors.industry = 'Industry is required'
        if (!trimmedCurrency) nextErrors.currency = 'Currency is required'

        if (Object.keys(nextErrors).length > 0) {
            setSettingsErrors(nextErrors)
            toast('Please fill in all required fields', 'error')
            return
        }

        setSettingsLoading(true)
        setSettingsErrors({})
        try {
            await updateCompany(currentCompany.id, {
                name: trimmedName,
                industry: trimmedIndustry,
                currency: trimmedCurrency,
                timezone: trimmedTimezone
            })
            toast('Company settings updated', 'success')
            setIsEditingSettings(false)
        } catch (error: any) {
            toast(error?.message || 'Failed to update company settings', 'error')
        } finally {
            setSettingsLoading(false)
        }
    }

    const handleCancelSettings = () => {
        if (currentCompany) {
            setCompanyName(currentCompany.name || '')
            setIndustry(currentCompany.industry || '')
            setCurrency(currentCompany.currency || '')
            setTimezone(currentCompany.timezone || '')
        }
        setSettingsErrors({})
        setIsEditingSettings(false)
    }

    const handleSaveHours = async () => {
        if (!currentCompany) return
        setHoursLoading(true)
        try {
            const workingHours = dayKeys.reduce((acc, { key }, index) => {
                const row = schedule[index]
                acc[key] = {
                    open: row.open,
                    start: to12Hour(row.start),
                    end: to12Hour(row.end)
                }
                return acc
            }, {} as Record<string, { open: boolean; start: string; end: string }>)

            await updateCompany(currentCompany.id, {
                industry,
                currency,
                timezone,
                workingHours: workingHours as typeof currentCompany.workingHours
            })
            toast('Working hours updated', 'success')
            setIsEditingHours(false)
        } catch (error: any) {
            toast(error?.message || 'Failed to update working hours', 'error')
        } finally {
            setHoursLoading(false)
        }
    }

    const handleSaveAbout = async () => {
        if (!currentCompany) return
        setAboutLoading(true)
        try {
            await updateCompany(currentCompany.id, {
                about: about.trim()
            })
            toast('Company overview updated', 'success')
            setIsEditingAbout(false)
        } catch (error: any) {
            toast(error?.message || 'Failed to update company overview', 'error')
        } finally {
            setAboutLoading(false)
        }
    }

    const handleCancelAbout = () => {
        setAbout(currentCompany?.about || '')
        setIsEditingAbout(false)
    }

    const handleCancelHours = () => {
        if (currentCompany?.workingHours) {
            const nextSchedule = dayKeys.map(({ label, key }) => {
                const entry = currentCompany.workingHours?.[key]
                return {
                    day: label,
                    open: entry?.open ?? false,
                    start: entry?.start ? to24Hour(entry.start) : '09:00',
                    end: entry?.end ? to24Hour(entry.end) : '17:00'
                }
            })
            setSchedule(nextSchedule)
        } else {
            setSchedule([])
        }
        setIsEditingHours(false)
    }

    const handleEditHours = () => {
        if (schedule.length === 0) {
            setSchedule(
                dayKeys.map(({ label }) => ({
                    day: label,
                    open: false,
                    start: '',
                    end: ''
                }))
            )
        }
        setIsEditingHours(true)
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

    const saveHolidays = async () => {
        const cleaned = holidayRows
            .filter((row) => row.date && row.name)
            .map((row) => ({ date: row.date, name: row.name }))
        if (cleaned.length === 0) {
            setIsHolidayDialogOpen(false)
            return
        }
        try {
            await Promise.all(
                cleaned.map((h) => createHoliday({ date: h.date, name: h.name }))
            )
            setHolidayRows([{ date: '', name: '' }])
            setIsHolidayDialogOpen(false)
        } catch (error: any) {
            console.error(error)
        }
    }

    const removeHoliday = async (id: string) => {
        try {
            await deleteHoliday(id)
        } catch (error) {
            console.error(error)
        }
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
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-700">Company Defaults</p>
                            {isEditingSettings ? (
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-xl border-slate-200"
                                        onClick={handleCancelSettings}
                                        disabled={settingsLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        className="rounded-xl bg-blue-600 text-white"
                                        onClick={handleSaveSettings}
                                        disabled={settingsLoading}
                                    >
                                        {settingsLoading ? 'Saving...' : 'Save'}
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-xl border-slate-200"
                                    onClick={() => {
                                        setIsEditingSettings(true)
                                        setSettingsErrors({})
                                    }}
                                >
                                    Edit
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">Company Name</Label>
                            {isEditingSettings ? (
                                <Input
                                    value={companyName}
                                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                                    className={`h-12 rounded-xl border-slate-200 ${settingsErrors.companyName ? 'border-red-500' : ''}`}
                                    placeholder="Enter company name"
                                    required
                                />
                            ) : (
                                <div className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 flex items-center text-sm font-medium text-slate-700">
                                    {companyName || 'Not set'}
                                </div>
                            )}
                            {isEditingSettings && settingsErrors.companyName && (
                                <p className="text-xs text-red-600 mt-1">{settingsErrors.companyName}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">Timezone</Label>
                            {isEditingSettings ? (
                                <Select value={timezone} onValueChange={handleTimezoneChange}>
                                    <SelectTrigger className={`h-12 rounded-xl border-slate-200 ${settingsErrors.timezone ? 'border-red-500' : ''}`}>
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
                            ) : (
                                <div className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 flex items-center text-sm font-medium text-slate-700">
                                    {timezone || 'Not set'}
                                </div>
                            )}
                            {isEditingSettings && settingsErrors.timezone && (
                                <p className="text-xs text-red-600 mt-1">{settingsErrors.timezone}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">Industry</Label>
                            {isEditingSettings ? (
                                <Select value={industry} onValueChange={handleIndustryChange}>
                                    <SelectTrigger className={`h-12 rounded-xl border-slate-200 ${settingsErrors.industry ? 'border-red-500' : ''}`}>
                                        <SelectValue placeholder="Select industry" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Technology">Technology</SelectItem>
                                        <SelectItem value="Finance">Finance</SelectItem>
                                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                                        <SelectItem value="Retail">Retail</SelectItem>
                                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                                        <SelectItem value="Education">Education</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 flex items-center text-sm font-medium text-slate-700">
                                    {industry || 'Not set'}
                                </div>
                            )}
                            {isEditingSettings && settingsErrors.industry && (
                                <p className="text-xs text-red-600 mt-1">{settingsErrors.industry}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">Currency</Label>
                            {isEditingSettings ? (
                                <Select value={currency} onValueChange={handleCurrencyChange}>
                                    <SelectTrigger className={`h-12 rounded-xl border-slate-200 ${settingsErrors.currency ? 'border-red-500' : ''}`}>
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currencies.map((c) => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 flex items-center text-sm font-medium text-slate-700">
                                    {currency || 'Not set'}
                                </div>
                            )}
                            {isEditingSettings && settingsErrors.currency && (
                                <p className="text-xs text-red-600 mt-1">{settingsErrors.currency}</p>
                            )}
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
                            {isEditingHours ? (
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-xl border-slate-200"
                                        onClick={handleCancelHours}
                                        disabled={hoursLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        className="rounded-xl bg-blue-600 text-white"
                                        onClick={handleSaveHours}
                                        disabled={hoursLoading}
                                    >
                                        {hoursLoading ? 'Saving...' : 'Save'}
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-xl border-slate-200"
                                    onClick={handleEditHours}
                                >
                                    Edit
                                </Button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {schedule.length === 0 && !isEditingHours ? (
                                <div className="text-sm font-medium text-slate-500">Not set</div>
                            ) : (
                                schedule.map((row) => (
                                    <div
                                        key={row.day}
                                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/50"
                                    >
                                        <div className="w-28 font-bold text-slate-800">{row.day}</div>
                                        {isEditingHours ? (
                                            <>
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
                                            </>
                                        ) : (
                                            <div className="text-sm font-semibold text-slate-700">
                                                {row.open
                                                    ? row.start && row.end
                                                        ? `${to12Hour(row.start)} – ${to12Hour(row.end)}`
                                                        : 'Not set'
                                                    : 'Closed'}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-700 px-1">Company Overview</p>
                            <p className="text-xs text-slate-500 font-medium">Share a short profile of your organization.</p>
                        </div>
                        {isEditingAbout ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-xl border-slate-200"
                                    onClick={handleCancelAbout}
                                    disabled={aboutLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    className="rounded-xl bg-blue-600 text-white"
                                    onClick={handleSaveAbout}
                                    disabled={aboutLoading}
                                >
                                    {aboutLoading ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl border-slate-200"
                                onClick={() => setIsEditingAbout(true)}
                            >
                                Edit
                            </Button>
                        )}
                    </div>

                    {isEditingAbout ? (
                        <Textarea
                            value={about}
                            onChange={(e) => setAbout(e.target.value)}
                            className="min-h-[140px] rounded-xl border-slate-200"
                            placeholder="Write a professional overview about your company..."
                        />
                    ) : (
                        <div className="min-h-[140px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">
                            {about || 'No company overview added yet.'}
                        </div>
                    )}
                </CardContent>
            </Card>

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
                                    <span className="text-xs text-blue-500">{formatHolidayDate(h.date)}</span>
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
