'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'

export default function LoginPage() {
    const router = useRouter()
    const { login, currentUser, currentCompany } = useApp()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    // Redirect if already logged in
    if (currentUser) {
        if (currentCompany) {
            router.push('/dashboard')
        } else {
            router.push('/company-setup')
        }
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const result = await login(email, password)

        if (result.success) {
            toast(result.message, 'success')
            // Navigation will happen via redirect above after context updates
            setTimeout(() => {
                const user = currentUser
                if (user) {
                    if (currentCompany) {
                        router.push('/dashboard')
                    } else {
                        router.push('/company-setup')
                    }
                }
            }, 100)
        } else {
            toast(result.message, 'error')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">
                        hum<span className="text-blue-600">mane</span>
                    </h1>
                    <p className="text-slate-600">Manage your company and employees effortlessly</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Welcome Back</CardTitle>
                        <CardDescription>Sign in to your account to continue</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                            <p className="text-sm text-center text-slate-600">
                                Don't have an account?{' '}
                                <Link href="/signup" className="text-blue-600 hover:underline font-medium">
                                    Create one
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}
