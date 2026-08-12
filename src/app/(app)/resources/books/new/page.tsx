import { ResourceForm } from '@/features/resources'

export default function NewBookPage() {
    return <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6"><div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Add Book</h1><p className="font-medium text-slate-500">Add one physical book copy and optionally assign it to an employee.</p></div><ResourceForm mode="resource" initialResourceType="book" lockedResourceType="book" initialCategory="Training & Learning" resourceLabel="book" resourceListPath="/resources/books" /></div>
}