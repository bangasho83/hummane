'use client'

import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronRight,
    Circle,
    Clock3,
    Filter,
    GanttChart,
    LayoutGrid,
    List,
    MessageSquare,
    MoreHorizontal,
    Plus,
    Search,
    Sparkles,
    UserRound,
    UsersRound,
    X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done'
type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'
type TaskScope = 'my' | 'all'
type TaskLayout = 'list' | 'board' | 'gantt'

type MockProject = {
    id: string
    name: string
    description: string
    color: string
    owner: string
    taskCount: number
}

type MockComment = { id: string; author: string; body: string; createdAt: string }

type MockTask = {
    id: string
    projectId: string
    parentTaskId?: string
    title: string
    description: string
    status: TaskStatus
    priority: TaskPriority
    assignee: string
    dueDate: string
    labels: string[]
    subtasks: { id: string; title: string; done: boolean }[]
    comments: MockComment[]
    createdAt: string
}

const STORAGE_KEY = 'hummane-task-workspace-v1'
const currentPerson = 'You'

const projects: MockProject[] = [
    { id: 'website', name: 'Website refresh', description: 'A clearer, calmer home for Hummane.', color: '#2563eb', owner: 'Omair', taskCount: 8 },
    { id: 'onboarding', name: 'New team onboarding', description: 'Make the first week feel welcoming and simple.', color: '#10b981', owner: 'Sarah', taskCount: 5 },
    { id: 'office', name: 'Office setup', description: 'The practical things that help everyone do good work.', color: '#f59e0b', owner: 'John', taskCount: 4 },
]

const initialTasks: MockTask[] = [
    { id: 'task-1', projectId: 'website', title: 'Review the new homepage copy', description: 'Read through the first draft and leave thoughts where the message can be clearer.', status: 'in_progress', priority: 'high', assignee: currentPerson, dueDate: '2026-10-02', labels: ['Content', 'This week'], subtasks: [{ id: 'sub-1', title: 'Check the hero message', done: true }, { id: 'sub-2', title: 'Review the feature sections', done: false }], comments: [{ id: 'comment-1', author: 'Sarah', body: 'The trust section feels especially strong. Would love your view on the opening paragraph.', createdAt: 'Today, 10:24 AM' }], createdAt: '2026-09-24' },
    { id: 'task-2', projectId: 'website', title: 'Collect customer stories', description: 'Find three short stories that show how teams use Hummane in real life.', status: 'todo', priority: 'normal', assignee: currentPerson, dueDate: '2026-10-07', labels: ['Research'], subtasks: [], comments: [], createdAt: '2026-09-25' },
    { id: 'task-3', projectId: 'website', title: 'Prepare design handoff', description: 'Package the approved direction and share it with the design team.', status: 'blocked', priority: 'urgent', assignee: 'Sarah', dueDate: '2026-09-29', labels: ['Design'], subtasks: [], comments: [{ id: 'comment-2', author: 'Sarah', body: 'Waiting on the final brand illustrations before this can move.', createdAt: 'Yesterday' }], createdAt: '2026-09-22' },
    { id: 'task-4', projectId: 'onboarding', title: 'Set up the welcome guide', description: 'Keep it short: what people need to know in their first week.', status: 'todo', priority: 'normal', assignee: currentPerson, dueDate: '2026-10-10', labels: ['People'], subtasks: [], comments: [], createdAt: '2026-09-26' },
    { id: 'task-5', projectId: 'onboarding', title: 'Book first-week conversations', description: 'Create space for new teammates to meet the people they will work with.', status: 'done', priority: 'normal', assignee: 'John', dueDate: '2026-09-25', labels: ['People'], subtasks: [], comments: [], createdAt: '2026-09-18' },
    { id: 'task-6', projectId: 'office', title: 'Choose meeting room chairs', description: 'Compare the two shortlisted options and make a practical choice.', status: 'in_progress', priority: 'low', assignee: currentPerson, dueDate: '2026-10-14', labels: ['Office'], subtasks: [], comments: [], createdAt: '2026-09-21' },
]

