'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, Check, MessageSquare, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done'
type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'
type Task = {
    id: string
    projectId: string
    title: string
    description: string
    status: TaskStatus
    priority: TaskPriority
    assignee: string
    dueDate: string
    labels: string[]
    subtasks: { id: string; title: string; done: boolean }[]
    comments: { id: string; author: string; body: string; createdAt: string }[]
    createdAt: string
}

const STORAGE_KEY = 'hummane-task-workspace-v1'
const projects = [
    { id: 'website', name: 'Website refresh', color: '#2563eb' },
    { id: 'onboarding', name: 'New team onboarding', color: '#10b981' },
    { id: 'office', name: 'Office setup', color: '#f59e0b' },
]
const statusMeta: Record<TaskStatus, { label: string; badge: 'default' | 'secondary' | 'destructive' | 'success' }> = {
    todo: { label: 'To do', badge: 'secondary' },
    in_progress: { label: 'In progress', badge: 'default' },
    blocked: { label: 'Blocked', badge: 'destructive' },
    done: { label: 'Done', badge: 'success' },
}
const priorityMeta: Record<TaskPriority, string> = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' }

function projectFor(id: string) {
    return projects.find(project => project.id === id) || projects[0]
}

function formatDate(date: string) {
    if (!date) return 'No due date'
    return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function TaskDetailPage({ taskId, onBack }: { taskId: string; onBack: () => void }) {
    const [task, setTask] = useState<Task | null>(null)
    const [comment, setComment] = useState('')
    const [hydrated, setHydrated] = useState(false)

    useEffect(() => {
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY)
            const tasks = stored ? JSON.parse(stored) as Task[] : []
            setTask(tasks.find(item => item.id === taskId) || null)
        } finally {
            setHydrated(true)
        }
    }, [taskId])

    function save(nextTask: Task) {
        setTask(nextTask)
        const stored = window.localStorage.getItem(STORAGE_KEY)
        const tasks = stored ? JSON.parse(stored) as Task[] : []
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.map(item => item.id === nextTask.id ? nextTask : item)))
    }

    function update(changes: Partial<Task>) {
        if (task) save({ ...task, ...changes })
    }

    function toggleSubtask(id: string) {
        if (task) update({ subtasks: task.subtasks.map(item => item.id === id ? { ...item, done: !item.done } : item) })
    }

    function addComment() {
        const body = comment.trim()
        if (!task || !body) return
        update({ comments: [...task.comments, { id: `comment-${Date.now()}`, author: 'You', body, createdAt: 'Just now' }] })
        setComment('')
    }

    if (!hydrated) return <div className="flex items-center justify-center p-12 text-sm text-slate-500">Loading task...</div>
    if (!task) return <div className="space-y-5"><Button variant="ghost" className="rounded-xl" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Back to tasks</Button><Card className="rounded-3xl"><CardContent className="p-10 text-center text-sm text-slate-500">This task could not be found.</CardContent></Card></div>

    const project = projectFor(task.projectId)
    const completedSubtasks = task.subtasks.filter(item => item.done).length
    return <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
        <header className="flex items-start gap-3"><Button variant="ghost" size="icon" className="mt-0.5 shrink-0 rounded-xl border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-sm" onClick={onBack} aria-label="Back to tasks"><ArrowLeft className="h-5 w-5" /></Button><div className="min-w-0"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} />{project.name}</p><h1 className={cn('mt-1 text-2xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-3xl', task.status === 'done' && 'text-slate-400 line-through')}>{task.title}</h1><p className="mt-1 text-sm text-slate-500">Focused task view · Created {formatDate(task.createdAt)}</p></div></header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <main className="order-2 min-w-0 space-y-6 lg:order-1">
                <Card className="rounded-3xl border-slate-100 bg-white shadow-premium"><CardContent className="p-5 sm:p-8"><div><div className="mb-2 flex items-center justify-between gap-3"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Description</p><Badge variant={statusMeta[task.status].badge}>{statusMeta[task.status].label}</Badge></div><p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{task.description || 'No description yet.'}</p></div>{task.labels.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{task.labels.map(label => <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500" key={label}>{label}</span>)}</div>}</CardContent></Card>

                {task.subtasks.length > 0 && <Card className="rounded-3xl border-slate-100 bg-white shadow-premium"><CardContent className="p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Next steps</h2><p className="mt-1 text-xs text-slate-400">{completedSubtasks} of {task.subtasks.length} complete</p></div><div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${completedSubtasks / task.subtasks.length * 100}%` }} /></div></div><div className="space-y-2">{task.subtasks.map(item => <button key={item.id} className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-slate-50" onClick={() => toggleSubtask(item.id)}><span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border', item.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300')}>{item.done && <Check className="h-3 w-3" />}</span><span className={cn('text-sm font-medium', item.done && 'text-slate-400 line-through')}>{item.title}</span></button>)}</div></CardContent></Card>}

                <Card className="rounded-3xl border-slate-100 bg-white shadow-premium"><CardContent className="p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Conversation</h2><p className="mt-1 text-xs text-slate-400">Keep useful context with the work.</p></div><span className="text-xs text-slate-400">{task.comments.length}</span></div><div className="space-y-3">{task.comments.map(item => <div className="rounded-2xl bg-slate-50 p-4" key={item.id}><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-slate-700">{item.author}</span><span className="text-[11px] text-slate-400">{item.createdAt}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p></div>)}<div className="flex gap-2"><Textarea value={comment} onChange={event => setComment(event.target.value)} placeholder="Add context or a question..." className="min-h-11 rounded-xl" /><Button className="h-11 shrink-0 rounded-xl bg-blue-600 text-white hover:bg-blue-700" disabled={!comment.trim()} onClick={addComment} aria-label="Add comment"><MessageSquare className="h-4 w-4" /></Button></div></div></CardContent></Card>
            </main>

            <aside className="order-1 space-y-4 lg:order-2"><Card className="rounded-3xl border-slate-100 bg-white shadow-premium"><CardContent className="space-y-5 p-5"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</p><Select value={task.status} onValueChange={value => update({ status: value as TaskStatus })}><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusMeta).map(([value, meta]) => <SelectItem key={value} value={value}>{meta.label}</SelectItem>)}</SelectContent></Select></div><div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Priority</p><Select value={task.priority} onValueChange={value => update({ priority: value as TaskPriority })}><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(priorityMeta).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned to</p><div className="flex h-11 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700"><UserRound className="h-4 w-4 text-slate-400" />{task.assignee}</div></div><div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Due date</p><div className="flex h-11 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700"><CalendarDays className="h-4 w-4 text-slate-400" />{formatDate(task.dueDate)}</div></div><Button className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={() => update({ status: task.status === 'done' ? 'todo' : 'done' })}>{task.status === 'done' ? 'Reopen task' : 'Mark complete'}</Button></CardContent></Card></aside>
        </div>
    </div>
}
