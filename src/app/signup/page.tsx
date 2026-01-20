'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'
import { Chrome } from 'lucide-react'

export default function SignupPage() {
    const router = useRouter()
    const { signup, loginWithGoogle, currentUser, currentCompany, isHydrating } = useApp()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)

    useEffect(() => {
        if (isHydrating) return
        if (!currentUser) return
        router.push(currentCompany ? '/dashboard' : '/company-setup')
    }, [currentCompany, currentUser, router, isHydrating])

    if (currentUser) {
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const result = await signup(name, email, password)

        if (result.success) {
            toast(result.message, 'success')
        } else {
            toast(result.message, 'error')
            setLoading(false)
        }
    }

    const handleGoogleSignup = async () => {
        setGoogleLoading(true)
        const result = await loginWithGoogle()
        if (result.success) {
            toast(result.message, 'success')
            setTimeout(() => {
                router.push('/company-setup')
            }, 100)
        } else {
            toast(result.message, 'error')
        }
        setGoogleLoading(false)
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
                        <CardTitle>Get Started</CardTitle>
                        <CardDescription>Create your account to begin</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={handleGoogleSignup}
                                disabled={loading || googleLoading}
                            >
                                <Chrome className="w-4 h-4 mr-2" />
                                {googleLoading ? 'Connecting...' : 'Continue with Google'}
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-slate-200" />
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                    or
                                </span>
                                <div className="h-px flex-1 bg-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
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
                                    placeholder="At least 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Creating account...' : 'Create Account'}
                            </Button>
                            <p className="text-sm text-center text-slate-600">
                                Already have an account?{' '}
                                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                                    Sign in
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}
