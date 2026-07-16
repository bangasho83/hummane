'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, ClipboardList, HandCoins, Package, ReceiptText } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
    { href: '/resources', label: 'Requests', icon: ClipboardList, exact: true },
    { href: '/resources/assets', label: 'Resources', icon: Package },
    { href: '/resources/bills', label: 'Bills', icon: ReceiptText },
    { href: '/resources/reimbursements', label: 'Reimbursements', icon: HandCoins },
    { href: '/resources/library', label: 'Library', icon: BookOpen },
]

export function ResourceTabs() {
    const pathname = usePathname()
    return (
        <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
                const active = tab.exact
                    ? pathname === tab.href || (pathname.startsWith('/resources/') && !pathname.startsWith('/resources/assets') && !pathname.startsWith('/resources/bills') && !pathname.startsWith('/resources/reimbursements') && !pathname.startsWith('/resources/library'))
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
