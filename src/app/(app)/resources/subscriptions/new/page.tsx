import { ResourceForm } from '@/features/resources'

export default function NewSubscriptionPage() {
    return <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6"><div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Add Subscription</h1><p className="font-medium text-slate-500">Record a company software subscription and optionally assign an owner.</p></div><ResourceForm mode="resource" initialResourceType="subscription" lockedResourceType="subscription" initialCategory="Software & Subscriptions" resourceLabel="subscription" resourceListPath="/resources/subscriptions" /></div>
}