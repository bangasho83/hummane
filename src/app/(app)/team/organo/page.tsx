'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Maximize2, Minimize2, Network, RotateCcw, Users, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useApp } from '@/lib/context/AppContext'
import type { Employee } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hummane-api.vercel.app'

type TreeNode = Employee & { children: TreeNode[] }

const normalizeId = (value?: string | null) => value?.trim() || ''

function OrgNodeCard({
  node,
  isHighlighted,
  isDimmed,
  onHoverStart,
  onHoverEnd,
}: {
  node: TreeNode
  isHighlighted: boolean
  isDimmed: boolean
  onHoverStart: (id: string) => void
  onHoverEnd: () => void
}) {
  return (
    <div
      onMouseEnter={() => onHoverStart(node.id)}
      onMouseLeave={onHoverEnd}
      className={`min-w-[180px] max-w-[200px] rounded-2xl border px-4 py-3 shadow-sm transition-all duration-150 ${
        isHighlighted
          ? 'border-blue-300 bg-blue-50/70 shadow-blue-100'
          : 'border-slate-200 bg-white'
      } ${
        isDimmed ? 'opacity-45' : 'opacity-100'
      }`}
    >
      <p className="text-sm font-extrabold text-slate-900 text-center leading-tight break-words">{node.name}</p>
      <p className="text-xs text-slate-500 text-center mt-1 break-words">
        {node.roleName || node.position || 'Role Unassigned'}
      </p>
    </div>
  )
}

