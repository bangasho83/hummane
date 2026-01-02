'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Briefcase, Leaf, Cog } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
    { href: '/dashboard/organization/departments', label: 'Departments', description: 'Manage teams and reporting lines.', icon: Building2 },
    { href: '/dashboard/organization/roles', label: 'Roles', description: 'Define responsibilities and permissions.', icon: Briefcase },
    { href: '/dashboard/organization/leaves', label: 'Leaves', description: 'Leave types and allowances.', icon: Leaf },
    { href: '/dashboard/organization/general', label: 'General', description: 'Time, currency, and hours.', icon: Cog }
]

export function OrgTabs() {
    const pathname = usePathname()

    return (
        <div className="inline-flex bg-slate-100 rounded-full p-1 shadow-inner border border-slate-200 w-full sm:w-auto">
            {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = pathname.startsWith(tab.href)
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            "group relative flex items-center gap-3 px-4 sm:px-6 py-3 rounded-full transition-all w-full sm:w-auto",
                            isActive
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        <div className={cn(
                            "w-9 h-9 rounded-2xl flex items-center justify-center border transition-colors",
                            isActive ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-white border-slate-200 text-slate-400 group-hover:border-slate-300"
                        )}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold">{tab.label}</p>
                            <p className="text-[11px] text-slate-400 font-semibold leading-tight">
                                {tab.description}
                            </p>
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}
