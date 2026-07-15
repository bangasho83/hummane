'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, FileText, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
    { href: '/member/resource-request', label: 'Requests', icon: ClipboardList },
    { href: '/member/resource-request/resources', label: 'Resources', icon: Package },
    { href: '/member/resource-request/bills', label: 'Bills', icon: FileText },
]

export function MemberResourceTabs() {
    const pathname = usePathname()
    return (
        <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
                const childTabs = ['/member/resource-request/resources', '/member/resource-request/bills']
                const active = tab.label === 'Requests'
                    ? pathname === tab.href || (pathname.startsWith(`${tab.href}/`) && !childTabs.some((href) => pathname.startsWith(href)))
                    : pathname.startsWith(tab.href)
                const Icon = tab.icon
                return (
                    <Link key={tab.href} href={tab.href} className={cn('flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition-colors', active ? 'border-slate-400 bg-white text-slate-900' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-900')}>
                        <Icon className="h-4 w-4" />{tab.label}
                    </Link>
                )
            })}
        </div>
    )
}
