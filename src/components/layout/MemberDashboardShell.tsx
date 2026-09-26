'use client'

import { useState } from 'react'
import { MemberSidebar } from './MemberSidebar'
import { Bell, ChevronDown, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'

interface MemberDashboardShellProps {
    children: React.ReactNode
}

export function MemberDashboardShell({ children }: MemberDashboardShellProps) {
    const { currentUser } = useApp()
    const pathname = usePathname()
    const isOkrBoard = pathname.endsWith('/okrs')
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <MemberSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex min-w-0 flex-1 flex-col">
                {/* Topbar */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:justify-end lg:px-8">
                    <button aria-label="Open navigation" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(true)}>
                        <Menu className="h-5 w-5" />
                    </button>
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
                                    Member Account
                                </p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className={`min-w-0 flex-1 overflow-x-hidden overflow-y-auto ${isOkrBoard ? '' : 'p-4 sm:p-6 lg:p-8'}`}>
                    <div className={isOkrBoard ? 'min-h-full' : 'mx-auto max-w-7xl space-y-6 sm:space-y-8'}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
