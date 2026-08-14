'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, ChevronRight, Edit3, Goal, Loader2, Plus, RotateCcw, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { useApp } from '@/lib/context/AppContext'
import {
  createOkrCycleApi,
  createOkrObjectiveApi,
  deleteOkrObjectiveApi,
  fetchActiveOkrBoardApi,
  updateOkrCycleApi,
  updateOkrObjectiveApi,
  type OkrCyclePayload,
  type OkrObjectivePayload,
} from '@/lib/api/client'
import type { OkrBoard, OkrCycle, OkrObjective, OkrObjectiveLevel, OkrObjectiveStatus } from '@/types'

const dateKey = (date: Date) => date.toISOString().slice(0, 10)
const addYear = () => { const date = new Date(); date.setFullYear(date.getFullYear() + 1); return dateKey(date) }
const progressClass = (status: OkrObjectiveStatus) => status === 'completed' ? 'bg-emerald-500' : status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'

function ProgressBar({ progress, status }: { progress: number; status?: OkrObjectiveStatus | null }) {
  return <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${progressClass(status ?? 'upcoming')}`} style={{ width: `${progress}%` }} /></div>
}

function IndividualObjectiveForm({
  cycleId, objective, level, departmentId, parentObjectiveId, employeeId, onSave, onCancel,
}: {
  cycleId: string
  objective?: OkrObjective | null
  level: OkrObjectiveLevel
  departmentId?: string
  parentObjectiveId?: string
  employeeId?: string
  onSave: (payload: OkrObjectivePayload) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<OkrObjectivePayload>({
    cycleId, level, departmentId, parentObjectiveId, employeeId,
    headline: objective?.headline ?? '', description: objective?.description ?? '', currentValue: objective?.currentValue ?? 0,
    targetValue: objective?.targetValue ?? 1, unit: objective?.unit ?? '', dueDate: objective?.dueDate ?? addYear(),
    status: objective?.status ?? 'upcoming', note: '',
  })
  const [saving, setSaving] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true)
    try {
      const payload = Object.fromEntries(Object.entries({ ...form, currentValue: Number(form.currentValue), targetValue: Number(form.targetValue) }).filter(([, value]) => value !== undefined)) as OkrObjectivePayload
      await onSave(payload)
      onCancel()
    }
    catch (error) { toast(error instanceof Error ? error.message : 'Could not save objective', 'error') }
    finally { setSaving(false) }
  }
  return <form className="space-y-4" onSubmit={submit}>
    <div><label className="text-xs font-bold text-slate-600">Objective</label><Input required value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} className="mt-1" /></div>
    <div><label className="text-xs font-bold text-slate-600">Description</label><Textarea value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 min-h-20" /></div>
    <div className="grid grid-cols-2 gap-3">
      <div><label className="text-xs font-bold text-slate-600">Current value</label><Input required min="0" type="number" value={form.currentValue} onChange={e => setForm({ ...form, currentValue: Number(e.target.value) })} className="mt-1" /></div>
      <div><label className="text-xs font-bold text-slate-600">Target value</label><Input required min="0.01" step="any" type="number" value={form.targetValue} onChange={e => setForm({ ...form, targetValue: Number(e.target.value) })} className="mt-1" /></div>
      <div><label className="text-xs font-bold text-slate-600">Unit</label><Input required value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="mt-1" placeholder="Clients" /></div>
      <div><label className="text-xs font-bold text-slate-600">Due date</label><Input required type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="mt-1" /></div>
    </div>
    <div><label className="text-xs font-bold text-slate-600">Status</label><Select value={form.status} onValueChange={value => setForm({ ...form, status: value as OkrObjectiveStatus })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="upcoming">Upcoming</SelectItem><SelectItem value="in_progress">In progress</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select></div>
    {objective && <div><label className="text-xs font-bold text-slate-600">Update note (optional)</label><Textarea value={form.note ?? ''} onChange={e => setForm({ ...form, note: e.target.value })} className="mt-1 min-h-16" placeholder="What changed?" /></div>}
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button disabled={saving} type="submit">{saving ? 'Saving…' : 'Save objective'}</Button></div>
  </form>
}

function TeamObjectiveForm({ cycleId, objective, departmentId, onSave, onCancel }: { cycleId: string; objective?: OkrObjective; departmentId?: string; onSave: (payload: OkrObjectivePayload) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<OkrObjectivePayload>({ cycleId, level: 'team', departmentId, headline: objective?.headline ?? '', description: objective?.description ?? '' })
  const [saving, setSaving] = useState(false)
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); try { await onSave(form); onCancel() } catch (error) { toast(error instanceof Error ? error.message : 'Could not save team objective', 'error') } finally { setSaving(false) } }
  return <form className="space-y-4" onSubmit={submit}><div><label className="text-xs font-bold text-slate-600">Team objective</label><Input required value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} className="mt-1" /></div><div><label className="text-xs font-bold text-slate-600">What this team is responsible for</label><Textarea value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 min-h-24" /></div><p className="rounded-md bg-blue-50 p-3 text-xs text-blue-700">Progress is calculated automatically from this department&apos;s individual objectives.</p><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button disabled={saving} type="submit">{saving ? 'Saving…' : 'Save team objective'}</Button></div></form>
}

function ObjectiveCard({ objective, onEdit, onDelete }: { objective: OkrObjective; onEdit: () => void; onDelete?: () => void }) {
  const isTeam = objective.level === 'team'
  return <Card className="border-slate-200 shadow-sm"><CardContent className="p-4 space-y-3">
    <div className="flex justify-between gap-2"><div className="min-w-0"><p className="font-bold text-slate-900 text-sm leading-tight">{objective.headline || 'Untitled objective'}</p>{!isTeam && objective.dueDate && <p className="text-xs text-slate-500 mt-1">Due {new Date(`${objective.dueDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>}</div><div className="flex gap-1"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit} aria-label="Edit objective"><Edit3 className="h-3.5 w-3.5" /></Button>{onDelete && <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={onDelete} aria-label="Delete objective"><Trash2 className="h-3.5 w-3.5" /></Button>}</div></div>
    {objective.description && <p className="text-xs text-slate-500 line-clamp-2">{objective.description}</p>}
    <ProgressBar progress={objective.progress} status={objective.status} />
    <div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-600">{isTeam ? 'Member progress roll-up' : `${objective.currentValue} / ${objective.targetValue} ${objective.unit ?? ''}`}</span><span className="font-bold text-blue-600">{objective.progress}%</span></div>
    {objective.updatedByName && <p className="text-[10px] text-slate-400">Last updated by {objective.updatedByName}</p>}
  </CardContent></Card>
}

