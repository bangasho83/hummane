'use client'

import { DashboardShell } from '@/components/layout/DashboardShell'
import { HelpCircle } from 'lucide-react'

export default function SupportPage() {
    return (
        <DashboardShell>
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
                    <HelpCircle className="w-10 h-10 text-indigo-600" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Help & Support</h1>
                <p className="text-slate-500 font-medium text-center max-w-md">
                    Need assistance? Our support team is here to help you get the most out of hummane.
                </p>
            </div>
        </DashboardShell>
    )
}
