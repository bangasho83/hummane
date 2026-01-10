'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Briefcase, Leaf, Cog } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
    { href: '/organization/departments', label: 'Departments', description: 'Manage teams and reporting lines.', icon: Building2 },
    { href: '/organization/roles', label: 'Roles', description: 'Define responsibilities and permissions.', icon: Briefcase },
    { href: '/organization/leaves', label: 'Leaves', description: 'Leave types and allowances.', icon: Leaf },
    { href: '/organization/general', label: 'General', description: 'Time, currency, and hours.', icon: Cog }
]

export function OrgTabs() {
    const pathname = usePathname()

    return (
        <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = pathname.startsWith(tab.href)
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            "group flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors",
                            isActive
                                ? "bg-white text-slate-900 border-slate-400"
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900 hover:border-slate-300"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center border text-slate-500 transition-colors",
                            isActive ? "bg-white border-slate-400 text-slate-900" : "bg-white border-slate-200 group-hover:border-slate-300"
                        )}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold">{tab.label}</p>
                            <p className="text-[11px] text-slate-400 font-medium leading-tight">
                                {tab.description}
                            </p>
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}
