'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { EmployeeTable } from '@/features/employees'
import { Card, CardContent } from '@/components/ui/card'
import type { Employee } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hummane-api.vercel.app'

export default function EmployeesPage() {
    const router = useRouter()
    const { currentUser, currentCompany, apiAccessToken } = useApp()
    const [rawApiResponse, setRawApiResponse] = useState<Employee[] | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchEmployees = async () => {
        if (!apiAccessToken) return
        setIsLoading(true)
        try {
            const apiUrl = `${API_BASE_URL}/employees`
            const res = await fetch(apiUrl, {
                headers: { Authorization: `Bearer ${apiAccessToken}` }
            })

            if (res.ok) {
                const data = await res.json()
                setRawApiResponse(data)
            }
        } catch {
            // ignore
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchEmployees()
    }, [apiAccessToken])

    // Redirect if not logged in or no company
    useEffect(() => {
        if (!currentUser) {
            router.push('/login')
        } else if (!currentCompany) {
            router.push('/company-setup')
        }
    }, [currentUser, currentCompany, router])

    const handleAddEmployee = () => {
        router.push('/team/add')
    }

    // Don't render until we have user and company
    if (!currentUser || !currentCompany) {
        return null
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Team
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Manage your team members and their information.
                    </p>
                </div>

                <Button
                    onClick={handleAddEmployee}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 px-6 py-6 h-auto"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Employee
                </Button>
            </div>

            <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-20 flex items-center justify-center">
                        <div className="text-slate-400 font-medium">Loading employees...</div>
                    </div>
                ) : (
                    <EmployeeTable employees={rawApiResponse || []} onRefresh={fetchEmployees} />
                )}
            </div>

        </div>
    )
}
