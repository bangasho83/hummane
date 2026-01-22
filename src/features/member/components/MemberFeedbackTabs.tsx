'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
    { href: '/member/feedback', label: 'Received', description: 'Feedback you received', exact: true },
    { href: '/member/feedback/given', label: 'Given', description: 'Feedback you gave' }
]

export function MemberFeedbackTabs() {
    const pathname = usePathname()

    return (
        <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => {
                const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            "group flex flex-col rounded-xl border px-4 py-3 text-sm font-semibold transition-colors w-full sm:w-auto",
                            isActive
                                ? "bg-white text-slate-900 border-slate-400"
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900 hover:border-slate-300"
                        )}
                    >
                        <span>{tab.label}</span>
                        <span className="text-[11px] text-slate-400 font-medium leading-tight">{tab.description}</span>
                    </Link>
                )
            })}
        </div>
    )
}

