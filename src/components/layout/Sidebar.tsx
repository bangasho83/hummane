'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    Settings,
    Building2,
    Calendar,
    Wallet,
    HelpCircle,
    LogOut,
    Briefcase,
    FileText,
    ClipboardList
} from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'

const dashboardItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
]

const teamItems = [
    { name: 'Team', href: '/dashboard/team', icon: Users },
    { name: 'Attendance', href: '/dashboard/attendance', icon: Calendar },
    { name: 'Payroll', href: '/dashboard/payroll', icon: Wallet },
    { name: 'Organization', href: '/dashboard/organization', icon: Building2 },
]

const hiringItems = [
    { name: 'Jobs', href: '/dashboard/jobs', icon: FileText },
    { name: 'Applicants', href: '/dashboard/applicants', icon: Users },
]

const performanceItems = [
    { name: 'Feedback', href: '/dashboard/performance/feedback', icon: ClipboardList, exact: true },
    { name: 'Cards', href: '/dashboard/performance/feedback-cards', icon: FileText, exact: true },
]

const secondaryItems = [
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Support', href: '/dashboard/support', icon: HelpCircle },
]

export function Sidebar() {
    const pathname = usePathname()
    const { logout, currentCompany } = useApp()

    const NavLink = ({ item, isSecondary = false }: { item: any, isSecondary?: boolean }) => {
        const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

        return (
            <Link
                href={item.href}
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group mb-1",
                    isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
            >
                <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"
                )} />
                {item.name}
                {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
            </Link>
        )
    }

    return (
        <aside className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col sticky top-0 z-50">
            <div className="p-6 flex-1 overflow-y-auto">
                <div className="flex items-center gap-2 mb-8 px-2">
                    <div className="w-9 h-9 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <span className="text-white font-black text-xl">h</span>
                    </div>
                    <div>
                        <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
                            hummane
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                            Empowering Humans
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <nav>
                            {dashboardItems.map((item) => (
                                <NavLink key={item.name} item={item} />
                            ))}
                        </nav>
                    </div>

                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 px-3">
                            Team
                        </p>
                        <nav>
                            {teamItems.map((item) => (
                                <NavLink key={item.name} item={item} />
                            ))}
                        </nav>
                    </div>

                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 px-3">
                            Performance
                        </p>
                        <nav>
                            {performanceItems.map((item) => (
                                <NavLink key={item.name} item={item} />
                            ))}
                        </nav>
                    </div>

                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 px-3">
                            Hiring
                        </p>
                        <nav>
                            {hiringItems.map((item) => (
                                <NavLink key={item.name} item={item} />
                            ))}
                        </nav>
                    </div>

                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 px-3">
                            Account & Support
                        </p>
                        <nav>
                            {secondaryItems.map((item) => (
                                <NavLink key={item.name} item={item} isSecondary />
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100 border border-transparent transition-all group mb-4"
                >
                    <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                    Logout Account
                </button>

                {currentCompany && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                            Active Workspace
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                                {currentCompany.name[0].toUpperCase()}
                            </div>
                            <p className="text-sm font-bold text-slate-900 truncate flex-1">
                                {currentCompany.name}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    )
}
