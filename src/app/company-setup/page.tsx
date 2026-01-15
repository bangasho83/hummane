'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'
import { COMPANY_SIZES, type CompanySize } from '@/types'
import { LogOut } from 'lucide-react'

export default function CompanySetupPage() {
    const router = useRouter()
    const { currentUser, currentCompany, createCompany, logout } = useApp()
    const [companyName, setCompanyName] = useState('')
    const [industry, setIndustry] = useState('')
    const [size, setSize] = useState<CompanySize | ''>('')
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        if (!currentUser) {
            router.push('/login')
            return
        }
        if (currentCompany) {
            router.push('/dashboard')
        }
    }, [currentCompany, currentUser, router])

    if (!currentUser || currentCompany) {
        return null
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!size) {
                setLoading(false)
                return
            }
            await createCompany(companyName, industry, size)
            toast('Company created successfully!', 'success')
            setTimeout(() => {
                router.push('/dashboard')
            }, 100)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create company'
            toast(message, 'error')
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
                                    <Select value={size} onValueChange={(value) => setSize(value as CompanySize)} required>
                                        <SelectTrigger id="size">
                                            <SelectValue placeholder="Select size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COMPANY_SIZES.map((range) => (
                                                <SelectItem key={range} value={range}>
                                                    {range} employees
                                                </SelectItem>
                                            ))}
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

                <div className="mt-6 text-center">
                    <button
                        onClick={async () => {
                            try {
                                await logout()
                                router.push('/login')
                            } catch {
                                toast('Failed to logout. Please try again.', 'error')
                            }
                        }}
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    )
}
