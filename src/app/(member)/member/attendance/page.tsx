'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export default function MemberAttendancePage() {
    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
                <p className="text-slate-500">Track and manage your attendance records</p>
            </div>

            <Card className="border-dashed">
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                        <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">Attendance Coming Soon</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-slate-500">
                    <p>
                        Your attendance tracking page is under development.
                        <br />
                        Soon you&apos;ll be able to check in, view your attendance history, and more.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

