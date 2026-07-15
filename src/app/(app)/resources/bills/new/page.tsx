import { ResourceForm } from '@/features/resources'

export default function NewBillPage() {
    return <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500"><div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Add Bill</h1><p className="font-medium text-slate-500">Record a company expense, vendor invoice, and attachments.</p></div><ResourceForm mode="bill" /></div>
}
