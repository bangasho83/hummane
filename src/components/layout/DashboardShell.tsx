'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Bell, Search, User, ChevronDown } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { Input } from '@/components/ui/input'

interface DashboardShellProps {
    children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
    const { currentUser, currentCompany } = useApp()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!currentUser) return
        if (currentCompany) return
        if (pathname === '/company-setup') return
        router.push('/company-setup')
    }, [currentUser, currentCompany, pathname, router])

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-8">
                    <div className="w-96 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search everything..."
                            className="pl-10 bg-slate-50 border-none h-10 rounded-full focus-visible:ring-1 focus-visible:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="h-8 w-px bg-slate-200 mx-2"></div>

                        <button className="flex items-center gap-3 p-1 pr-3 hover:bg-slate-50 rounded-full transition-all border border-transparent hover:border-slate-100">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                {currentUser?.name?.[0].toUpperCase()}
                            </div>
                            <div className="text-left hidden sm:block">
                                <p className="text-sm font-semibold text-slate-900 leading-none">
                                    {currentUser?.name}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium">
                                    Admin Account
                                </p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-8 overflow-auto">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
