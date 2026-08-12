'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, BookOpen, ClipboardList, Package, ReceiptText, RefreshCw, Shapes } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
    { href: '/resources', label: 'Requests', icon: ClipboardList, exact: true },
    { href: '/resources/assets', label: 'Resources', icon: Package },
    { href: '/resources/subscriptions', label: 'Subscriptions', icon: RefreshCw },
    { href: '/resources/bills', label: 'Bills', icon: ReceiptText },
    { href: '/resources/reimbursements', label: 'Reimbursements', icon: ReceiptText },
    { href: '/resources/books', label: 'Books', icon: BookOpen },
    { href: '/resources/reports', label: 'Reports', icon: BarChart3 },
]

const templateTab = { href: '/resources/templates', label: 'Templates', icon: Shapes }
const tabClass = (active: boolean) => cn(
    'flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition-colors',
    active ? 'border-slate-400 bg-white text-slate-900' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-900',
)

export function ResourceTabs() {
    const pathname = usePathname()
    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                    const active = tab.exact
                        ? pathname === tab.href || (pathname.startsWith('/resources/') && !pathname.startsWith('/resources/assets') && !pathname.startsWith('/resources/books') && !pathname.startsWith('/resources/subscriptions') && !pathname.startsWith('/resources/bills') && !pathname.startsWith('/resources/reimbursements') && !pathname.startsWith('/resources/templates') && !pathname.startsWith('/resources/reports'))
                        : pathname.startsWith(tab.href)
                    const Icon = tab.icon
                    return <Link key={tab.href} href={tab.href} className={tabClass(active)}><Icon className="h-4 w-4" />{tab.label}</Link>
                })}
            </div>
            <Link href={templateTab.href} className={cn('sm:ml-auto', tabClass(pathname.startsWith(templateTab.href)))}>
                <Shapes className="h-4 w-4" />{templateTab.label}
            </Link>
        </div>
    )
}
