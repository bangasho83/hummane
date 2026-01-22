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
import { LogOut, Copy, ChevronDown, ChevronUp } from 'lucide-react'

export default function CompanySetupPage() {
    const router = useRouter()
    const { currentUser, currentCompany, createCompany, logout, isHydrating, authLoginResponse, apiCompanyId } = useApp()
    const [companyName, setCompanyName] = useState('')
    const [industry, setIndustry] = useState('')
    const [size, setSize] = useState<CompanySize | ''>('')
    const [loading, setLoading] = useState(false)
    const [debugExpanded, setDebugExpanded] = useState(true)

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hummane-api.vercel.app'

    // Build curl command for the auth/login call
    const curlCommand = `curl -X POST "${API_BASE_URL}/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"firebaseToken": "<FIREBASE_ID_TOKEN>"}'`

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast('Copied to clipboard', 'success')
    }

    useEffect(() => {
        if (isHydrating) return
        if (!currentUser) {
            router.push('/login')
            return
        }
        if (currentCompany) {
            router.push('/dashboard')
        }
    }, [currentCompany, currentUser, router, isHydrating])

    if (isHydrating || !currentUser || currentCompany) {
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
                {/* API Debug Panel */}
                <div className="mb-6 bg-slate-900 text-white rounded-lg overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setDebugExpanded(!debugExpanded)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                        <span className="font-semibold">🔧 API Debug Info</span>
                        {debugExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    {debugExpanded && (
                        <div className="p-4 space-y-4 text-sm">
                            {/* State Values */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-yellow-400">Current State:</span>
                                </div>
                                <div className="bg-slate-800 p-3 rounded text-xs space-y-1">
                                    <div><span className="text-gray-400">currentCompany:</span> <span className="text-green-400">{currentCompany ? JSON.stringify(currentCompany, null, 2).substring(0, 100) + '...' : 'null'}</span></div>
                                    <div><span className="text-gray-400">apiCompanyId:</span> <span className="text-green-400">{apiCompanyId || 'null'}</span></div>
                                    <div><span className="text-gray-400">currentUser?.id:</span> <span className="text-green-400">{currentUser?.id || 'null'}</span></div>
                                    <div><span className="text-gray-400">currentUser?.email:</span> <span className="text-green-400">{currentUser?.email || 'null'}</span></div>
                                </div>
                            </div>

                            {/* Curl Command */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-blue-400">cURL Command (POST /auth/login):</span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(curlCommand)}
                                        className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded"
                                    >
                                        <Copy className="w-3 h-3" /> Copy
                                    </button>
                                </div>
                                <pre className="bg-slate-800 p-3 rounded overflow-x-auto text-xs whitespace-pre-wrap">{curlCommand}</pre>
                            </div>

                            {/* API Response */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-green-400">Auth Login Response (authLoginResponse):</span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(JSON.stringify(authLoginResponse, null, 2))}
                                        className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded"
                                    >
                                        <Copy className="w-3 h-3" /> Copy
                                    </button>
                                </div>
                                <pre className="bg-slate-800 p-3 rounded overflow-x-auto text-xs max-h-64 overflow-y-auto whitespace-pre-wrap">
                                    {authLoginResponse ? JSON.stringify(authLoginResponse, null, 2) : 'null (not available - may have already been consumed)'}
                                </pre>
                            </div>

                            {/* Why you're seeing this page */}
                            <div className="bg-red-900/30 border border-red-500 p-3 rounded">
                                <span className="font-semibold text-red-400">Why am I seeing this page?</span>
                                <p className="text-xs mt-1 text-gray-300">
                                    This page is shown when <code className="bg-slate-700 px-1 rounded">currentCompany</code> is <code className="bg-slate-700 px-1 rounded">null</code>.
                                    For invited users, the <code className="bg-slate-700 px-1 rounded">/auth/login</code> response should include the company they were invited to.
                                    Check if <code className="bg-slate-700 px-1 rounded">authLoginResponse.company</code> or <code className="bg-slate-700 px-1 rounded">authLoginResponse.user.companyId</code> has the company info.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

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
