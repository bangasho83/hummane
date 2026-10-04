'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import type { FormEvent, ReactNode } from 'react'
import {
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronRight,
    Circle,
    Clock3,
    Filter,
    FolderKanban,
    GanttChart,
    LayoutGrid,
    List,
    MessageSquare,
    MoreHorizontal,
    Plus,
    Search,
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
import { cn } from '@/lib/utils'
import { TaskCreateDialog, type TaskCreateValues } from '@/features/tasks/components/TaskCreateDialog'
import { addTaskCommentApi, addTaskProjectMemberApi, archiveTaskProjectApi, createTaskApi, createTaskProjectApi, fetchTaskProjectMembersApi, fetchTaskProjectsApi, fetchTasksApi, removeTaskProjectMemberApi, updateTaskApi, updateTaskProjectApi, type TaskApi, type TaskProjectApi } from '@/lib/api/client'

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
    projectName?: string
    projectColor?: string
    parentTaskId?: string
    title: string
    description: string
    status: TaskStatus
    priority: TaskPriority
    assignee: string
    assigneeId?: string
    dueDate: string
    labels: string[]
    subtasks: { id: string; title: string; done: boolean }[]
    comments: MockComment[]
    createdAt: string
}

const currentPerson = 'You'

const projects: MockProject[] = [
    { id: 'website', name: 'Website refresh', description: 'A clearer, calmer home for Hummane.', color: '#2563eb', owner: 'Omair', taskCount: 8 },
    { id: 'onboarding', name: 'New team onboarding', description: 'Make the first week feel welcoming and simple.', color: '#10b981', owner: 'Sarah', taskCount: 5 },
    { id: 'office', name: 'Office setup', description: 'The practical things that help everyone do good work.', color: '#f59e0b', owner: 'John', taskCount: 4 },
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

function projectFor(id: string, name?: string, color?: string) {
    return name ? { id, name, color: color || '#2563eb', description: '', owner: '', taskCount: 0 } : projects.find(project => project.id === id) || projects[0]
}

function mapTask(task: TaskApi): MockTask {
    return { id: task.id, projectId: task.projectId, projectName: task.projectName, projectColor: task.projectColor, parentTaskId: task.parentTaskId || undefined, title: task.title, description: task.description || '', status: task.status, priority: task.priority, assignee: task.assignee || 'Unassigned', assigneeId: task.assigneeId || undefined, dueDate: task.dueDate || '', labels: task.labels || [], subtasks: task.subtasks || [], comments: (task.comments || []).map(comment => ({ id: comment.id, author: comment.authorName || comment.authorId || 'Team member', body: comment.body, createdAt: comment.createdAt })), createdAt: task.createdAt }
}

function dateKey(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function parseDate(value: string) {
    if (!value) return null
    const parsed = new Date(value.length === 10 ? `${value}T12:00:00` : value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatDueDate(date: string) {
    const parsed = parseDate(date)
    return parsed ? parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No due date'
}

function isOverdue(task: MockTask) {
    return task.status !== 'done' && Boolean(task.dueDate) && task.dueDate < dateKey(new Date())
}

export function TaskWorkspace() {
    const router = useRouter()
    const { apiAccessToken, employees, meProfile, isHydrating } = useApp()
    const [tasks, setTasks] = useState<MockTask[]>([])
    const [projectOptions, setProjectOptions] = useState<MockProject[]>(projects)
    const [loading, setLoading] = useState(true)
    const [scope, setScope] = useState<TaskScope>('all')
    const [layout, setLayout] = useState<TaskLayout>('list')
    const [projectId, setProjectId] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
    const [showCreate, setShowCreate] = useState(false)
    const [showProjects, setShowProjects] = useState(false)
    const [showSearchFilters, setShowSearchFilters] = useState(false)

    useEffect(() => {
        if (isHydrating || !apiAccessToken) return
        Promise.all([fetchTaskProjectsApi(apiAccessToken), fetchTasksApi(apiAccessToken, { scope: 'all' })])
            .then(([apiProjects, apiTasks]) => {
                setProjectOptions(apiProjects.map((project: TaskProjectApi) => ({ id: project.id, name: project.name, description: project.description, color: project.color, owner: '', taskCount: 0 })))
                setTasks(apiTasks.map(mapTask))
            })
            .catch(error => console.error('Could not load tasks', error))
            .finally(() => setLoading(false))
    }, [apiAccessToken, isHydrating])

    const filteredTasks = useMemo(() => tasks.filter(task => {
        const matchesProject = projectId === 'all' || task.projectId === projectId
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter
        const matchesView = scope !== 'my' || (meProfile?.employeeId ? task.assigneeId === meProfile.employeeId : task.assignee === currentPerson)
        const query = search.trim().toLowerCase()
        const matchesSearch = !query || `${task.title} ${task.description} ${task.labels.join(' ')}`.toLowerCase().includes(query)
        return matchesProject && matchesStatus && matchesView && matchesSearch
    }), [meProfile, projectId, search, statusFilter, tasks, scope])

    const selectedTask = tasks.find(task => task.id === selectedTaskId) || null
    const openTasks = tasks.filter(task => task.status !== 'done').length
    const overdueTasks = tasks.filter(isOverdue).length

    if (isHydrating || loading) return <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">Loading tasks...</div>

    async function updateTask(id: string, changes: Partial<MockTask>) {
        if (!apiAccessToken) return
        const updated = await updateTaskApi(id, { status: changes.status, priority: changes.priority, title: changes.title, description: changes.description, dueDate: changes.dueDate || null, labels: changes.labels, assigneeId: changes.assigneeId || null }, apiAccessToken)
        if (updated) setTasks(previous => previous.map(task => task.id === id ? mapTask(updated) : task))
    }

    async function toggleSubtask(taskId: string, subtaskId: string) {
        if (!apiAccessToken) return
        const parent = tasks.find(task => task.id === taskId)
        const subtask = parent?.subtasks.find(item => item.id === subtaskId)
        if (!subtask) return
        await updateTask(subtaskId, { status: subtask.done ? 'todo' : 'done' })
        setTasks(previous => previous.map(task => task.id === taskId ? { ...task, subtasks: task.subtasks.map(item => item.id === subtaskId ? { ...item, done: !item.done } : item) } : task))
    }

    async function addComment(taskId: string, body: string) {
        if (!apiAccessToken) return
        const updated = await addTaskCommentApi(taskId, body, apiAccessToken)
        if (updated) setTasks(previous => previous.map(task => task.id === taskId ? mapTask(updated) : task))
    }

    async function createTask(values: TaskCreateValues) {
        if (!apiAccessToken) return
        const created = await createTaskApi({ projectId: values.projectId, title: values.title, description: values.description, priority: values.priority, dueDate: values.dueDate || null, assigneeId: values.assigneeId || meProfile?.employeeId || null }, apiAccessToken)
        setTasks(previous => [mapTask(created), ...previous])
        setShowCreate(false)
        router.push(`/member/tasks/${created.id}`)
    }

    async function createProject(name: string, description: string) {
        if (!apiAccessToken) return
        const created = await createTaskProjectApi({ name, description }, apiAccessToken)
        setProjectOptions(previous => [...previous, { id: created.id, name: created.name, description: created.description, color: created.color, owner: meProfile?.name || '', taskCount: 0 }])
    }

    async function updateProject(id: string, name: string, description: string) {
        if (!apiAccessToken) return
        const updated = await updateTaskProjectApi(id, { name, description }, apiAccessToken)
        if (updated) setProjectOptions(previous => previous.map(project => project.id === id ? { ...project, name: updated.name, description: updated.description, color: updated.color } : project))
    }

    async function archiveProject(id: string) {
        if (!apiAccessToken) return
        await archiveTaskProjectApi(id, apiAccessToken)
        setProjectOptions(previous => previous.filter(project => project.id !== id))
        if (projectId === id) setProjectId('all')
    }

    return <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70">
        <div className="space-y-6">
            <header className="flex items-center justify-between gap-4">
                <div className="min-w-0"><h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Tasks</h1><p className="mt-1 truncate text-sm text-slate-500">See what needs attention and what comes next.</p></div>
                <div className="flex shrink-0 items-center gap-2"><Button variant="ghost" className="h-10 rounded-xl px-2 text-slate-600 hover:bg-white hover:text-blue-600 sm:px-3" onClick={() => setShowProjects(true)}><FolderKanban className="h-4 w-4" /><span>Projects</span></Button><Button className="h-10 rounded-xl bg-blue-600 px-3 text-white shadow-sm hover:bg-blue-700 sm:px-5" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /><span className="hidden sm:inline">Add task</span><span className="sm:hidden">Add</span></Button></div>
            </header>

            <div className="grid grid-cols-2 gap-2 sm:max-w-md sm:gap-3">
                <SummaryCard label="Open" value={openTasks} icon={<Circle className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />} detail="Across projects" />
                <SummaryCard label="Due soon" value={tasks.filter(task => { const today = new Date(); const soon = new Date(today); soon.setDate(today.getDate() + 7); return task.status !== 'done' && task.dueDate >= dateKey(today) && task.dueDate <= dateKey(soon) }).length} icon={<Clock3 className="h-4 w-4 text-amber-600 sm:h-5 sm:w-5" />} detail={`${overdueTasks} overdue`} />
            </div>

            <Card className="overflow-hidden rounded-3xl border-slate-200/80 shadow-sm">
                <div className="border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap xl:justify-between">
                        <div className="flex shrink-0 rounded-xl border border-slate-200 p-0.5 sm:p-1"><Button title="My tasks" aria-label="Show my tasks" size="icon" variant={scope === 'my' ? 'secondary' : 'ghost'} className={cn('h-8 w-8 rounded-lg', scope === 'my' ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700')} onClick={() => setScope('my')}><UserRound className="h-4 w-4" /></Button><Button title="All tasks" aria-label="Show all tasks" size="icon" variant={scope === 'all' ? 'secondary' : 'ghost'} className={cn('h-8 w-8 rounded-lg', scope === 'all' ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700')} onClick={() => setScope('all')}><UsersRound className="h-4 w-4" /></Button></div>
                        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
                            <div className="flex shrink-0 rounded-xl border border-slate-200 p-1"><Button title="List view" aria-label="List view" size="icon" variant={layout === 'list' ? 'secondary' : 'ghost'} className={cn('h-8 w-8 rounded-lg', layout === 'list' ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700')} onClick={() => setLayout('list')}><List className="h-4 w-4" /></Button><Button title="Board view" aria-label="Board view" size="icon" variant={layout === 'board' ? 'secondary' : 'ghost'} className={cn('h-8 w-8 rounded-lg', layout === 'board' ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700')} onClick={() => setLayout('board')}><LayoutGrid className="h-4 w-4" /></Button><Button title="Gantt view" aria-label="Gantt view" size="icon" variant={layout === 'gantt' ? 'secondary' : 'ghost'} className={cn('h-8 w-8 rounded-lg', layout === 'gantt' ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700')} onClick={() => setLayout('gantt')}><GanttChart className="h-4 w-4" /></Button></div>
                            <Button title="Search and filter tasks" aria-label="Search and filter tasks" variant="ghost" className={cn('ml-auto h-8 shrink-0 rounded-lg px-2 sm:px-3', search || projectId !== 'all' || statusFilter !== 'all' ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700')} onClick={() => setShowSearchFilters(true)}><Filter className="h-4 w-4" /><span className="hidden text-xs font-bold sm:inline">Search & filter</span>{(search || projectId !== 'all' || statusFilter !== 'all') && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] text-blue-600">{Number(Boolean(search)) + Number(projectId !== 'all') + Number(statusFilter !== 'all')}</span>}</Button>
                        </div>
                    </div>
                </div>
                {layout === 'board' ? <BoardView tasks={filteredTasks} onSelect={taskId => router.push(`/member/tasks/${taskId}`)} /> : layout === 'gantt' ? <GanttView tasks={filteredTasks} onSelect={taskId => router.push(`/member/tasks/${taskId}`)} /> : <TaskList tasks={filteredTasks} onSelect={taskId => router.push(`/member/tasks/${taskId}`)} onStatusChange={(id, status) => updateTask(id, { status })} />}
            </Card>
        </div>

        <TaskDetailDialog task={selectedTask} onClose={() => setSelectedTaskId(null)} onUpdate={updateTask} onToggleSubtask={toggleSubtask} onAddComment={addComment} />
        <TaskCreateDialog open={showCreate} onClose={() => setShowCreate(false)} onSubmit={createTask} projects={projectOptions} employees={employees} defaultAssigneeId={meProfile?.employeeId} />
        <ProjectsDialog open={showProjects} onClose={() => setShowProjects(false)} projects={projectOptions} employees={employees} accessToken={apiAccessToken} onCreate={createProject} onUpdate={updateProject} onArchive={archiveProject} onSelect={id => { setProjectId(id); setShowProjects(false) }} />
        <SearchFilterDialog open={showSearchFilters} onClose={() => setShowSearchFilters(false)} search={search} onSearchChange={setSearch} projectId={projectId} onProjectChange={setProjectId} statusFilter={statusFilter} onStatusChange={setStatusFilter} projects={projectOptions} onClear={() => { setSearch(''); setProjectId('all'); setStatusFilter('all') }} />
    </div>
}

function SummaryCard({ label, value, icon, detail }: { label: string; value: number; icon: ReactNode; detail: string }) {
    return <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm"><CardContent className="flex h-[68px] items-center justify-between gap-1 px-3 py-2.5 sm:h-[76px] sm:px-4"><div className="min-w-0"><p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">{label}</p><p className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">{value}</p><span className="sr-only">{detail}</span></div><div className="rounded-xl bg-slate-50 p-2">{icon}</div></CardContent></Card>
}

function TaskList({ tasks, onSelect, onStatusChange }: { tasks: MockTask[]; onSelect: (id: string) => void; onStatusChange: (id: string, status: TaskStatus) => void }) {
    if (!tasks.length) return <EmptyState />
    return <div className="divide-y divide-slate-100 bg-white">{tasks.map(task => <TaskRow key={task.id} task={task} onSelect={onSelect} onStatusChange={onStatusChange} />)}</div>
}

function TaskRow({ task, onSelect, onStatusChange }: { task: MockTask; onSelect: (id: string) => void; onStatusChange: (id: string, status: TaskStatus) => void }) {
    const project = projectFor(task.projectId, task.projectName, task.projectColor)
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
    const timelineStart = new Date()
    timelineStart.setHours(12, 0, 0, 0)
    const days = Array.from({ length: 14 }, (_, index) => { const date = new Date(timelineStart); date.setDate(date.getDate() + index); return date })
    const dayOffset = (date: string) => Math.max(0, Math.min(13, Math.round((new Date(`${date}T12:00:00`).getTime() - timelineStart.getTime()) / 86400000)))

    return <div className="overflow-x-auto bg-white"><div className="min-w-[760px] p-4 sm:p-6"><div className="grid grid-cols-[220px_repeat(14,minmax(36px,1fr))] border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400"><div className="pb-3">Task</div>{days.map(day => <div className="border-l border-slate-100 pb-3 text-center" key={day.toISOString()}>{day.toLocaleDateString(undefined, { weekday: 'narrow', day: 'numeric' })}</div>)}</div><div className="divide-y divide-slate-100">{tasks.length ? tasks.map(task => { const start = dayOffset(task.createdAt); const end = Math.max(start + 1, dayOffset(task.dueDate)); const span = end - start + 1; return <button className="grid w-full grid-cols-[220px_repeat(14,minmax(36px,1fr))] items-center py-3 text-left hover:bg-slate-50" key={task.id} onClick={() => onSelect(task.id)}><span className="truncate pr-4 text-xs font-bold text-slate-700">{task.title}</span><span className="col-span-14 grid grid-cols-subgrid"><span className="h-7 self-center rounded-lg px-2 py-1 text-[10px] font-bold text-white" style={{ gridColumn: `${start + 1} / span ${span}`, backgroundColor: projectFor(task.projectId, task.projectName, task.projectColor).color }}>{statusMeta[task.status].label}</span></span></button> }) : <EmptyState />}</div></div></div>
}

function BoardView({ tasks, onSelect }: { tasks: MockTask[]; onSelect: (id: string) => void }) {
    return <div className="grid gap-4 overflow-x-auto bg-slate-50/60 p-4 md:grid-cols-4">{(Object.keys(statusMeta) as TaskStatus[]).map(status => <div className="min-w-[240px]" key={status}><div className="mb-3 flex items-center justify-between px-1"><span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500"><span className={cn('h-2 w-2 rounded-full', statusMeta[status].color)} />{statusMeta[status].label}</span><span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-400">{tasks.filter(task => task.status === status).length}</span></div><div className="space-y-3">{tasks.filter(task => task.status === status).map(task => <button className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md" key={task.id} onClick={() => onSelect(task.id)}><div className="mb-3 flex items-start justify-between gap-2"><span className={cn('rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide', priorityMeta[task.priority].className, 'bg-slate-50')}>{priorityMeta[task.priority].label}</span><MoreHorizontal className="h-4 w-4 text-slate-300" /></div><p className="text-sm font-bold leading-5 text-slate-900">{task.title}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{task.description}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400"><span className={cn(isOverdue(task) && 'font-bold text-rose-600')}><CalendarDays className="mr-1 inline h-3.5 w-3.5" />{formatDueDate(task.dueDate)}</span><span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">{task.assignee === currentPerson ? 'Y' : task.assignee.slice(0, 1)}</span></div></button>)}</div></div>)}</div>
}

function TaskDetailDialog({ task, onClose, onUpdate, onToggleSubtask, onAddComment }: { task: MockTask | null; onClose: () => void; onUpdate: (id: string, changes: Partial<MockTask>) => void; onToggleSubtask: (taskId: string, subtaskId: string) => void; onAddComment: (taskId: string, body: string) => void }) {
    const [comment, setComment] = useState('')
    if (!task) return null
    const project = projectFor(task.projectId, task.projectName, task.projectColor)
    return <Dialog open={Boolean(task)} onOpenChange={open => !open && onClose()}><DialogContent key={task.id} className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl p-0"><div className="border-b border-slate-100 px-6 py-5"><div className="flex items-start justify-between gap-4"><div><div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-400"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} />{project.name}<ChevronRight className="h-3 w-3" />Task details</div><DialogTitle className="text-2xl font-extrabold leading-tight">{task.title}</DialogTitle><DialogDescription className="mt-2">Created {formatDueDate(task.createdAt)}</DialogDescription></div><button className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" onClick={onClose}><X className="h-5 w-5" /></button></div></div><div className="space-y-6 px-6 py-6"><div className="grid gap-3 sm:grid-cols-3"><DetailSelect label="Status" value={task.status} options={Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))} onChange={value => onUpdate(task.id, { status: value as TaskStatus })} /><DetailSelect label="Priority" value={task.priority} options={Object.entries(priorityMeta).map(([value, meta]) => ({ value, label: meta.label }))} onChange={value => onUpdate(task.id, { priority: value as TaskPriority })} /><div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned to</p><div className="flex h-10 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700"><UserRound className="h-4 w-4 text-slate-400" />{task.assignee}</div></div></div><div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Description</p><p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{task.description || 'No description yet.'}</p></div>{task.subtasks.length > 0 && <div><p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Subtasks <span className="ml-1 normal-case tracking-normal">{task.subtasks.filter(item => item.done).length}/{task.subtasks.length}</span></p><div className="space-y-2">{task.subtasks.map(subtask => <button className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50" key={subtask.id} onClick={() => onToggleSubtask(task.id, subtask.id)}><span className={cn('flex h-5 w-5 items-center justify-center rounded-full border', subtask.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300')}>{subtask.done && <Check className="h-3 w-3" />}</span><span className={cn('text-sm font-medium', subtask.done && 'text-slate-400 line-through')}>{subtask.title}</span></button>)}</div></div>}<div><div className="mb-3 flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Conversation</p><span className="text-xs text-slate-400">{task.comments.length} comment{task.comments.length === 1 ? '' : 's'}</span></div><div className="space-y-3">{task.comments.map(item => <div className="rounded-2xl bg-slate-50 p-4" key={item.id}><div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-700">{item.author}</span><span className="text-[11px] text-slate-400">{item.createdAt}</span></div><p className="mt-2 text-sm leading-5 text-slate-600">{item.body}</p></div>)}<div className="flex gap-2"><Input value={comment} onChange={event => setComment(event.target.value)} placeholder="Add context or a question..." className="h-11 rounded-xl" onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && comment.trim()) { event.preventDefault(); onAddComment(task.id, comment.trim()); setComment('') } }} /><Button className="h-11 rounded-xl" disabled={!comment.trim()} onClick={() => { onAddComment(task.id, comment.trim()); setComment('') }}><MessageSquare className="h-4 w-4" /></Button></div></div></div></div><DialogFooter className="border-t border-slate-100 px-6 py-4"><Button variant="outline" className="rounded-xl" onClick={onClose}>Close</Button><Button className="rounded-xl" onClick={() => onUpdate(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}>{task.status === 'done' ? 'Reopen task' : 'Mark complete'}</Button></DialogFooter></DialogContent></Dialog>
}

function DetailSelect({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
    return <div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><Select value={value} onValueChange={onChange}><SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
}

function SearchFilterDialog({ open, onClose, search, onSearchChange, projectId, onProjectChange, statusFilter, onStatusChange, projects: projectOptions, onClear }: { open: boolean; onClose: () => void; search: string; onSearchChange: (value: string) => void; projectId: string; onProjectChange: (value: string) => void; statusFilter: string; onStatusChange: (value: string) => void; projects: MockProject[]; onClear: () => void }) {
    const activeFilters = Number(Boolean(search)) + Number(projectId !== 'all') + Number(statusFilter !== 'all')
    return <Dialog open={open} onOpenChange={value => !value && onClose()}><DialogContent className="rounded-3xl sm:max-w-lg"><DialogHeader><DialogTitle className="text-2xl font-extrabold">Search and filter tasks</DialogTitle><DialogDescription>Find the work you want to focus on.</DialogDescription></DialogHeader><div className="space-y-4"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input autoFocus value={search} onChange={event => onSearchChange(event.target.value)} className="h-12 rounded-xl pl-9" placeholder="Search tasks" /></div><div className="grid gap-3 sm:grid-cols-2"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Project</p><Select value={projectId} onValueChange={onProjectChange}><SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="All projects" /></SelectTrigger><SelectContent><SelectItem value="all">All projects</SelectItem>{projectOptions.map(project => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}</SelectContent></Select></div><div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</p><Select value={statusFilter} onValueChange={onStatusChange}><SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{Object.entries(statusMeta).map(([value, meta]) => <SelectItem key={value} value={value}>{meta.label}</SelectItem>)}</SelectContent></Select></div></div></div><DialogFooter className="flex-row justify-between sm:justify-between"><Button type="button" variant="ghost" className="rounded-xl text-slate-500" disabled={!activeFilters} onClick={onClear}>Clear all</Button><Button type="button" className="rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={onClose}>Show tasks</Button></DialogFooter></DialogContent></Dialog>
}

function ProjectsDialog({ open, onClose, projects: projectOptions, employees, accessToken, onCreate, onUpdate, onArchive, onSelect }: { open: boolean; onClose: () => void; projects: MockProject[]; employees: { id: string; name: string }[]; accessToken: string | null; onCreate: (name: string, description: string) => Promise<void>; onUpdate: (id: string, name: string, description: string) => Promise<void>; onArchive: (id: string) => Promise<void>; onSelect: (id: string) => void }) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState('')
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [members, setMembers] = useState<{ id: string; name: string; email: string }[]>([])
    const [memberId, setMemberId] = useState('')
    const [editing, setEditing] = useState(false)
    const [editName, setEditName] = useState('')
    const [editDescription, setEditDescription] = useState('')

    const selectedProject = projectOptions.find(project => project.id === selectedProjectId)

    useEffect(() => {
        if (!selectedProjectId || !accessToken) { setMembers([]); return }
        fetchTaskProjectMembersApi(selectedProjectId, accessToken).then(setMembers).catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load project members'))
    }, [accessToken, selectedProjectId])

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!name.trim()) return
        setCreating(true)
        setError('')
        try {
            await onCreate(name.trim(), description.trim())
            setName('')
            setDescription('')
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Could not create project')
        } finally {
            setCreating(false)
        }
    }

    async function addMember() {
        if (!selectedProjectId || !memberId || !accessToken) return
        try { setMembers(await addTaskProjectMemberApi(selectedProjectId, memberId, accessToken)); setMemberId('') } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not add member') }
    }

    async function removeMember(id: string) {
        if (!selectedProjectId || !accessToken) return
        try { setMembers(await removeTaskProjectMemberApi(selectedProjectId, id, accessToken)) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not remove member') }
    }

    async function saveProject() {
        if (!selectedProject || !editName.trim()) return
        try { await onUpdate(selectedProject.id, editName.trim(), editDescription.trim()); setEditing(false) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not update project') }
    }

    async function archiveSelectedProject() {
        if (!selectedProject) return
        try { await onArchive(selectedProject.id); setSelectedProjectId(null) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not archive project') }
    }

    return <Dialog open={open} onOpenChange={value => !value && onClose()}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg"><DialogHeader><DialogTitle className="text-2xl font-extrabold">Projects</DialogTitle><DialogDescription>Projects available in your workspace. Create one when you want to bring work together.</DialogDescription></DialogHeader><div className="space-y-3">{projectOptions.length ? projectOptions.map(project => <div key={project.id} className="flex items-center gap-2 rounded-2xl border border-slate-200 p-3"><button type="button" className="flex min-w-0 flex-1 items-start gap-3 p-1 text-left" onClick={() => onSelect(project.id)}><span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: project.color }} /><span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-900">{project.name}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{project.description || 'No description yet.'}</span></span></button><Button type="button" variant="outline" className="h-8 shrink-0 rounded-lg px-2 text-xs" onClick={() => { setSelectedProjectId(project.id); setEditName(project.name); setEditDescription(project.description); setError('') }}>Manage</Button></div>) : <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No projects yet.</p>}</div>{selectedProject && <div className="space-y-4 border-t border-slate-100 pt-5"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Manage {selectedProject.name}</p><Button type="button" variant="ghost" className="h-8 rounded-lg px-2 text-xs" onClick={() => setSelectedProjectId(null)}>Back</Button></div>{editing ? <div className="space-y-2"><Input value={editName} onChange={event => setEditName(event.target.value)} className="h-10 rounded-xl" /><Input value={editDescription} onChange={event => setEditDescription(event.target.value)} className="h-10 rounded-xl" /><Button type="button" className="h-9 rounded-xl bg-blue-600 text-white" onClick={saveProject}>Save project</Button></div> : <div className="flex gap-2"><Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => setEditing(true)}>Edit</Button><Button type="button" variant="outline" className="h-9 rounded-xl text-rose-600" onClick={archiveSelectedProject}>Archive</Button></div>}<div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Members</p><div className="space-y-2">{members.map(member => <div key={member.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"><span>{member.name}</span><Button type="button" variant="ghost" className="h-7 px-2 text-xs text-slate-500" onClick={() => removeMember(member.id)}>Remove</Button></div>)}</div><div className="mt-3 flex gap-2"><select value={memberId} onChange={event => setMemberId(event.target.value)} className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Add a member</option>{employees.filter(employee => !members.some(member => member.id === employee.id)).map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select><Button type="button" className="h-10 rounded-xl bg-blue-600 px-3 text-white" disabled={!memberId} onClick={addMember}>Add</Button></div></div></div>}<div className="border-t border-slate-100 pt-5"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Add a project</p><form className="space-y-3" onSubmit={submit}><Input value={name} onChange={event => setName(event.target.value)} placeholder="Project name" className="h-11 rounded-xl" required /><Input value={description} onChange={event => setDescription(event.target.value)} placeholder="Short description (optional)" className="h-11 rounded-xl" />{error && <p className="text-sm text-rose-600">{error}</p>}<Button type="submit" disabled={creating || !name.trim()} className="h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700">{creating ? 'Creating...' : <><Plus className="h-4 w-4" />Create project</>}</Button></form></div><DialogFooter><Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>Close</Button></DialogFooter></DialogContent></Dialog>
}

function EmptyState() {
    return <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><CheckCircle2 className="h-7 w-7" /></div><h3 className="mt-4 text-lg font-extrabold text-slate-900">Nothing here yet</h3><p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">Try changing your filters or search, or add a new task when something needs attention.</p></div>
}
