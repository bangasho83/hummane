import { ResourceForm } from '@/features/resources'

export default function NewReimbursementPage() {
    return <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6"><div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Add Reimbursement</h1><p className="font-medium text-slate-500">Record an employee-paid expense for reimbursement.</p></div><ResourceForm mode="resource" initialResourceType="reimbursement" resourceLabel="reimbursement" resourceListPath="/resources/reimbursements" /></div>
}