function OrgTree({
  node,
  isHighlighted,
  isDimmed,
  onHoverStart,
  onHoverEnd,
}: {
  node: TreeNode
  isHighlighted: (id: string) => boolean
  isDimmed: (id: string) => boolean
  onHoverStart: (id: string) => void
  onHoverEnd: () => void
}) {
  return (
    <div className="flex flex-col items-center">
      <OrgNodeCard
        node={node}
        isHighlighted={isHighlighted(node.id)}
        isDimmed={isDimmed(node.id)}
        onHoverStart={onHoverStart}
        onHoverEnd={onHoverEnd}
      />
      {node.children.length > 0 && (
        <>
          <div className="h-6 w-px bg-slate-300" />
          <div className="flex flex-wrap items-start justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-3">
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <OrgTree
                  node={child}
                  isHighlighted={isHighlighted}
                  isDimmed={isDimmed}
                  onHoverStart={onHoverStart}
                  onHoverEnd={onHoverEnd}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function TeamOrganoPage() {
  const router = useRouter()
  const { apiAccessToken, currentUser, currentCompany } = useApp()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [hoveredEmployeeId, setHoveredEmployeeId] = useState<string | null>(null)
  const chartFrameRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!apiAccessToken) return
    const fetchEmployees = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/employees`, {
          headers: { Authorization: `Bearer ${apiAccessToken}` },
        })
        if (!res.ok) {
          setEmployees([])
          return
        }
        const data = await res.json().catch(() => [])
        const list = Array.isArray(data) ? data : (data?.data || data?.employees || [])
        setEmployees(Array.isArray(list) ? list : [])
      } finally {
        setLoading(false)
      }
    }
    void fetchEmployees()
  }, [apiAccessToken])

  useEffect(() => {
    if (!currentUser) router.push('/login')
    else if (!currentCompany) router.push('/company-setup')
  }, [currentUser, currentCompany, router])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = document.fullscreenElement === chartFrameRef.current
      setIsFullscreen(active)
      if (!active) setZoom(1)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const { roots, unassigned, parentById, childrenById } = useMemo(() => {
    const byId = new Map<string, TreeNode>()
    employees.forEach((emp) => byId.set(emp.id, { ...emp, children: [] }))
    const parentById = new Map<string, string>()
    const childrenById = new Map<string, string[]>()

    const roots: TreeNode[] = []
    const unassigned: TreeNode[] = []

    byId.forEach((node) => {
      const managerId = normalizeId(node.reportingManagerId)
      if (!managerId || managerId === node.id) {
        roots.push(node)
        return
      }
      const manager = byId.get(managerId)
      if (manager) {
        manager.children.push(node)
        parentById.set(node.id, manager.id)
        const siblings = childrenById.get(manager.id) || []
        siblings.push(node.id)
        childrenById.set(manager.id, siblings)
      }
      else unassigned.push(node)
    })

    const sortTree = (node: TreeNode) => {
      node.children.sort((a, b) => a.name.localeCompare(b.name))
      node.children.forEach(sortTree)
    }
    roots.sort((a, b) => a.name.localeCompare(b.name))
    roots.forEach(sortTree)

    return { roots, unassigned, parentById, childrenById }
  }, [employees])

  const toggleFullscreen = async () => {
    const node = chartFrameRef.current
    if (!node) return
    try {
      if (document.fullscreenElement === node) {
        await document.exitFullscreen()
      } else {
        await node.requestFullscreen()
      }
    } catch {
      // ignore unsupported/blocked fullscreen
    }
  }

  const zoomIn = () => setZoom(prev => Math.min(2.25, Number((prev + 0.1).toFixed(2))))
  const zoomOut = () => setZoom(prev => Math.max(0.5, Number((prev - 0.1).toFixed(2))))
  const resetZoom = () => setZoom(1)
  const highlightedIds = useMemo(() => {
    if (!hoveredEmployeeId) return new Set<string>()
    const ids = new Set<string>([hoveredEmployeeId])

    let cursor = hoveredEmployeeId
    while (parentById.has(cursor)) {
      const parent = parentById.get(cursor)
      if (!parent) break
      ids.add(parent)
      cursor = parent
    }

    const walkChildren = (id: string) => {
      const children = childrenById.get(id) || []
      children.forEach((childId) => {
        if (ids.has(childId)) return
        ids.add(childId)
        walkChildren(childId)
      })
    }
    walkChildren(hoveredEmployeeId)
    return ids
  }, [hoveredEmployeeId, parentById, childrenById])
  const isHighlighted = (id: string) => hoveredEmployeeId !== null && highlightedIds.has(id)
  const isDimmed = (id: string) => hoveredEmployeeId !== null && !highlightedIds.has(id)

  if (!currentUser || !currentCompany) return null

  return (
    <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/team')}
            className="rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
            aria-label="Back to team"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Network className="w-8 h-8 text-blue-600" />
              Team Organo
            </h1>
            <p className="text-slate-500 font-medium">Organization chart based on reporting relationships.</p>
          </div>
        </div>
      </div>

      <div ref={chartFrameRef} className={isFullscreen ? 'bg-slate-100 p-6' : ''}>
      <Card className={`border border-slate-100 shadow-premium rounded-3xl bg-white overflow-hidden ${isFullscreen ? 'h-full' : ''}`}>
        <CardContent className="p-8">
          <div className="mb-4 flex items-center justify-end gap-2">
            {isFullscreen && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={zoomOut}
                  className="rounded-xl border-slate-200"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <div className="min-w-[70px] text-center text-xs font-semibold text-slate-600">
                  {Math.round(zoom * 100)}%
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={zoomIn}
                  className="rounded-xl border-slate-200"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={resetZoom}
                  className="rounded-xl border-slate-200"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void toggleFullscreen()}
              className="rounded-xl border-slate-200"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading organization chart...</div>
          ) : roots.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No team members found.</p>
            </div>
          ) : (
            <div className="space-y-10">
              <div className={isFullscreen ? 'h-[calc(100vh-220px)] overflow-auto rounded-2xl border border-slate-200 bg-slate-50/40 p-4' : 'overflow-x-auto'}>
                <div
                  className="min-w-max px-1"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center',
                    transition: 'transform 120ms ease-out',
                  }}
                >
                  <div className="flex flex-wrap items-start justify-center gap-4">
                    {roots.map((root) => (
                      <OrgTree
                        key={root.id}
                        node={root}
                        isHighlighted={isHighlighted}
                        isDimmed={isDimmed}
                        onHoverStart={setHoveredEmployeeId}
                        onHoverEnd={() => setHoveredEmployeeId(null)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {unassigned.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800 mb-2">Unmapped Reporting Links</p>
                  <p className="text-xs text-amber-700 mb-3">
                    These members reference managers that are not present in the current team dataset.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unassigned.map((emp) => (
                      <span key={emp.id} className="rounded-full bg-white border border-amber-300 px-3 py-1 text-xs text-amber-800">
                        {emp.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