const statusMeta: Record<TaskStatus, { label: string; color: string; badge: 'default' | 'secondary' | 'warning' | 'destructive' | 'success' }> = {
    todo: { label: 'To do', color: 'bg-slate-400', badge: 'secondary' },
    in_progress: { label: 'In progress', color: 'bg-blue-500', badge: 'default' },
    blocked: { label: 'Blocked', color: 'bg-rose-500', badge: 'destructive' },
    done: { label: 'Done', color: 'bg-emerald-500', badge: 'success' },
}

const priorityMeta: Record<TaskPriority, { label: string; className: string }> = {
    low: { label: 'Low', className: 'text-slate-400' },
    normal: { label: 'Normal', className: 'text-slate-500' },
    high: { label: 'High', className: 'text-amber-600' },
    urgent: { label: 'Urgent', className: 'text-rose-600' },
}

function projectFor(id: string) {
    return projects.find(project => project.id === id) || projects[0]
}

function formatDueDate(date: string) {
    if (!date) return 'No due date'
    return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function isOverdue(task: MockTask) {
    return task.status !== 'done' && task.dueDate < '2026-09-26'
}

export function TaskWorkspace() {
    const [tasks, setTasks] = useState<MockTask[]>(initialTasks)
    const [hydrated, setHydrated] = useState(false)
    const [scope, setScope] = useState<TaskScope>('my')
    const [layout, setLayout] = useState<TaskLayout>('list')
    const [projectId, setProjectId] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
    const [showCreate, setShowCreate] = useState(false)
    const [showMobileFilters, setShowMobileFilters] = useState(false)
    const [showMobileSearch, setShowMobileSearch] = useState(false)

    useEffect(() => {
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY)
            if (stored) setTasks(JSON.parse(stored) as MockTask[])
        } catch {
            // The prototype falls back to the fixture data if local storage is unavailable.
        } finally {
            setHydrated(true)
        }
    }, [])

    useEffect(() => {
        if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    }, [hydrated, tasks])

    const filteredTasks = useMemo(() => tasks.filter(task => {
        const matchesProject = projectId === 'all' || task.projectId === projectId
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter
        const matchesView = scope !== 'my' || task.assignee === currentPerson
        const query = search.trim().toLowerCase()
        const matchesSearch = !query || `${task.title} ${task.description} ${task.labels.join(' ')}`.toLowerCase().includes(query)
        return matchesProject && matchesStatus && matchesView && matchesSearch
    }), [projectId, search, statusFilter, tasks, scope])

    const selectedTask = tasks.find(task => task.id === selectedTaskId) || null
    const openTasks = tasks.filter(task => task.status !== 'done').length
    const overdueTasks = tasks.filter(isOverdue).length
    const completedTasks = tasks.filter(task => task.status === 'done').length

    function updateTask(id: string, changes: Partial<MockTask>) {
        setTasks(previous => previous.map(task => task.id === id ? { ...task, ...changes } : task))
    }

    function toggleSubtask(taskId: string, subtaskId: string) {
        setTasks(previous => previous.map(task => task.id === taskId ? { ...task, subtasks: task.subtasks.map(subtask => subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask) } : task))
    }

    function addComment(taskId: string, body: string) {
        setTasks(previous => previous.map(task => task.id === taskId ? { ...task, comments: [...task.comments, { id: `comment-${Date.now()}`, author: currentPerson, body, createdAt: 'Just now' }] } : task))
    }

    function createTask(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const title = String(form.get('title') || '').trim()
        if (!title) return
        const task: MockTask = {
            id: `task-${Date.now()}`,
            projectId: String(form.get('projectId') || projects[0].id),
            title,
            description: String(form.get('description') || ''),
            status: 'todo',
            priority: String(form.get('priority') || 'normal') as TaskPriority,
            assignee: currentPerson,
            dueDate: String(form.get('dueDate') || ''),
            labels: [],
            subtasks: [],
            comments: [],
            createdAt: new Date().toISOString().slice(0, 10),
        }
        setTasks(previous => [task, ...previous])
        setShowCreate(false)
        setSelectedTaskId(task.id)
    }

    return <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70">
        <div className="mx-auto max-w-[1500px] space-y-6 p-5 sm:p-8">
            <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600"><Sparkles className="h-3.5 w-3.5" /> Shared work</div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Tasks that keep everyone in the loop.</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A calm place to see what matters, take ownership, and help each other move work forward.</p>
                </div>
                <Button className="h-12 rounded-2xl px-5 shadow-sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add task</Button>
            </header>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <SummaryCard label="Open" value={openTasks} icon={<Circle className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />} detail="Across projects" />
                <SummaryCard label="Due soon" value={tasks.filter(task => task.status !== 'done' && task.dueDate >= '2026-09-26' && task.dueDate <= '2026-10-03').length} icon={<Clock3 className="h-4 w-4 text-amber-600 sm:h-5 sm:w-5" />} detail="Next 7 days" />
                <SummaryCard label="Done" value={completedTasks} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" />} detail={`${overdueTasks} overdue`} />
            </div>

            <Card className="overflow-hidden rounded-3xl border-slate-200/80 shadow-sm">
                <div className="border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap xl:justify-between">
                        <div className="flex shrink-0 rounded-xl border border-slate-200 p-0.5 sm:p-1"><Button title="My tasks" aria-label="Show my tasks" size="icon" variant={scope === 'my' ? 'secondary' : 'ghost'} className={cn('h-8 w-8 rounded-lg', scope === 'my' ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700')} onClick={() => setScope('my')}><UserRound className="h-4 w-4" /></Button><Button title="All tasks" aria-label="Show all tasks" size="icon" variant={scope === 'all' ? 'secondary' : 'ghost'} className={cn('h-8 w-8 rounded-lg', scope === 'all' ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700')} onClick={() => setScope('all')}><UsersRound className="h-4 w-4" /></Button></div>
                        <div className={cn('flex min-w-0 flex-1 items-center gap-1 sm:flex-wrap sm:gap-2', showMobileFilters || showMobileSearch ? 'flex-wrap' : 'flex-nowrap')}>
                            <div className="flex shrink-0 rounded-xl border border-slate-200 p-1"><Button title="List view" aria-label="List view" size="icon" variant={layout === 'list' ? 'secondary' : 'ghost'} className={cn('h-8 w-8 rounded-lg', layout === 'list' ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700')} onClick={() => setLayout('list')}><List className="h-4 w-4" /></Button><Button title="Board view" aria-label="Board view" size="icon" variant={layout === 'board' ? 'secondary' : 'ghost'} className={cn('h-8 w-8 rounded-lg', layout === 'board' ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700')} onClick={() => setLayout('board')}><LayoutGrid className="h-4 w-4" /></Button><Button title="Gantt view" aria-label="Gantt view" size="icon" variant={layout === 'gantt' ? 'secondary' : 'ghost'} className={cn('h-8 w-8 rounded-lg', layout === 'gantt' ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700')} onClick={() => setLayout('gantt')}><GanttChart className="h-4 w-4" /></Button></div>
                            <div className="relative ml-auto hidden min-w-0 flex-1 sm:block sm:flex-none"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={event => setSearch(event.target.value)} className="h-10 w-full rounded-xl pl-9 sm:w-56" placeholder="Search tasks" /></div>
                            <Button title="Search tasks" aria-label="Search tasks" variant={showMobileSearch ? 'secondary' : 'outline'} className="ml-auto h-8 w-8 shrink-0 rounded-xl p-0 sm:hidden" onClick={() => setShowMobileSearch(previous => !previous)}><Search className="h-4 w-4" /></Button>
                            <Button title="Filter tasks" aria-label="Filter tasks" variant={showMobileFilters ? 'secondary' : 'outline'} className="h-8 w-8 shrink-0 rounded-xl p-0 sm:hidden" onClick={() => setShowMobileFilters(previous => !previous)}><Filter className="h-4 w-4" />{(projectId !== 'all' || statusFilter !== 'all') && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">{Number(projectId !== 'all') + Number(statusFilter !== 'all')}</span>}</Button>
                            {showMobileSearch && <div className="relative order-5 w-full sm:hidden"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input autoFocus value={search} onChange={event => setSearch(event.target.value)} className="h-10 w-full rounded-xl pl-9" placeholder="Search tasks" /></div>}
                            <div className={cn('order-6 w-full flex-wrap items-center gap-2', showMobileFilters ? 'flex' : 'hidden', 'sm:order-none sm:flex sm:w-auto')}><Select value={projectId} onValueChange={setProjectId}><SelectTrigger className="h-10 min-w-0 flex-1 rounded-xl sm:w-[170px] sm:flex-none"><SelectValue placeholder="Project" /></SelectTrigger><SelectContent><SelectItem value="all">All projects</SelectItem>{projects.map(project => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}</SelectContent></Select><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-10 min-w-0 flex-1 rounded-xl sm:w-[145px] sm:flex-none"><Filter className="mr-2 h-3.5 w-3.5" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{Object.entries(statusMeta).map(([value, meta]) => <SelectItem key={value} value={value}>{meta.label}</SelectItem>)}</SelectContent></Select></div>
                        </div>
                    </div>
                </div>
                {layout === 'board' ? <BoardView tasks={filteredTasks} onSelect={setSelectedTaskId} /> : layout === 'gantt' ? <GanttView tasks={filteredTasks} onSelect={setSelectedTaskId} /> : <TaskList tasks={filteredTasks} onSelect={setSelectedTaskId} onStatusChange={(id, status) => updateTask(id, { status })} />}
            </Card>
        </div>

        <TaskDetailDialog task={selectedTask} onClose={() => setSelectedTaskId(null)} onUpdate={updateTask} onToggleSubtask={toggleSubtask} onAddComment={addComment} />
        <CreateTaskDialog open={showCreate} onClose={() => setShowCreate(false)} onSubmit={createTask} />
    </div>
}

function SummaryCard({ label, value, icon, detail }: { label: string; value: number; icon: ReactNode; detail: string }) {
    return <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm sm:rounded-3xl"><CardContent className="flex min-h-[92px] items-start justify-between gap-1 p-3 sm:min-h-0 sm:p-5"><div className="min-w-0"><p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">{label}</p><p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">{value}</p><p className="mt-0.5 hidden truncate text-xs text-slate-500 sm:mt-1 sm:block">{detail}</p></div><div className="rounded-xl bg-slate-50 p-2 sm:rounded-2xl sm:p-3">{icon}</div></CardContent></Card>
}

function TaskList({ tasks, onSelect, onStatusChange }: { tasks: MockTask[]; onSelect: (id: string) => void; onStatusChange: (id: string, status: TaskStatus) => void }) {
    if (!tasks.length) return <EmptyState />
    return <div className="divide-y divide-slate-100 bg-white">{tasks.map(task => <TaskRow key={task.id} task={task} onSelect={onSelect} onStatusChange={onStatusChange} />)}</div>
}

function TaskRow({ task, onSelect, onStatusChange }: { task: MockTask; onSelect: (id: string) => void; onStatusChange: (id: string, status: TaskStatus) => void }) {
    const project = projectFor(task.projectId)
    const status = statusMeta[task.status]
    const priority = priorityMeta[task.priority]
    return <button className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 sm:px-6" onClick={() => onSelect(task.id)}>
        <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2', task.status === 'done' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 group-hover:border-blue-500')} onClick={event => { event.stopPropagation(); onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done') }}>{task.status === 'done' && <Check className="h-3.5 w-3.5" />}</span>
        <span className="min-w-0 flex-1"><span className={cn('block truncate text-sm font-bold text-slate-900', task.status === 'done' && 'text-slate-400 line-through')}>{task.title}</span><span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} />{project.name}{task.subtasks.length > 0 && <><span>·</span><span>{task.subtasks.filter(item => item.done).length}/{task.subtasks.length} subtasks</span></>}{task.comments.length > 0 && <><span>·</span><MessageSquare className="h-3 w-3" />{task.comments.length}</>}</span></span>
        <span className="hidden items-center gap-3 md:flex">{task.labels.slice(0, 2).map(label => <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500" key={label}>{label}</span>)}<span className={cn('text-xs font-bold', priority.className)}>{priority.label}</span></span>
        <Badge variant={status.badge} className="hidden sm:inline-flex">{status.label}</Badge>
        <span className={cn('hidden w-20 text-right text-xs font-semibold sm:block', isOverdue(task) ? 'text-rose-600' : 'text-slate-400')}>{formatDueDate(task.dueDate)}</span><ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
    </button>
}

function GanttView({ tasks, onSelect }: { tasks: MockTask[]; onSelect: (id: string) => void }) {
    const timelineStart = new Date('2026-09-26T12:00:00')
    const days = Array.from({ length: 14 }, (_, index) => { const date = new Date(timelineStart); date.setDate(date.getDate() + index); return date })
    const dayOffset = (date: string) => Math.max(0, Math.min(13, Math.round((new Date(`${date}T12:00:00`).getTime() - timelineStart.getTime()) / 86400000)))

    return <div className="overflow-x-auto bg-white"><div className="min-w-[760px] p-4 sm:p-6"><div className="grid grid-cols-[220px_repeat(14,minmax(36px,1fr))] border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400"><div className="pb-3">Task</div>{days.map(day => <div className="border-l border-slate-100 pb-3 text-center" key={day.toISOString()}>{day.toLocaleDateString(undefined, { weekday: 'narrow', day: 'numeric' })}</div>)}</div><div className="divide-y divide-slate-100">{tasks.length ? tasks.map(task => { const start = dayOffset(task.createdAt); const end = Math.max(start + 1, dayOffset(task.dueDate)); const span = end - start + 1; return <button className="grid w-full grid-cols-[220px_repeat(14,minmax(36px,1fr))] items-center py-3 text-left hover:bg-slate-50" key={task.id} onClick={() => onSelect(task.id)}><span className="truncate pr-4 text-xs font-bold text-slate-700">{task.title}</span><span className="col-span-14 grid grid-cols-subgrid"><span className="h-7 self-center rounded-lg px-2 py-1 text-[10px] font-bold text-white" style={{ gridColumn: `${start + 1} / span ${span}`, backgroundColor: projectFor(task.projectId).color }}>{statusMeta[task.status].label}</span></span></button> }) : <EmptyState />}</div></div></div>
}

function BoardView({ tasks, onSelect }: { tasks: MockTask[]; onSelect: (id: string) => void }) {
    return <div className="grid gap-4 overflow-x-auto bg-slate-50/60 p-4 md:grid-cols-4">{(Object.keys(statusMeta) as TaskStatus[]).map(status => <div className="min-w-[240px]" key={status}><div className="mb-3 flex items-center justify-between px-1"><span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500"><span className={cn('h-2 w-2 rounded-full', statusMeta[status].color)} />{statusMeta[status].label}</span><span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-400">{tasks.filter(task => task.status === status).length}</span></div><div className="space-y-3">{tasks.filter(task => task.status === status).map(task => <button className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md" key={task.id} onClick={() => onSelect(task.id)}><div className="mb-3 flex items-start justify-between gap-2"><span className={cn('rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide', priorityMeta[task.priority].className, 'bg-slate-50')}>{priorityMeta[task.priority].label}</span><MoreHorizontal className="h-4 w-4 text-slate-300" /></div><p className="text-sm font-bold leading-5 text-slate-900">{task.title}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{task.description}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400"><span className={cn(isOverdue(task) && 'font-bold text-rose-600')}><CalendarDays className="mr-1 inline h-3.5 w-3.5" />{formatDueDate(task.dueDate)}</span><span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">{task.assignee === currentPerson ? 'Y' : task.assignee.slice(0, 1)}</span></div></button>)}</div></div>)}</div>
}

function TaskDetailDialog({ task, onClose, onUpdate, onToggleSubtask, onAddComment }: { task: MockTask | null; onClose: () => void; onUpdate: (id: string, changes: Partial<MockTask>) => void; onToggleSubtask: (taskId: string, subtaskId: string) => void; onAddComment: (taskId: string, body: string) => void }) {
    const [comment, setComment] = useState('')
    if (!task) return null
    const project = projectFor(task.projectId)
    return <Dialog open={Boolean(task)} onOpenChange={open => !open && onClose()}><DialogContent key={task.id} className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl p-0"><div className="border-b border-slate-100 px-6 py-5"><div className="flex items-start justify-between gap-4"><div><div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-400"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} />{project.name}<ChevronRight className="h-3 w-3" />Task details</div><DialogTitle className="text-2xl font-extrabold leading-tight">{task.title}</DialogTitle><DialogDescription className="mt-2">Created {formatDueDate(task.createdAt)}</DialogDescription></div><button className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" onClick={onClose}><X className="h-5 w-5" /></button></div></div><div className="space-y-6 px-6 py-6"><div className="grid gap-3 sm:grid-cols-3"><DetailSelect label="Status" value={task.status} options={Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))} onChange={value => onUpdate(task.id, { status: value as TaskStatus })} /><DetailSelect label="Priority" value={task.priority} options={Object.entries(priorityMeta).map(([value, meta]) => ({ value, label: meta.label }))} onChange={value => onUpdate(task.id, { priority: value as TaskPriority })} /><div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned to</p><div className="flex h-10 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700"><UserRound className="h-4 w-4 text-slate-400" />{task.assignee}</div></div></div><div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Description</p><p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{task.description || 'No description yet.'}</p></div>{task.subtasks.length > 0 && <div><p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Subtasks <span className="ml-1 normal-case tracking-normal">{task.subtasks.filter(item => item.done).length}/{task.subtasks.length}</span></p><div className="space-y-2">{task.subtasks.map(subtask => <button className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50" key={subtask.id} onClick={() => onToggleSubtask(task.id, subtask.id)}><span className={cn('flex h-5 w-5 items-center justify-center rounded-full border', subtask.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300')}>{subtask.done && <Check className="h-3 w-3" />}</span><span className={cn('text-sm font-medium', subtask.done && 'text-slate-400 line-through')}>{subtask.title}</span></button>)}</div></div>}<div><div className="mb-3 flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Conversation</p><span className="text-xs text-slate-400">{task.comments.length} comment{task.comments.length === 1 ? '' : 's'}</span></div><div className="space-y-3">{task.comments.map(item => <div className="rounded-2xl bg-slate-50 p-4" key={item.id}><div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-700">{item.author}</span><span className="text-[11px] text-slate-400">{item.createdAt}</span></div><p className="mt-2 text-sm leading-5 text-slate-600">{item.body}</p></div>)}<div className="flex gap-2"><Input value={comment} onChange={event => setComment(event.target.value)} placeholder="Add context or a question..." className="h-11 rounded-xl" onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && comment.trim()) { event.preventDefault(); onAddComment(task.id, comment.trim()); setComment('') } }} /><Button className="h-11 rounded-xl" disabled={!comment.trim()} onClick={() => { onAddComment(task.id, comment.trim()); setComment('') }}><MessageSquare className="h-4 w-4" /></Button></div></div></div></div><DialogFooter className="border-t border-slate-100 px-6 py-4"><Button variant="outline" className="rounded-xl" onClick={onClose}>Close</Button><Button className="rounded-xl" onClick={() => onUpdate(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}>{task.status === 'done' ? 'Reopen task' : 'Mark complete'}</Button></DialogFooter></DialogContent></Dialog>
}

function DetailSelect({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
    return <div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><Select value={value} onValueChange={onChange}><SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
}

function CreateTaskDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
    return <Dialog open={open} onOpenChange={value => !value && onClose()}><DialogContent className="rounded-3xl sm:max-w-lg"><DialogHeader><DialogTitle className="text-2xl font-extrabold">Add a task</DialogTitle><DialogDescription>Give the work enough context for someone to pick it up with confidence.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={onSubmit}><div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="task-title">Task title</label><Input id="task-title" name="title" autoFocus required placeholder="What needs to be done?" className="h-12 rounded-xl" /></div><div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="task-description">Description</label><Textarea id="task-description" name="description" placeholder="Add useful context..." className="min-h-24 rounded-xl" /></div><div className="grid gap-3 sm:grid-cols-2"><div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="task-project">Project</label><select id="task-project" name="projectId" defaultValue={projects[0].id} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="website">Website refresh</option><option value="onboarding">New team onboarding</option><option value="office">Office setup</option></select></div><div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="task-priority">Priority</label><select id="task-priority" name="priority" defaultValue="normal" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div></div><div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="task-due-date">Due date</label><Input id="task-due-date" name="dueDate" type="date" className="h-10 rounded-xl" /></div><DialogFooter className="pt-3"><Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>Cancel</Button><Button type="submit" className="rounded-xl"><Plus className="h-4 w-4" />Create task</Button></DialogFooter></form></DialogContent></Dialog>
}

function EmptyState() {
    return <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><CheckCircle2 className="h-7 w-7" /></div><h3 className="mt-4 text-lg font-extrabold text-slate-900">Nothing here yet</h3><p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">Try changing your filters or search, or add a new task when something needs attention.</p></div>
}
