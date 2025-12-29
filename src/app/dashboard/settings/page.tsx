'use client'

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Settings, Save, Building2 } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'

export default function SettingsPage() {
    const { currentCompany, updateCompany } = useApp()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        size: ''
    })

    useEffect(() => {
        if (currentCompany) {
            setFormData({
                name: currentCompany.name,
                industry: currentCompany.industry,
                size: currentCompany.size
            })
        }
    }, [currentCompany])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentCompany) return

        setLoading(true)
        try {
            await updateCompany(currentCompany.id, formData)
            toast('Company details updated successfully', 'success')
        } catch (error) {
            toast('Failed to update settings', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (!currentCompany) {
        return null
    }

    return (
        <DashboardShell>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Settings
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Manage your workspace preferences and company profile.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar / Navigation for Settings could go here in future */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="border-none shadow-premium rounded-3xl overflow-hidden">
                            <CardHeader className="p-8 pb-0">
                                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    Company Profile
                                </CardTitle>
                                <CardDescription className="text-slate-500 font-medium">
                                    Update your organization's core information visible on reports and invoices.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-slate-700 font-bold">Company Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                            placeholder="Acme Inc."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="industry" className="text-slate-700 font-bold">Industry</Label>
                                            <Select
                                                value={formData.industry}
                                                onValueChange={(value) => setFormData({ ...formData, industry: value })}
                                            >
                                                <SelectTrigger id="industry" className="h-12 rounded-xl bg-slate-50 border-slate-200">
                                                    <SelectValue placeholder="Select Industry" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="technology">Technology & Software</SelectItem>
                                                    <SelectItem value="finance">Finance & Banking</SelectItem>
                                                    <SelectItem value="healthcare">Healthcare & Medicine</SelectItem>
                                                    <SelectItem value="education">Education</SelectItem>
                                                    <SelectItem value="retail">Retail & E-commerce</SelectItem>
                                                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="size" className="text-slate-700 font-bold">Company Size</Label>
                                            <Select
                                                value={formData.size}
                                                onValueChange={(value) => setFormData({ ...formData, size: value })}
                                            >
                                                <SelectTrigger id="size" className="h-12 rounded-xl bg-slate-50 border-slate-200">
                                                    <SelectValue placeholder="Select Size" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1-10">1-10 Employees</SelectItem>
                                                    <SelectItem value="11-50">11-50 Employees</SelectItem>
                                                    <SelectItem value="51-200">51-200 Employees</SelectItem>
                                                    <SelectItem value="201-500">201-500 Employees</SelectItem>
                                                    <SelectItem value="500+">500+ Employees</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-blue-500/20"
                                            disabled={loading}
                                        >
                                            {loading ? 'Saving...' : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Save Changes
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Additional settings sections could be added here */}
                        {/* <Card className="border-none shadow-premium rounded-3xl overflow-hidden opacity-50">
                            <CardHeader className="p-8">
                                <CardTitle className="text-xl font-bold text-slate-900">Security Settings</CardTitle>
                                <CardDescription>Password management and 2FA (Coming Soon)</CardDescription>
                            </CardHeader>
                        </Card> */}
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}
