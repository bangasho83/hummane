'use client'

import { Loader2 } from 'lucide-react'
import { ResourceForm } from '@/features/resources'
import { Card, CardContent } from '@/components/ui/card'
import { useApp } from '@/lib/context/AppContext'
import { MemberResourceTabs } from '@/features/member/components/MemberResourceTabs'

export default function MemberNewReimbursementPage() {
    const { isHydrating, meProfile } = useApp()

    if (isHydrating) {
        return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
    }

    if (!meProfile?.employeeId) {
        return <Card className="border-dashed"><CardContent className="p-12 text-center text-slate-500">Your account is not linked to an employee profile. Please contact your administrator.</CardContent></Card>
    }

    return <div className="animate-in fade-in slide-in-from-bottom-4 max-w-3xl space-y-6 duration-500"><MemberResourceTabs /><div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Add Reimbursement</h1><p className="font-medium text-slate-500">Submit an employee-paid expense for reimbursement.</p></div><ResourceForm mode="resource" initialResourceType="reimbursement" resourceLabel="reimbursement" resourceListPath="/member/reimbursements" initialPaidByEmployeeId={meProfile.employeeId} hideAssignment /></div>
}