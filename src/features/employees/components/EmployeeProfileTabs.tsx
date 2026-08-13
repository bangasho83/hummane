import Link from 'next/link'
import { BookOpen, ClipboardList, Package, ReceiptText, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type EmployeeProfileTab = 'general' | 'attendance' | 'feedback' | 'resources'

const tabs: Array<{ value: EmployeeProfileTab; label: string; suffix?: string }> = [
    { value: 'general', label: 'General Info' },
    { value: 'attendance', label: 'Attendance', suffix: '/attendance' },
    { value: 'feedback', label: 'Feedback', suffix: '/feedback' },
    { value: 'resources', label: 'Resources', suffix: '/resources' },
]

export function EmployeeProfileTabs({ employeeId, active }: { employeeId: string; active: EmployeeProfileTab }) {
    return (
        <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
                <Button
                    key={tab.value}
                    asChild
                    variant={tab.value === active ? 'default' : 'outline'}
                    className={tab.value === active ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600'}
                >
                    <Link href={`/team/${employeeId}${tab.suffix || ''}`}>{tab.label}</Link>
                </Button>
            ))}
        </div>
    )
}

export const employeeResourceTabs = [
    { value: 'requests', label: 'Requests', icon: ClipboardList },
    { value: 'resources', label: 'Resources', icon: Package },
    { value: 'subscriptions', label: 'Subscriptions', icon: RefreshCw },
    { value: 'reimbursements', label: 'Reimbursements', icon: ReceiptText },
    { value: 'books', label: 'Books', icon: BookOpen },
] as const

export type EmployeeResourceTab = typeof employeeResourceTabs[number]['value']