export function OkrBoard({ adminView = false }: { adminView?: boolean }) {
  const { apiAccessToken, isHydrating, departments, employees } = useApp()
  const [board, setBoard] = useState<OkrBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [cycleDialog, setCycleDialog] = useState(false)
  const [objectiveDialog, setObjectiveDialog] = useState<{ objective?: OkrObjective; level: OkrObjectiveLevel; departmentId?: string; parentObjectiveId?: string; employeeId?: string } | null>(null)
  const [cycleForm, setCycleForm] = useState<OkrCyclePayload>({ headline: '', description: '', targetValue: 0, unit: '', targetDate: addYear(), status: 'active' })

  const refresh = useCallback(async () => {
    if (!apiAccessToken) return
    setLoading(true)
    try { const value = await fetchActiveOkrBoardApi(apiAccessToken); setBoard(value); if (value) setCycleForm({ headline: value.cycle.headline, description: value.cycle.description, targetValue: value.cycle.targetValue, unit: value.cycle.unit, targetDate: value.cycle.targetDate, status: value.cycle.status }) }
    catch (error) { toast(error instanceof Error ? error.message : 'Could not load OKRs', 'error') }
    finally { setLoading(false) }
  }, [apiAccessToken])

  useEffect(() => { if (!isHydrating) void refresh() }, [isHydrating, refresh])

  const saveCycle = async (event: React.FormEvent) => {
    event.preventDefault(); if (!apiAccessToken) return
    try { if (board) await updateOkrCycleApi(board.cycle.id, cycleForm, apiAccessToken); else await createOkrCycleApi(cycleForm, apiAccessToken); setCycleDialog(false); await refresh(); toast('OKR cycle saved', 'success') }
    catch (error) { toast(error instanceof Error ? error.message : 'Could not save cycle', 'error') }
  }
  const saveObjective = async (payload: OkrObjectivePayload) => {
    if (!apiAccessToken) return
    if (objectiveDialog?.objective) await updateOkrObjectiveApi(objectiveDialog.objective.id, payload, apiAccessToken)
    else await createOkrObjectiveApi(payload, apiAccessToken)
    await refresh(); toast('Objective saved', 'success')
  }
  const removeObjective = async (id: string) => {
    if (!apiAccessToken || !confirm('Delete this objective and its linked individual objectives?')) return
    try { await deleteOkrObjectiveApi(id, apiAccessToken); await refresh(); toast('Objective deleted', 'success') } catch { toast('Could not delete objective', 'error') }
  }
  const employeeByDepartment = useMemo(() => new Map(departments.map(department => [department.id, employees.filter(employee => employee.departmentId === department.id)])), [departments, employees])

  if (loading || isHydrating) return <div className="flex min-h-80 items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading shared OKRs…</div>
  if (!board) return <>
    <Card className="border-dashed border-slate-300"><CardContent className="p-14 text-center"><Goal className="mx-auto h-12 w-12 text-blue-500" /><h1 className="mt-4 text-2xl font-extrabold text-slate-900">Start your shared OKR cycle</h1><p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">Anyone on the team can create the company objective, then connect department and individual objectives to it.</p><Button className="mt-6" onClick={() => { setCycleForm({ headline: '', description: '', targetValue: 0, unit: '', targetDate: addYear(), status: 'active' }); setCycleDialog(true) }}><Plus className="mr-2 h-4 w-4" />Create shared OKR cycle</Button></CardContent></Card>
    <Dialog open={cycleDialog} onOpenChange={setCycleDialog}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Create shared OKR cycle</DialogTitle></DialogHeader><form onSubmit={saveCycle} className="space-y-4"><div><label className="text-xs font-bold text-slate-600">Company objective</label><Input required className="mt-1" value={cycleForm.headline ?? ''} onChange={e => setCycleForm({ ...cycleForm, headline: e.target.value })} /></div><div><label className="text-xs font-bold text-slate-600">Description</label><Textarea className="mt-1" value={cycleForm.description ?? ''} onChange={e => setCycleForm({ ...cycleForm, description: e.target.value })} /></div><div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-slate-600">Target</label><Input required type="number" min="0" className="mt-1" value={cycleForm.targetValue ?? 0} onChange={e => setCycleForm({ ...cycleForm, targetValue: Number(e.target.value) })} /></div><div><label className="text-xs font-bold text-slate-600">Unit</label><Input required className="mt-1" value={cycleForm.unit ?? ''} onChange={e => setCycleForm({ ...cycleForm, unit: e.target.value })} /></div></div><div><label className="text-xs font-bold text-slate-600">Target date</label><Input required type="date" className="mt-1" value={cycleForm.targetDate ?? ''} onChange={e => setCycleForm({ ...cycleForm, targetDate: e.target.value })} /></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setCycleDialog(false)}>Cancel</Button><Button type="submit">Save company objective</Button></div></form></DialogContent></Dialog>
  </>

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Shared team workspace</p><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{adminView ? 'Company OKR alignment' : 'Our OKRs'}</h1><p className="mt-1 text-slate-500">Everyone in the company can enrich this cycle.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void refresh()}><RotateCcw className="mr-2 h-4 w-4" />Refresh</Button><Button onClick={() => setCycleDialog(true)}><Edit3 className="mr-2 h-4 w-4" />Edit company objective</Button></div></div>
    <Card className="border-slate-200 bg-gradient-to-br from-white to-blue-50"><CardContent className="p-6"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2 text-sm font-bold text-blue-600"><Goal className="h-4 w-4" />Company objective</div><h2 className="mt-2 text-xl font-extrabold text-slate-900">{board.cycle.headline || 'Untitled company objective'}</h2>{board.cycle.description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{board.cycle.description}</p>}<p className="mt-3 text-sm font-semibold text-slate-700">{board.cycle.targetValue} {board.cycle.unit} · Target {new Date(`${board.cycle.targetDate}T00:00:00`).toLocaleDateString()}</p></div><div className="min-w-32 text-center"><p className="text-3xl font-extrabold text-blue-600">{board.cycle.progress ?? 0}%</p><p className="text-xs font-bold uppercase tracking-wider text-slate-400">aligned progress</p></div></div></CardContent></Card>
    <div className="grid gap-6 xl:grid-cols-[1.2fr_.9fr]">
      <section className="space-y-4"><div className="flex items-center justify-between"><h2 className="font-extrabold text-slate-900">Individual OKRs</h2><span className="text-xs text-slate-500">Connected to department objectives</span></div>
      {(board.departments.length ? board.departments : []).map(department => { const open = expanded.has(department.id); const availableEmployees = employeeByDepartment.get(department.id) ?? []; const assigned = new Set(department.individuals.map(item => item.employeeId)); return <Card key={department.id} className="border-slate-200"><CardContent className="p-0"><button className="flex w-full items-center justify-between p-4 text-left" onClick={() => setExpanded(previous => { const next = new Set(previous); next.has(department.id) ? next.delete(department.id) : next.add(department.id); return next })}><span className="flex items-center gap-2 font-bold text-slate-900"><Users className="h-4 w-4 text-blue-600" />{department.name || 'Department'} <span className="text-xs font-medium text-slate-400">{department.individuals.length} OKRs</span></span>{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>{open && <div className="space-y-3 border-t border-slate-100 p-4">{department.individuals.map(objective => <div key={objective.id} className="grid gap-2 sm:grid-cols-[150px_1fr]"><div className="pt-3 text-sm"><p className="font-bold text-slate-700">{objective.employeeName}</p><p className="text-xs text-slate-400">{objective.employeeRole}</p></div><ObjectiveCard objective={objective} onEdit={() => setObjectiveDialog({ objective, level: 'individual' })} onDelete={() => void removeObjective(objective.id)} /></div>)}{availableEmployees.filter(employee => !assigned.has(employee.id)).map(employee => <Button key={employee.id} variant="outline" className="w-full justify-start border-dashed" onClick={() => setObjectiveDialog({ level: 'individual', departmentId: undefined, parentObjectiveId: department.teamObjective.id, employeeId: employee.id })}><Plus className="mr-2 h-4 w-4" />Add objective for {employee.name}</Button>)}</div>}</CardContent></Card> })}
      {departments.filter(department => !board.departments.some(item => item.id === department.id)).map(department => <Button key={department.id} variant="outline" className="w-full justify-start border-dashed" onClick={() => setObjectiveDialog({ level: 'team', departmentId: department.id })}><Plus className="mr-2 h-4 w-4" />Add team objective for {department.name}</Button>)}</section>
      <section className="space-y-4"><h2 className="font-extrabold text-slate-900">Team OKRs</h2>{board.departments.map(department => <div key={department.id} className="space-y-2"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{department.name}</p><ObjectiveCard objective={department.teamObjective} onEdit={() => setObjectiveDialog({ objective: department.teamObjective, level: 'team' })} onDelete={() => void removeObjective(department.teamObjective.id)} /></div>)}</section>
    </div>
    <Dialog open={cycleDialog} onOpenChange={setCycleDialog}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{board ? 'Edit company objective' : 'Create shared OKR cycle'}</DialogTitle></DialogHeader><form onSubmit={saveCycle} className="space-y-4"><div><label className="text-xs font-bold text-slate-600">Company objective</label><Input required className="mt-1" value={cycleForm.headline ?? ''} onChange={e => setCycleForm({ ...cycleForm, headline: e.target.value })} /></div><div><label className="text-xs font-bold text-slate-600">Description</label><Textarea className="mt-1" value={cycleForm.description ?? ''} onChange={e => setCycleForm({ ...cycleForm, description: e.target.value })} /></div><div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-slate-600">Target</label><Input required type="number" min="0" className="mt-1" value={cycleForm.targetValue ?? 0} onChange={e => setCycleForm({ ...cycleForm, targetValue: Number(e.target.value) })} /></div><div><label className="text-xs font-bold text-slate-600">Unit</label><Input required className="mt-1" value={cycleForm.unit ?? ''} onChange={e => setCycleForm({ ...cycleForm, unit: e.target.value })} /></div></div><div><label className="text-xs font-bold text-slate-600">Target date</label><Input required type="date" className="mt-1" value={cycleForm.targetDate ?? ''} onChange={e => setCycleForm({ ...cycleForm, targetDate: e.target.value })} /></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setCycleDialog(false)}>Cancel</Button><Button type="submit">Save company objective</Button></div></form></DialogContent></Dialog>
    <Dialog open={Boolean(objectiveDialog)} onOpenChange={open => !open && setObjectiveDialog(null)}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{objectiveDialog?.objective ? `Edit ${objectiveDialog.level === 'team' ? 'team objective' : 'objective'}` : `Add ${objectiveDialog?.level === 'team' ? 'team objective' : 'objective'}`}</DialogTitle></DialogHeader>{objectiveDialog?.level === 'team' ? <TeamObjectiveForm cycleId={board.cycle.id} objective={objectiveDialog.objective} departmentId={objectiveDialog.departmentId ?? objectiveDialog.objective?.departmentId ?? undefined} onSave={saveObjective} onCancel={() => setObjectiveDialog(null)} /> : objectiveDialog && <IndividualObjectiveForm cycleId={board.cycle.id} objective={objectiveDialog.objective} level="individual" departmentId={objectiveDialog.departmentId} parentObjectiveId={objectiveDialog.parentObjectiveId ?? objectiveDialog.objective?.parentObjectiveId ?? undefined} employeeId={objectiveDialog.employeeId ?? objectiveDialog.objective?.employeeId ?? undefined} onSave={saveObjective} onCancel={() => setObjectiveDialog(null)} />}</DialogContent></Dialog>
  </div>
}
