'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/context/AppContext'
import { fetchApiKeyApi, generateApiKeyApi } from '@/lib/api/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { Copy, Eye, EyeOff, FileCode, Key, Loader2, RefreshCw, Shield } from 'lucide-react'

export default function SettingsPage() {
    const { apiAccessToken } = useApp()
    const [showToken, setShowToken] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [apiKey, setApiKey] = useState<string | null>(null)

    // Fetch existing API key on mount
    useEffect(() => {
        const fetchExistingKey = async () => {
            if (!apiAccessToken) {
                setIsLoading(false)
                return
            }
            try {
                const response = await fetchApiKeyApi(apiAccessToken)
                if (response?.apiKey) {
                    setApiKey(response.apiKey)
                }
            } catch (error) {
                console.error('Failed to fetch existing API key:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchExistingKey()
    }, [apiAccessToken])

    const handleCopyToken = async () => {
        if (!apiKey) {
            toast('No API key available. Please generate one first.', 'error')
            return
        }
        try {
            await navigator.clipboard.writeText(apiKey)
            toast('API key copied to clipboard', 'success')
        } catch {
            toast('Failed to copy API key', 'error')
        }
    }

    const handleGenerateApiKey = async () => {
        if (!apiAccessToken) {
            toast('You must be logged in to generate an API key', 'error')
            return
        }

        setIsGenerating(true)
        try {
            const response = await generateApiKeyApi(apiAccessToken)
            setApiKey(response.apiKey)
            toast(apiKey ? 'API key regenerated successfully' : 'API key generated successfully', 'success')
        } catch (error: any) {
            toast(error?.message || 'Failed to generate API key', 'error')
        } finally {
            setIsGenerating(false)
        }
    }

    const maskedApiKey = apiKey
        ? `${apiKey.slice(0, 10)}${'•'.repeat(30)}${apiKey.slice(-6)}`
        : null

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Settings
                </h1>
                <p className="text-slate-500 font-medium">
                    Manage your account settings and API access.
                </p>
            </div>

            <div className="space-y-6">
                {/* API Key Section */}
                <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                <Key className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">API Key</h2>
                                <p className="text-sm text-slate-500">Use this key to authenticate API requests</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="text-center py-8">
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                                    <p className="text-slate-500 font-medium">Loading API key...</p>
                                </div>
                            ) : apiKey ? (
                                <>
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-slate-700">Your API Key</p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 relative">
                                                <Input
                                                    type={showToken ? 'text' : 'password'}
                                                    value={showToken ? apiKey : maskedApiKey || ''}
                                                    readOnly
                                                    className="pr-12 font-mono text-sm bg-slate-50 border-slate-200 rounded-xl h-12"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowToken(!showToken)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            <Button
                                                onClick={handleCopyToken}
                                                variant="outline"
                                                className="h-12 px-4 rounded-xl border-slate-200 hover:bg-slate-50"
                                            >
                                                <Copy className="w-4 h-4 mr-2" />
                                                Copy
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                        <Shield className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold text-amber-800">Keep your API key secure</p>
                                            <p className="text-sm text-amber-700 mt-1">
                                                Never share your API key publicly or commit it to version control.
                                                Use environment variables to store it securely.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <Button
                                            onClick={handleGenerateApiKey}
                                            variant="outline"
                                            disabled={isGenerating}
                                            className="rounded-xl border-slate-200 hover:bg-slate-50"
                                        >
                                            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                                            {isGenerating ? 'Regenerating...' : 'Regenerate API Key'}
                                        </Button>
                                        <p className="text-xs text-slate-400 mt-2">
                                            Regenerating will invalidate your current API key. Any applications using the old key will need to be updated.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Key className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-600 font-medium mb-2">No API key generated yet</p>
                                    <p className="text-sm text-slate-400 mb-6">
                                        Generate an API key to authenticate your API requests
                                    </p>
                                    <Button
                                        onClick={handleGenerateApiKey}
                                        disabled={isGenerating}
                                        className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Key className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-pulse' : ''}`} />
                                        {isGenerating ? 'Generating...' : 'Generate API Key'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* API Documentation Section */}
                <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                <FileCode className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">API Documentation</h2>
                                <p className="text-sm text-slate-500">Use these endpoints to integrate with your website</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Get Jobs */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg">GET</span>
                                    <h3 className="text-lg font-bold text-slate-900">Fetch Job Listings</h3>
                                </div>
                                <p className="text-sm text-slate-600">
                                    Retrieve all open job positions to display on your careers page. Use query parameters to filter results.
                                </p>
                                <div className="bg-slate-900 rounded-2xl p-4 overflow-x-auto">
                                    <pre className="text-sm text-slate-100 font-mono whitespace-pre-wrap">
{`# Get all jobs
curl -X GET "https://api.hummane.com/public/jobs" \\
  -H "x-api-key: YOUR_API_KEY"

# Get jobs with filters
curl -X GET "https://api.hummane.com/public/jobs?jobId=YOUR_JOB_ID&city=London&country=United%20Kingdom&employmentMode=Remote&employmentType=Full-time&departmentId=YOUR_DEPARTMENT_ID" \\
  -H "x-api-key: YOUR_API_KEY"`}
                                    </pre>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-sm font-bold text-slate-700">Query Parameters:</p>
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                                        <div className="flex gap-3 text-sm">
                                            <code className="text-blue-600 font-mono font-bold shrink-0 w-32">jobId</code>
                                            <span className="text-slate-600">Filter for a specific job UUID</span>
                                        </div>
                                        <div className="flex gap-3 text-sm">
                                            <code className="text-blue-600 font-mono font-bold shrink-0 w-32">city</code>
                                            <span className="text-slate-600">Filter by city name (e.g., London)</span>
                                        </div>
                                        <div className="flex gap-3 text-sm">
                                            <code className="text-blue-600 font-mono font-bold shrink-0 w-32">country</code>
                                            <span className="text-slate-600">Filter by country name (e.g., United Kingdom)</span>
                                        </div>
                                        <div className="flex gap-3 text-sm">
                                            <code className="text-blue-600 font-mono font-bold shrink-0 w-32">employmentMode</code>
                                            <span className="text-slate-600">Filter by mode: Remote, Onsite, or Hybrid</span>
                                        </div>
                                        <div className="flex gap-3 text-sm">
                                            <code className="text-blue-600 font-mono font-bold shrink-0 w-32">employmentType</code>
                                            <span className="text-slate-600">Filter by type: Full-time, Contract, Part-time, Intern</span>
                                        </div>
                                        <div className="flex gap-3 text-sm">
                                            <code className="text-blue-600 font-mono font-bold shrink-0 w-32">departmentId</code>
                                            <span className="text-slate-600">Filter for jobs in a specific department UUID</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-slate-700">Example Response:</p>
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-x-auto">
                                        <pre className="text-sm text-slate-700 font-mono whitespace-pre-wrap">
{`[
  {
    "id": "uuid-string",
    "title": "Backend Engineer",
    "roleName": "Software Engineer",
    "departmentName": "Engineering",
    "city": "London",
    "country": "United Kingdom",
    "employmentType": "Full-time",
    "employmentMode": "Remote",
    "salaryFrom": 60000,
    "salaryTo": 85000,
    "applicantCount": 12,
    "status": "open"
  }
]`}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100"></div>

                            {/* Submit Applicant */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">POST</span>
                                    <h3 className="text-lg font-bold text-slate-900">Submit Applicant</h3>
                                </div>
                                <p className="text-sm text-slate-600">
                                    Submit a new applicant from your public careers page or external job boards. Uses multipart form data to support file uploads.
                                </p>
                                <div className="bg-slate-900 rounded-2xl p-4 overflow-x-auto">
                                    <pre className="text-sm text-slate-100 font-mono whitespace-pre-wrap">
{`curl -X POST "https://api.hummane.com/public/applicants" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -F "jobId=YOUR_JOB_UUID" \\
  -F "fullName=Jane Smith" \\
  -F "email=jane.smith@example.com" \\
  -F "phone=+12025550123" \\
  -F "positionApplied=Senior Lead Developer" \\
  -F "yearsOfExperience=8.5" \\
  -F "currentSalary=110000" \\
  -F "expectedSalary=135000" \\
  -F "noticePeriod=1 month" \\
  -F "linkedinUrl=https://www.linkedin.com/in/janesmith" \\
  -F "appliedDate=2026-01-20" \\
  -F "resume=@/path/to/your/resume.pdf"`}
                                    </pre>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-sm font-bold text-slate-700">Field Reference:</p>
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                        <div className="grid gap-3 text-sm">
                                            <div className="flex gap-3">
                                                <code className="text-blue-600 font-mono font-bold shrink-0 w-36">jobId</code>
                                                <span className="text-slate-500 text-xs shrink-0 w-16">UUID</span>
                                                <span className="text-slate-600"><span className="text-red-500 font-semibold">Required.</span> The ID of the job listing.</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <code className="text-blue-600 font-mono font-bold shrink-0 w-36">fullName</code>
                                                <span className="text-slate-500 text-xs shrink-0 w-16">String</span>
                                                <span className="text-slate-600"><span className="text-red-500 font-semibold">Required.</span> Candidate&apos;s full name.</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <code className="text-blue-600 font-mono font-bold shrink-0 w-36">email</code>
                                                <span className="text-slate-500 text-xs shrink-0 w-16">String</span>
                                                <span className="text-slate-600"><span className="text-red-500 font-semibold">Required.</span> Candidate&apos;s email address.</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <code className="text-blue-600 font-mono font-bold shrink-0 w-36">resume</code>
                                                <span className="text-slate-500 text-xs shrink-0 w-16">File</span>
                                                <span className="text-slate-600"><span className="text-amber-600 font-semibold">Recommended.</span> The actual PDF/Doc file.</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <code className="text-blue-600 font-mono font-bold shrink-0 w-36">phone</code>
                                                <span className="text-slate-500 text-xs shrink-0 w-16">String</span>
                                                <span className="text-slate-600">Contact number.</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <code className="text-blue-600 font-mono font-bold shrink-0 w-36">positionApplied</code>
                                                <span className="text-slate-500 text-xs shrink-0 w-16">String</span>
                                                <span className="text-slate-600">Custom title (falls back to Job Title if omitted).</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <code className="text-blue-600 font-mono font-bold shrink-0 w-36">yearsOfExperience</code>
                                                <span className="text-slate-500 text-xs shrink-0 w-16">Number</span>
                                                <span className="text-slate-600">Total years of relevant work experience.</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <code className="text-blue-600 font-mono font-bold shrink-0 w-36">currentSalary</code>
                                                <span className="text-slate-500 text-xs shrink-0 w-16">Number</span>
                                                <span className="text-slate-600">Current annual salary (base digits only).</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <code className="text-blue-600 font-mono font-bold shrink-0 w-36">expectedSalary</code>
                                                <span className="text-slate-500 text-xs shrink-0 w-16">Number</span>
                                                <span className="text-slate-600">Desired annual salary (base digits only).</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <code className="text-blue-600 font-mono font-bold shrink-0 w-36">noticePeriod</code>
                                                <span className="text-slate-500 text-xs shrink-0 w-16">String</span>
                                                <span className="text-slate-600">Availability (e.g., &quot;Immediate&quot;, &quot;2 weeks&quot;).</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <code className="text-blue-600 font-mono font-bold shrink-0 w-36">linkedinUrl</code>
                                                <span className="text-slate-500 text-xs shrink-0 w-16">String</span>
                                                <span className="text-slate-600">Link to candidate&apos;s professional profile.</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <code className="text-blue-600 font-mono font-bold shrink-0 w-36">appliedDate</code>
                                                <span className="text-slate-500 text-xs shrink-0 w-16">Date</span>
                                                <span className="text-slate-600">Format: YYYY-MM-DD (defaults to today).</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

