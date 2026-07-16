import { LibraryBookForm } from '@/features/resources'

export default function NewLibraryBookPage() {
    return <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500"><div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Add Book</h1><p className="font-medium text-slate-500">Add a physical copy to the office library.</p></div><LibraryBookForm /></div>
}