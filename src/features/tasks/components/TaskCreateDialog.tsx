'use client'

import type { FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export type TaskCreateValues = {
    title: string
    description: string
    projectId: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
    dueDate: string
    assigneeId?: string
}

export function TaskCreateDialog({ open, onClose, onSubmit, isSubtask = false, projectId, defaultAssigneeId, employees = [], projects = [{ id: 'website', name: 'Website refresh' }, { id: 'onboarding', name: 'New team onboarding' }, { id: 'office', name: 'Office setup' }] }: { open: boolean; onClose: () => void; onSubmit: (values: TaskCreateValues) => void; isSubtask?: boolean; projectId?: string; defaultAssigneeId?: string; employees?: { id: string; name: string }[]; projects?: { id: string; name: string }[] }) {
    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const title = String(form.get('title') || '').trim()
        if (!title) return
        onSubmit({ title, description: String(form.get('description') || ''), projectId: projectId || String(form.get('projectId') || 'website'), priority: String(form.get('priority') || 'normal') as TaskCreateValues['priority'], dueDate: String(form.get('dueDate') || ''), assigneeId: String(form.get('assigneeId') || defaultAssigneeId || '') || undefined })
    }

    return <Dialog open={open} onOpenChange={value => !value && onClose()}><DialogContent className="rounded-3xl sm:max-w-lg"><DialogHeader><DialogTitle className="text-2xl font-extrabold">{isSubtask ? 'Add a subtask' : 'Add a task'}</DialogTitle><DialogDescription>{isSubtask ? 'Break this work into a clear next step.' : 'Give the work enough context for someone to pick it up with confidence.'}</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={submit}><div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="task-title">Task title</label><Input id="task-title" name="title" autoFocus required placeholder="What needs to be done?" className="h-12 rounded-xl" /></div><div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="task-description">Description</label><Textarea id="task-description" name="description" placeholder="Add useful context..." className="min-h-24 rounded-xl" /></div>{!isSubtask && <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider" htmlFor="task-project">Project</label><select id="task-project" name="projectId" defaultValue={projects[0]?.id || ''} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>}<div className="grid gap-3 sm:grid-cols-2"><div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="task-priority">Priority</label><select id="task-priority" name="priority" defaultValue="normal" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div><div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="task-due-date">Due date</label><Input id="task-due-date" name="dueDate" type="date" className="h-10 rounded-xl" /></div>{!isSubtask && <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="task-assignee">Assign to</label><select id="task-assignee" name="assigneeId" defaultValue={defaultAssigneeId || 'unassigned'} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="unassigned">Unassigned</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></div>}</div><DialogFooter className="pt-3"><Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>Cancel</Button><Button type="submit" className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"><Plus className="h-4 w-4" />{isSubtask ? 'Create subtask' : 'Create task'}</Button></DialogFooter></form></DialogContent></Dialog>
}
