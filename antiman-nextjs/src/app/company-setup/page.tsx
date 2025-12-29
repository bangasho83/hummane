'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'

export default function CompanySetupPage() {
    const router = useRouter()
    const { currentUser, createCompany } = useApp()
    const [companyName, setCompanyName] = useState('')
    const [industry, setIndustry] = useState('')
    const [size, setSize] = useState('')
    const [loading, setLoading] = useState(false)

    // Redirect if not logged in
    if (!currentUser) {
        router.push('/login')
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await createCompany(companyName, industry, size)
            toast('Company created successfully!', 'success')
            setTimeout(() => {
                router.push('/dashboard')
            }, 100)
        } catch (error) {
            toast('Failed to create company', 'error')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Set Up Your Company</h1>
                    <p className="text-slate-600">Tell us about your organization</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Company Information</CardTitle>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="company-name">Company Name</Label>
                                <Input
                                    id="company-name"
                                    type="text"
                                    placeholder="Acme Corporation"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="industry">Industry</Label>
                                    <Select value={industry} onValueChange={setIndustry} required>
                                        <SelectTrigger id="industry">
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
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="size">Company Size</Label>
                                    <Select value={size} onValueChange={setSize} required>
                                        <SelectTrigger id="size">
                                            <SelectValue placeholder="Select size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1-10">1-10 employees</SelectItem>
                                            <SelectItem value="11-50">11-50 employees</SelectItem>
                                            <SelectItem value="51-200">51-200 employees</SelectItem>
                                            <SelectItem value="201-500">201-500 employees</SelectItem>
                                            <SelectItem value="500+">500+ employees</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading || !industry || !size}>
                                {loading ? 'Setting up...' : 'Continue to Dashboard'}
                            </Button>
                        </CardContent>
                    </form>
                </Card>
            </div>
        </div>
    )
}
