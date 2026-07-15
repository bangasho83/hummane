import { ResourceForm } from '@/features/resources'

export default function NewResourcePage() {
    return <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500"><div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Add Resource</h1><p className="font-medium text-slate-500">Create an approved company resource and optionally assign it.</p></div><ResourceForm mode="resource" /></div>
}
