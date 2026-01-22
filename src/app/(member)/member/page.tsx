'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LayoutDashboard } from 'lucide-react'

export default function MemberDashboardPage() {
    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500">Welcome to your member portal</p>
            </div>

            <Card className="border-dashed">
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                        <LayoutDashboard className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">Dashboard Coming Soon</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-slate-500">
                    <p>
                        We&apos;re working on building your personalized dashboard.
                        <br />
                        Check back soon for updates on your tasks, schedules, and more.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

