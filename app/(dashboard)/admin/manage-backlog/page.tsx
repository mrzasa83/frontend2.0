'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft, RefreshCw, BarChart3, PlayCircle, PauseCircle, TrendingUp,
  ArrowUpDown, ArrowUp, ArrowDown, Save, X, Plus, Search, Calendar, User, FileText, Clock, CheckCircle, AlertTriangle, ChevronUp, ChevronDown, Edit3
} from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type CurrentJob = {
  id?: number
  Status: string
  name: string
  customer: string | null
  job_type: string | null
  shop_pn: string | null
  cust_pn: string | null
  'HDW Eng': string | null
  'PCB Eng': string | null
  'ASM Eng': string | null
  'CAM Eng': string | null
  account_mngr: string | null
  route: number | null
  hdw_date: string | null
  bom_date: string | null
  pcb_date: string | null
  asm_date: string | null
  release_status?: string | null
  program?: string | null
}

type HoldInfo = {
  hasHold: boolean
  owner: string | null
  target: string | null
  action: string | null
  onHoldDate: string | null
  daysOnHold: number
}

type JobStatusNote = {
  id: number
  job_id: number
  timestamp: number
  timestampFormatted: string
  notes: string
  hdw_date: string | null
  bom_date: string | null
  cam_date: string | null
  cam_complete: boolean
  rev_date: string | null
  rev_complete: boolean
  prl_date: string | null
  arl_date: string | null
  hdw_text: string
  hdw_hold: HoldInfo
  pcb_text: string
  pcb_hold: HoldInfo
  asm_text: string
  asm_hold: HoldInfo
}

type SectionEdit = {
  text: string
  hasHold: boolean
  owner: string
  target: string
  action: string
  onHoldDate: string
  daysOnHold: number
  wasOnHold: boolean // Track previous hold state
}

type ScheduleEdit = {
  hdw_date: string
  hdw_complete: boolean
  bom_date: string
  bom_complete: boolean
  cam_date: string
  cam_complete: boolean
  rev_date: string
  rev_complete: boolean
  prl_date: string
  prl_complete: boolean
  arl_date: string
  arl_complete: boolean
}

type EngineerOption = {
  userId: number
  username: string
  name: string | null
  ccName: string | null
}

export default function ManageBacklogPage() {
  const { data: session } = useSession()
  const [currentJobs, setCurrentJobs] = useState<CurrentJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'onhold'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: keyof CurrentJob | null; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' })
  
  // Modal state
  const [selectedJob, setSelectedJob] = useState<CurrentJob | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Partial<CurrentJob>>({})
  const [savingJob, setSavingJob] = useState(false)
  
  // Job status notes (timeline)
  const [statusNotes, setStatusNotes] = useState<JobStatusNote[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  
  // Section edits (HDW, PCB, ASM)
  const [hdwEdit, setHdwEdit] = useState<SectionEdit>({ text: '', hasHold: false, owner: '', target: '', action: '', onHoldDate: '', daysOnHold: 0, wasOnHold: false })
  const [pcbEdit, setPcbEdit] = useState<SectionEdit>({ text: '', hasHold: false, owner: '', target: '', action: '', onHoldDate: '', daysOnHold: 0, wasOnHold: false })
  const [asmEdit, setAsmEdit] = useState<SectionEdit>({ text: '', hasHold: false, owner: '', target: '', action: '', onHoldDate: '', daysOnHold: 0, wasOnHold: false })
  
  // Schedule edit (latest dates)
  const [scheduleEdit, setScheduleEdit] = useState<ScheduleEdit>({
    hdw_date: '', hdw_complete: false,
    bom_date: '', bom_complete: false,
    cam_date: '', cam_complete: false,
    rev_date: '', rev_complete: false,
    prl_date: '', prl_complete: false,
    arl_date: '', arl_complete: false
  })
  
  // Baseline editing mode (for admin when baseline has no dates)
  const [editingBaseline, setEditingBaseline] = useState(false)
  
  // Engineer dropdown options
  const [hdwEngineers, setHdwEngineers] = useState<EngineerOption[]>([])
  const [camEngineers, setCamEngineers] = useState<EngineerOption[]>([])
  const [pcbEngineers, setPcbEngineers] = useState<EngineerOption[]>([])
  const [asmEngineers, setAsmEngineers] = useState<EngineerOption[]>([])

  // Check if baseline has no dates (all empty)
  const baselineHasNoDates = (b: JobStatusNote | null) => {
    if (!b) return true
    return !b.hdw_date && !b.bom_date && !b.cam_date && !b.rev_date && !b.prl_date && !b.arl_date && !b.cam_complete && !b.rev_complete
  }

  useEffect(() => { 
    fetchCurrentJobs()
    fetchEngineers()
  }, [])

  const fetchCurrentJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/dashboard/current-jobs')
      if (!res.ok) throw new Error('Failed to fetch current jobs')
      const data = await res.json()
      const jobsWithIds = (data.results || []).map((job: CurrentJob, idx: number) => ({ ...job, id: idx }))
      setCurrentJobs(jobsWithIds)
      await fetchJobStatuses(jobsWithIds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const fetchJobStatuses = async (jobs: CurrentJob[]) => {
    try {
      const shopPNs = jobs.map(j => j.shop_pn).filter(pn => pn && pn.trim() !== '')
      if (shopPNs.length === 0) return
      const res = await fetch('/api/admin/job-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopPNs })
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.success && data.data) {
        setCurrentJobs(prev => prev.map(job => {
          const statusData = data.data[job.shop_pn]
          return statusData ? { ...job, release_status: statusData.releaseStatus, program: statusData.program } : job
        }))
      }
    } catch (err) { console.error('Error fetching job statuses:', err) }
  }

  const fetchEngineers = async () => {
    try {
      const res = await fetch('/api/admin/engineer-roles')
      if (!res.ok) return
      const data = await res.json()
      const users = data.users || []
      
      setHdwEngineers(users.filter((u: any) => u.roles.includes('HDW')))
      setCamEngineers(users.filter((u: any) => u.roles.includes('CAM')))
      setPcbEngineers(users.filter((u: any) => u.roles.includes('PCB')))
      setAsmEngineers(users.filter((u: any) => u.roles.includes('ASM')))
    } catch (err) { console.error('Error fetching engineers:', err) }
  }

  const fetchJobNotes = async (jobName: string) => {
    try {
      setLoadingNotes(true)
      const res = await fetch(`/api/admin/job-notes?jobName=${encodeURIComponent(jobName)}`)
      if (!res.ok) throw new Error('Failed to fetch job notes')
      const data = await res.json()
      const notes = data.notes || []
      setStatusNotes(notes)
      
      // Initialize from latest note
      if (notes.length > 0) {
        const latest = notes[0]
        setHdwEdit({
          text: latest.hdw_text || '',
          hasHold: latest.hdw_hold?.hasHold || false,
          owner: latest.hdw_hold?.owner || '',
          target: latest.hdw_hold?.target || '',
          action: latest.hdw_hold?.action || '',
          onHoldDate: latest.hdw_hold?.onHoldDate || '',
          daysOnHold: latest.hdw_hold?.daysOnHold || 0,
          wasOnHold: latest.hdw_hold?.hasHold || false
        })
        setPcbEdit({
          text: latest.pcb_text || '',
          hasHold: latest.pcb_hold?.hasHold || false,
          owner: latest.pcb_hold?.owner || '',
          target: latest.pcb_hold?.target || '',
          action: latest.pcb_hold?.action || '',
          onHoldDate: latest.pcb_hold?.onHoldDate || '',
          daysOnHold: latest.pcb_hold?.daysOnHold || 0,
          wasOnHold: latest.pcb_hold?.hasHold || false
        })
        setAsmEdit({
          text: latest.asm_text || '',
          hasHold: latest.asm_hold?.hasHold || false,
          owner: latest.asm_hold?.owner || '',
          target: latest.asm_hold?.target || '',
          action: latest.asm_hold?.action || '',
          onHoldDate: latest.asm_hold?.onHoldDate || '',
          daysOnHold: latest.asm_hold?.daysOnHold || 0,
          wasOnHold: latest.asm_hold?.hasHold || false
        })
        setScheduleEdit({
          hdw_date: latest.hdw_date || '',
          hdw_complete: false, // Will be parsed from notes if [HDW: complete]
          bom_date: latest.bom_date || '',
          bom_complete: false,
          cam_date: latest.cam_date || '',
          cam_complete: latest.cam_complete || false,
          rev_date: latest.rev_date || '',
          rev_complete: latest.rev_complete || false,
          prl_date: latest.prl_date || '',
          prl_complete: false,
          arl_date: latest.arl_date || '',
          arl_complete: false
        })
      }
    } catch (err) {
      console.error('Error fetching job notes:', err)
      setStatusNotes([])
    } finally {
      setLoadingNotes(false)
    }
  }

  const handleRefresh = async () => { setRefreshing(true); await fetchCurrentJobs(); setRefreshing(false) }

  // Calculate business days between two dates
  const getBusinessDaysDiff = (date1: string | null, date2: string | null): number | null => {
    if (!date1 || !date2) return null
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    let count = 0
    const current = new Date(d1)
    while (current <= d2) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++
      current.setDate(current.getDate() + 1)
    }
    return d2 < d1 ? -count : count
  }

  // Determine schedule status color
  const getScheduleStatus = (baseline: JobStatusNote | null, latest: JobStatusNote | null, isOnHold: boolean): 'red' | 'yellow' | 'green' | 'neutral' => {
    if (isOnHold) return 'red'
    if (!baseline || !latest) return 'neutral'
    
    // Check key dates against baseline
    const dates = [
      { base: baseline.hdw_date, current: latest.hdw_date },
      { base: baseline.bom_date, current: latest.bom_date },
      { base: baseline.prl_date, current: latest.prl_date },
      { base: baseline.arl_date, current: latest.arl_date }
    ]
    
    let maxDelay = 0
    for (const d of dates) {
      const diff = getBusinessDaysDiff(d.base, d.current)
      if (diff !== null && diff > maxDelay) maxDelay = diff
    }
    
    if (maxDelay > 5) return 'yellow'
    return 'green'
  }

  // Handle hold toggle - track on hold date and days
  const handleHoldToggle = (
    edit: SectionEdit, 
    setEdit: (e: SectionEdit) => void, 
    newHoldState: boolean
  ) => {
    const today = new Date().toISOString().split('T')[0]
    
    if (newHoldState && !edit.wasOnHold) {
      // Going ON hold - set on hold date
      setEdit({ ...edit, hasHold: true, onHoldDate: today, wasOnHold: true })
    } else if (!newHoldState && edit.wasOnHold && edit.onHoldDate) {
      // Coming OFF hold - calculate days on hold
      const holdStart = new Date(edit.onHoldDate)
      const holdEnd = new Date()
      const diffTime = Math.abs(holdEnd.getTime() - holdStart.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const newDaysOnHold = edit.daysOnHold + diffDays
      setEdit({ ...edit, hasHold: false, daysOnHold: newDaysOnHold, wasOnHold: false, onHoldDate: '' })
    } else {
      setEdit({ ...edit, hasHold: newHoldState })
    }
  }

  const stats = {
    total: currentJobs.length,
    active: currentJobs.filter(j => j.Status === 'Active').length,
    onHold: currentJobs.filter(j => j.Status === 'On Hold').length,
    byType: currentJobs.reduce((acc, job) => { const type = job.job_type || 'Unknown'; acc[type] = (acc[type] || 0) + 1; return acc }, {} as Record<string, number>)
  }

  const chartData = Object.entries(stats.byType).map(([name, count]) => ({ name, count }))
  const handleSort = (key: keyof CurrentJob) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))

  const filteredJobs = currentJobs
    .filter(job => {
      if (statusFilter === 'active' && job.Status !== 'Active') return false
      if (statusFilter === 'onhold' && job.Status !== 'On Hold') return false
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        return job.name?.toLowerCase().includes(search) || job.customer?.toLowerCase().includes(search) ||
          job.shop_pn?.toLowerCase().includes(search) || job.cust_pn?.toLowerCase().includes(search) ||
          job['PCB Eng']?.toLowerCase().includes(search) || job['ASM Eng']?.toLowerCase().includes(search) ||
          job.account_mngr?.toLowerCase().includes(search) || job.program?.toLowerCase().includes(search)
      }
      return true
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0
      const aVal = a[sortConfig.key], bVal = b[sortConfig.key]
      if (aVal === null && bVal === null) return 0
      if (aVal === null) return 1
      if (bVal === null) return -1
      let cmp = typeof aVal === 'string' && typeof bVal === 'string' ? aVal.localeCompare(bVal) :
        typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal))
      return sortConfig.direction === 'asc' ? cmp : -cmp
    })

  const resetEditState = () => {
    setHdwEdit({ text: '', hasHold: false, owner: '', target: '', action: '', onHoldDate: '', daysOnHold: 0, wasOnHold: false })
    setPcbEdit({ text: '', hasHold: false, owner: '', target: '', action: '', onHoldDate: '', daysOnHold: 0, wasOnHold: false })
    setAsmEdit({ text: '', hasHold: false, owner: '', target: '', action: '', onHoldDate: '', daysOnHold: 0, wasOnHold: false })
    setScheduleEdit({ 
      hdw_date: '', hdw_complete: false,
      bom_date: '', bom_complete: false,
      cam_date: '', cam_complete: false, 
      rev_date: '', rev_complete: false, 
      prl_date: '', prl_complete: false,
      arl_date: '', arl_complete: false
    })
    setEditingBaseline(false)
  }

  const openJobModal = (job: CurrentJob) => {
    setSelectedJob(job)
    setEditingJob({ ...job })
    setStatusNotes([])
    resetEditState()
    setModalOpen(true)
    if (job.name) fetchJobNotes(job.name)
  }

  const closeModal = () => { 
    setModalOpen(false)
    setSelectedJob(null)
    setEditingJob({})
    setStatusNotes([])
    resetEditState()
  }

  // Navigate to previous/next job in the filtered list
  const navigateJob = (direction: 'prev' | 'next') => {
    if (!selectedJob) return
    const currentIndex = filteredJobs.findIndex(j => j.id === selectedJob.id)
    if (currentIndex === -1) return
    
    let newIndex: number
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredJobs.length - 1
    } else {
      newIndex = currentIndex < filteredJobs.length - 1 ? currentIndex + 1 : 0
    }
    
    const newJob = filteredJobs[newIndex]
    if (newJob) {
      setSelectedJob(newJob)
      setEditingJob({ ...newJob })
      setStatusNotes([])
      resetEditState()
      if (newJob.name) fetchJobNotes(newJob.name)
    }
  }

  const saveJobChanges = async () => {
    setSavingJob(true)
    try {
      // Build notes string with hold info and CAM/REV dates
      const buildSectionNotes = (tag: string, edit: SectionEdit) => {
        let section = `[${tag}] ${edit.text}`
        if (edit.hasHold && edit.owner && edit.target && edit.action) {
          const targetDate = new Date(edit.target)
          const targetStr = `${targetDate.getMonth() + 1}/${targetDate.getDate()}/${targetDate.getFullYear()}`
          section += ` [Owner: ${edit.owner}; Target: ${targetStr}; Action: ${edit.action}]`
        }
        if (edit.onHoldDate) {
          const holdDate = new Date(edit.onHoldDate)
          section += ` [On Hold: ${holdDate.getMonth() + 1}/${holdDate.getDate()}/${holdDate.getFullYear()}]`
        }
        if (edit.daysOnHold > 0) {
          section += ` [Days On Hold: ${edit.daysOnHold}]`
        }
        return section
      }

      // Format CAM/REV for notes - either date or "Complete"
      const formatCamRevNote = (tag: string, date: string, complete: boolean) => {
        if (complete) return `[${tag}: Complete]`
        if (date) {
          const d = new Date(date)
          return `[${tag}: ${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}]`
        }
        return ''
      }

      const notes = [
        buildSectionNotes('HDW', hdwEdit),
        buildSectionNotes('PCB', pcbEdit),
        formatCamRevNote('CAM', scheduleEdit.cam_date, scheduleEdit.cam_complete),
        formatCamRevNote('Rev', scheduleEdit.rev_date, scheduleEdit.rev_complete),
        buildSectionNotes('ASM', asmEdit)
      ].filter(Boolean).join('\n')

      // Build schedule data for API
      const scheduleData = {
        hdw_date: scheduleEdit.hdw_complete ? null : scheduleEdit.hdw_date,
        hdw_complete: scheduleEdit.hdw_complete,
        bom_date: scheduleEdit.bom_complete ? null : scheduleEdit.bom_date,
        bom_complete: scheduleEdit.bom_complete,
        prl_date: scheduleEdit.prl_complete ? null : scheduleEdit.prl_date,
        prl_complete: scheduleEdit.prl_complete,
        arl_date: scheduleEdit.arl_complete ? null : scheduleEdit.arl_date,
        arl_complete: scheduleEdit.arl_complete
      }

      // Save to database - create new record
      const res = await fetch('/api/admin/job-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobName: selectedJob?.name,
          notes,
          hdw_date: scheduleData.hdw_complete ? null : scheduleEdit.hdw_date,
          bom_date: scheduleData.bom_complete ? null : scheduleEdit.bom_date,
          prl_date: scheduleData.prl_complete ? null : scheduleEdit.prl_date,
          arl_date: scheduleData.arl_complete ? null : scheduleEdit.arl_date
        })
      })

      // Check content type before parsing
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server error (${res.status}): Expected JSON response but got ${contentType || 'unknown'}. Check if the API endpoint exists.`)
      }

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      // Update local state
      setCurrentJobs(prev => prev.map(job => job.id === selectedJob?.id ? { ...job, ...editingJob } : job))
      closeModal()
    } catch (err) { 
      console.error('Error saving job:', err)
      alert(err instanceof Error ? err.message : 'Failed to save changes')
    }
    finally { setSavingJob(false) }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch { return dateStr }
  }

  const SortIcon = ({ column }: { column: keyof CurrentJob }) => {
    if (sortConfig.key === column) return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
    return <ArrowUpDown size={14} className="text-slate-400" />
  }

  // Get baseline (oldest) and latest (newest) records
  const baseline = statusNotes.length > 0 ? statusNotes[statusNotes.length - 1] : null
  const latest = statusNotes.length > 0 ? statusNotes[0] : null
  const isOnHold = selectedJob?.Status === 'On Hold'
  const scheduleStatus = getScheduleStatus(baseline, latest, isOnHold)

  // Section Edit Component
  const SectionEditCard = ({ 
    title, icon, edit, setEdit, color
  }: { 
    title: string; icon: React.ReactNode; edit: SectionEdit
    setEdit: (e: SectionEdit) => void; color: string
  }) => (
    <div className={`border rounded-lg p-4 ${edit.hasHold ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className={`font-semibold flex items-center gap-2 ${color}`}>{icon}{title}</h4>
        <label className="flex items-center gap-2 text-sm">
          <input 
            type="checkbox" 
            checked={edit.hasHold} 
            onChange={(e) => handleHoldToggle(edit, setEdit, e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
          />
          <span className={edit.hasHold ? 'text-amber-700 font-medium' : 'text-slate-600'}>
            <AlertTriangle size={14} className="inline mr-1" />Hold
          </span>
        </label>
      </div>
      
      {edit.daysOnHold > 0 && (
        <div className="mb-2 text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
          Total days on hold: {edit.daysOnHold}
        </div>
      )}
      
      <div className="mb-3">
        <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
        <textarea 
          value={edit.text}
          onChange={(e) => setEdit({ ...edit, text: e.target.value })}
          placeholder={`${title} notes...`}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 h-16 resize-none"
        />
      </div>
      
      {edit.hasHold && (
        <div className="bg-amber-100 rounded-lg p-3 space-y-2 border border-amber-200">
          <div className="text-xs font-semibold text-amber-800 flex items-center gap-1">
            <AlertTriangle size={12} />Hold Information
            {edit.onHoldDate && <span className="ml-2 font-normal">(Since: {formatDate(edit.onHoldDate)})</span>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-amber-700 mb-1">Owner</label>
              <input type="text" value={edit.owner} onChange={(e) => setEdit({ ...edit, owner: e.target.value })}
                placeholder="Person responsible" className="w-full px-2 py-1 border border-amber-300 rounded text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-amber-700 mb-1">Target Date</label>
              <input type="date" value={edit.target} onChange={(e) => setEdit({ ...edit, target: e.target.value })}
                className="w-full px-2 py-1 border border-amber-300 rounded text-sm bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-amber-700 mb-1">Action Required</label>
            <input type="text" value={edit.action} onChange={(e) => setEdit({ ...edit, action: e.target.value })}
              placeholder="What needs to be done" className="w-full px-2 py-1 border border-amber-300 rounded text-sm bg-white" />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Manage Backlog</h1>
            <p className="text-sm text-slate-600">View, edit, and manage current jobs and backlog</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"><Plus size={16} />Add Job</button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-semibold">Error loading data</p><p className="text-sm">{error}</p>
          <button onClick={fetchCurrentJobs} className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Retry</button>
        </div>
      ) : loading ? (
        <div className="text-center py-12"><RefreshCw className="animate-spin mx-auto mb-4" size={32} /><p className="text-slate-600">Loading...</p></div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Jobs by Type</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#10b981" /></BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <button onClick={() => setStatusFilter('all')} className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 transition-all text-left ${statusFilter === 'all' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-blue-200 hover:border-blue-300'}`}>
              <div className="flex items-center justify-between"><div><p className="text-sm text-blue-700 font-medium">Total Jobs</p><p className="text-3xl font-bold text-blue-900 mt-1">{stats.total}</p></div><BarChart3 className="text-blue-600" size={32} /></div>
              {statusFilter === 'all' && <p className="text-xs text-blue-600 mt-2">✓ Showing all</p>}
            </button>
            <button onClick={() => setStatusFilter('active')} className={`bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 transition-all text-left ${statusFilter === 'active' ? 'border-green-500 ring-2 ring-green-200' : 'border-green-200 hover:border-green-300'}`}>
              <div className="flex items-center justify-between"><div><p className="text-sm text-green-700 font-medium">Active</p><p className="text-3xl font-bold text-green-900 mt-1">{stats.active}</p></div><PlayCircle className="text-green-600" size={32} /></div>
              {statusFilter === 'active' && <p className="text-xs text-green-600 mt-2">✓ Filtered</p>}
            </button>
            <button onClick={() => setStatusFilter('onhold')} className={`bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border-2 transition-all text-left ${statusFilter === 'onhold' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-amber-200 hover:border-amber-300'}`}>
              <div className="flex items-center justify-between"><div><p className="text-sm text-amber-700 font-medium">On Hold</p><p className="text-3xl font-bold text-amber-900 mt-1">{stats.onHold}</p></div><PauseCircle className="text-amber-600" size={32} /></div>
              {statusFilter === 'onhold' && <p className="text-xs text-amber-600 mt-2">✓ Filtered</p>}
            </button>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-200">
              <div className="flex items-center justify-between"><div><p className="text-sm text-purple-700 font-medium">Job Types</p><p className="text-3xl font-bold text-purple-900 mt-1">{Object.keys(stats.byType).length}</p></div><TrendingUp className="text-purple-600" size={32} /></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-slate-800">{statusFilter === 'all' ? 'All Jobs' : statusFilter === 'active' ? 'Active Jobs' : 'On Hold Jobs'}</h3>
                  {statusFilter !== 'all' && <button onClick={() => setStatusFilter('all')} className="text-sm text-blue-600 hover:underline">Clear filter</button>}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Search jobs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-64" />
                  {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto"><div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('Status')}><div className="flex items-center gap-1">Status<SortIcon column="Status" /></div></th>
                    <th className="text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('release_status')}><div className="flex items-center gap-1">Release<SortIcon column="release_status" /></div></th>
                    <th className="text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('program')}><div className="flex items-center gap-1">Program<SortIcon column="program" /></div></th>
                    <th className="text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('name')}><div className="flex items-center gap-1">Job Name<SortIcon column="name" /></div></th>
                    <th className="text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('customer')}><div className="flex items-center gap-1">Customer<SortIcon column="customer" /></div></th>
                    <th className="text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('job_type')}><div className="flex items-center gap-1">Type<SortIcon column="job_type" /></div></th>
                    <th className="text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('shop_pn')}><div className="flex items-center gap-1">Shop PN<SortIcon column="shop_pn" /></div></th>
                    <th className="text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('PCB Eng')}><div className="flex items-center gap-1">PCB<SortIcon column="PCB Eng" /></div></th>
                    <th className="text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('ASM Eng')}><div className="flex items-center gap-1">ASM<SortIcon column="ASM Eng" /></div></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="border-t border-slate-200 hover:bg-blue-50 cursor-pointer" onClick={() => openJobModal(job)}>
                      <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${job.Status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{job.Status}</span></td>
                      <td className="px-3 py-2">{job.release_status ? <span className={`px-2 py-0.5 rounded text-xs ${job.release_status === 'Released' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{job.release_status}</span> : '-'}</td>
                      <td className="px-3 py-2">{job.program ? <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{job.program}</span> : '-'}</td>
                      <td className="px-3 py-2 font-medium">{job.name}</td>
                      <td className="px-3 py-2">{job.customer || '-'}</td>
                      <td className="px-3 py-2"><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{job.job_type || '-'}</span></td>
                      <td className="px-3 py-2 font-mono text-xs">{job.shop_pn || '-'}</td>
                      <td className="px-3 py-2 text-xs">{job['PCB Eng'] || '-'}</td>
                      <td className="px-3 py-2 text-xs">{job['ASM Eng'] || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></div>
            <div className="p-3 border-t border-slate-200 bg-slate-50 text-sm text-slate-600">
              Showing {filteredJobs.length} of {currentJobs.length} jobs • Click row to edit
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                {/* Job navigation arrows */}
                <div className="flex flex-col">
                  <button 
                    onClick={() => navigateJob('prev')} 
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                    title="Previous job"
                  >
                    <ChevronUp size={18} />
                  </button>
                  <button 
                    onClick={() => navigateJob('next')} 
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                    title="Next job"
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedJob.name}</h2>
                  <p className="text-sm text-slate-600">{selectedJob.customer} • {selectedJob.job_type} • {selectedJob.shop_pn}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={saveJobChanges} disabled={savingJob} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"><Save size={16} />{savingJob ? 'Saving...' : 'Save Changes'}</button>
                <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-lg"><X size={20} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Job Info Row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2"><FileText size={18} />Job Info</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs text-slate-500 mb-1">Status</label>
                      <select value={editingJob.Status || ''} onChange={(e) => setEditingJob(p => ({ ...p, Status: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm">
                        <option value="Active">Active</option><option value="On Hold">On Hold</option>
                      </select>
                    </div>
                    <div><label className="block text-xs text-slate-500 mb-1">Type</label>
                      <input type="text" value={editingJob.job_type || ''} onChange={(e) => setEditingJob(p => ({ ...p, job_type: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm" />
                    </div>
                  </div>
                  <div><label className="block text-xs text-slate-500 mb-1">Customer</label>
                    <input type="text" value={editingJob.customer || ''} onChange={(e) => setEditingJob(p => ({ ...p, customer: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs text-slate-500 mb-1">Shop PN</label>
                      <input type="text" value={editingJob.shop_pn || ''} onChange={(e) => setEditingJob(p => ({ ...p, shop_pn: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm font-mono" />
                    </div>
                    <div><label className="block text-xs text-slate-500 mb-1">Cust PN</label>
                      <input type="text" value={editingJob.cust_pn || ''} onChange={(e) => setEditingJob(p => ({ ...p, cust_pn: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm font-mono" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2"><User size={18} />Assignments</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs text-slate-500 mb-1">HDW Eng</label>
                      <select value={editingJob['HDW Eng'] || ''} onChange={(e) => setEditingJob(p => ({ ...p, 'HDW Eng': e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm">
                        <option value="">-- Select --</option>
                        <option value="Not Applicable">Not Applicable</option>
                        {hdwEngineers.map(eng => (
                          <option key={eng.userId} value={eng.ccName || eng.name || eng.username}>
                            {eng.ccName || eng.name || eng.username}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div><label className="block text-xs text-slate-500 mb-1">PCB Eng</label>
                      <select value={editingJob['PCB Eng'] || ''} onChange={(e) => setEditingJob(p => ({ ...p, 'PCB Eng': e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm">
                        <option value="">-- Select --</option>
                        <option value="Not Applicable">Not Applicable</option>
                        {pcbEngineers.map(eng => (
                          <option key={eng.userId} value={eng.ccName || eng.name || eng.username}>
                            {eng.ccName || eng.name || eng.username}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs text-slate-500 mb-1">ASM Eng</label>
                      <select value={editingJob['ASM Eng'] || ''} onChange={(e) => setEditingJob(p => ({ ...p, 'ASM Eng': e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm">
                        <option value="">-- Select --</option>
                        <option value="Not Applicable">Not Applicable</option>
                        {asmEngineers.map(eng => (
                          <option key={eng.userId} value={eng.ccName || eng.name || eng.username}>
                            {eng.ccName || eng.name || eng.username}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div><label className="block text-xs text-slate-500 mb-1">CAM Eng</label>
                      <select value={editingJob['CAM Eng'] || ''} onChange={(e) => setEditingJob(p => ({ ...p, 'CAM Eng': e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm">
                        <option value="">-- Select --</option>
                        <option value="Not Applicable">Not Applicable</option>
                        {camEngineers.map(eng => (
                          <option key={eng.userId} value={eng.ccName || eng.name || eng.username}>
                            {eng.ccName || eng.name || eng.username}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div><label className="block text-xs text-slate-500 mb-1">Acct Mgr</label>
                    <input type="text" value={editingJob.account_mngr || ''} onChange={(e) => setEditingJob(p => ({ ...p, account_mngr: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2"><BarChart3 size={18} />Paradigm (Read-only)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs text-slate-500 mb-1">Release</label>
                      <div className="px-2 py-1.5 bg-slate-100 rounded text-sm">{selectedJob.release_status || '-'}</div>
                    </div>
                    <div><label className="block text-xs text-slate-500 mb-1">Program</label>
                      <div className="px-2 py-1.5 bg-slate-100 rounded text-sm">{selectedJob.program || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Notes */}
              <div className="mb-6">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3"><FileText size={18} />Section Notes</h3>
                <div className="grid grid-cols-3 gap-4">
                  <SectionEditCard title="HDW" icon={<Clock size={14} />} edit={hdwEdit} setEdit={setHdwEdit} color="text-blue-700" />
                  <SectionEditCard title="PCB" icon={<BarChart3 size={14} />} edit={pcbEdit} setEdit={setPcbEdit} color="text-green-700" />
                  <SectionEditCard title="ASM" icon={<CheckCircle size={14} />} edit={asmEdit} setEdit={setAsmEdit} color="text-purple-700" />
                </div>
              </div>

              {/* Schedule Timeline */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Calendar size={18} />Schedule Timeline</h3>
                  {baseline && !editingBaseline && (
                    <button
                      onClick={() => setEditingBaseline(true)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                    >
                      <Edit3 size={14} />
                      Edit Baseline
                    </button>
                  )}
                  {editingBaseline && (
                    <button
                      onClick={() => setEditingBaseline(false)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <X size={14} />
                      Cancel Edit
                    </button>
                  )}
                </div>
                
                {loadingNotes ? (
                  <div className="text-center py-6"><RefreshCw className="animate-spin mx-auto" size={24} /></div>
                ) : (
                  <div className={`border rounded-lg overflow-hidden ${
                    scheduleStatus === 'red' ? 'border-red-300' :
                    scheduleStatus === 'yellow' ? 'border-amber-300' :
                    scheduleStatus === 'green' ? 'border-green-300' : 'border-slate-200'
                  }`}>
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-slate-700 w-20">Row</th>
                          <th className="text-left px-3 py-2 font-medium text-slate-700 w-28">Timestamp</th>
                          <th className="text-center px-2 py-2 font-medium text-slate-700">HDW</th>
                          <th className="text-center px-2 py-2 font-medium text-slate-700">BOM</th>
                          <th className="text-center px-2 py-2 font-medium text-slate-700">CAM</th>
                          <th className="text-center px-2 py-2 font-medium text-slate-700">REV</th>
                          <th className="text-center px-2 py-2 font-medium text-slate-700">PRL</th>
                          <th className="text-center px-2 py-2 font-medium text-slate-700">ARL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Baseline Row - Read-only normally, editable when editingBaseline is true */}
                        {baseline && !editingBaseline ? (
                          <tr className="border-t bg-slate-50">
                            <td className="px-3 py-2 font-medium text-slate-600">Baseline</td>
                            <td className="px-3 py-2 text-xs text-slate-500">{baseline.timestampFormatted}</td>
                            <td className="px-2 py-2 text-center text-xs">{formatDate(baseline.hdw_date)}</td>
                            <td className="px-2 py-2 text-center text-xs">{formatDate(baseline.bom_date)}</td>
                            <td className="px-2 py-2 text-center text-xs">{baseline.cam_complete ? <span className="text-green-600">✓</span> : formatDate(baseline.cam_date)}</td>
                            <td className="px-2 py-2 text-center text-xs">{baseline.rev_complete ? <span className="text-green-600">✓</span> : formatDate(baseline.rev_date)}</td>
                            <td className="px-2 py-2 text-center text-xs">{formatDate(baseline.prl_date)}</td>
                            <td className="px-2 py-2 text-center text-xs">{formatDate(baseline.arl_date)}</td>
                          </tr>
                        ) : (
                          /* No baseline OR editing baseline - show editable baseline row */
                          <tr className="border-t bg-amber-50">
                            <td className="px-3 py-2 font-medium text-amber-700">Baseline</td>
                            <td className="px-3 py-2 text-xs text-amber-600">{editingBaseline ? 'Editing' : 'New'}</td>
                            <td className="px-2 py-2">
                              <div className="flex flex-col items-center gap-1">
                                <input type="date" value={scheduleEdit.hdw_date} onChange={(e) => setScheduleEdit(p => ({ ...p, hdw_date: e.target.value }))} className="w-full px-1 py-0.5 border rounded text-xs" />
                                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={scheduleEdit.hdw_complete} onChange={(e) => setScheduleEdit(p => ({ ...p, hdw_complete: e.target.checked }))} className="w-3 h-3" />Done</label>
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex flex-col items-center gap-1">
                                <input type="date" value={scheduleEdit.bom_date} onChange={(e) => setScheduleEdit(p => ({ ...p, bom_date: e.target.value }))} className="w-full px-1 py-0.5 border rounded text-xs" />
                                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={scheduleEdit.bom_complete} onChange={(e) => setScheduleEdit(p => ({ ...p, bom_complete: e.target.checked }))} className="w-3 h-3" />Done</label>
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex flex-col items-center gap-1">
                                <input type="date" value={scheduleEdit.cam_date} onChange={(e) => setScheduleEdit(p => ({ ...p, cam_date: e.target.value }))} className="w-full px-1 py-0.5 border rounded text-xs" />
                                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={scheduleEdit.cam_complete} onChange={(e) => setScheduleEdit(p => ({ ...p, cam_complete: e.target.checked }))} className="w-3 h-3" />Done</label>
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex flex-col items-center gap-1">
                                <input type="date" value={scheduleEdit.rev_date} onChange={(e) => setScheduleEdit(p => ({ ...p, rev_date: e.target.value }))} className="w-full px-1 py-0.5 border rounded text-xs" />
                                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={scheduleEdit.rev_complete} onChange={(e) => setScheduleEdit(p => ({ ...p, rev_complete: e.target.checked }))} className="w-3 h-3" />Done</label>
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex flex-col items-center gap-1">
                                <input type="date" value={scheduleEdit.prl_date} onChange={(e) => setScheduleEdit(p => ({ ...p, prl_date: e.target.value }))} className="w-full px-1 py-0.5 border rounded text-xs" />
                                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={scheduleEdit.prl_complete} onChange={(e) => setScheduleEdit(p => ({ ...p, prl_complete: e.target.checked }))} className="w-3 h-3" />Done</label>
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex flex-col items-center gap-1">
                                <input type="date" value={scheduleEdit.arl_date} onChange={(e) => setScheduleEdit(p => ({ ...p, arl_date: e.target.value }))} className="w-full px-1 py-0.5 border rounded text-xs" />
                                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={scheduleEdit.arl_complete} onChange={(e) => setScheduleEdit(p => ({ ...p, arl_complete: e.target.checked }))} className="w-3 h-3" />Done</label>
                              </div>
                            </td>
                          </tr>
                        )}
                        {/* Latest Row - Editable, only show if baseline exists and not editing baseline */}
                        {baseline && !editingBaseline && (
                          <tr className={`border-t ${
                            scheduleStatus === 'red' ? 'bg-red-50' :
                            scheduleStatus === 'yellow' ? 'bg-amber-50' :
                            scheduleStatus === 'green' ? 'bg-green-50' : 'bg-blue-50'
                          }`}>
                            <td className="px-3 py-2 font-medium text-slate-700">Latest</td>
                            <td className="px-3 py-2 text-xs">{latest?.timestampFormatted || 'New'}</td>
                            <td className="px-2 py-2">
                              <div className="flex flex-col items-center gap-1">
                                {!scheduleEdit.hdw_complete && <input type="date" value={scheduleEdit.hdw_date} onChange={(e) => setScheduleEdit(p => ({ ...p, hdw_date: e.target.value }))} className="w-full px-1 py-0.5 border rounded text-xs" />}
                                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={scheduleEdit.hdw_complete} onChange={(e) => setScheduleEdit(p => ({ ...p, hdw_complete: e.target.checked }))} className="w-3 h-3" />Done</label>
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex flex-col items-center gap-1">
                                {!scheduleEdit.bom_complete && <input type="date" value={scheduleEdit.bom_date} onChange={(e) => setScheduleEdit(p => ({ ...p, bom_date: e.target.value }))} className="w-full px-1 py-0.5 border rounded text-xs" />}
                                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={scheduleEdit.bom_complete} onChange={(e) => setScheduleEdit(p => ({ ...p, bom_complete: e.target.checked }))} className="w-3 h-3" />Done</label>
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex flex-col items-center gap-1">
                                {!scheduleEdit.cam_complete && <input type="date" value={scheduleEdit.cam_date} onChange={(e) => setScheduleEdit(p => ({ ...p, cam_date: e.target.value }))} className="w-full px-1 py-0.5 border rounded text-xs" />}
                                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={scheduleEdit.cam_complete} onChange={(e) => setScheduleEdit(p => ({ ...p, cam_complete: e.target.checked }))} className="w-3 h-3" />Done</label>
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex flex-col items-center gap-1">
                                {!scheduleEdit.rev_complete && <input type="date" value={scheduleEdit.rev_date} onChange={(e) => setScheduleEdit(p => ({ ...p, rev_date: e.target.value }))} className="w-full px-1 py-0.5 border rounded text-xs" />}
                                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={scheduleEdit.rev_complete} onChange={(e) => setScheduleEdit(p => ({ ...p, rev_complete: e.target.checked }))} className="w-3 h-3" />Done</label>
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex flex-col items-center gap-1">
                                {!scheduleEdit.prl_complete && <input type="date" value={scheduleEdit.prl_date} onChange={(e) => setScheduleEdit(p => ({ ...p, prl_date: e.target.value }))} className="w-full px-1 py-0.5 border rounded text-xs" />}
                                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={scheduleEdit.prl_complete} onChange={(e) => setScheduleEdit(p => ({ ...p, prl_complete: e.target.checked }))} className="w-3 h-3" />Done</label>
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex flex-col items-center gap-1">
                                {!scheduleEdit.arl_complete && <input type="date" value={scheduleEdit.arl_date} onChange={(e) => setScheduleEdit(p => ({ ...p, arl_date: e.target.value }))} className="w-full px-1 py-0.5 border rounded text-xs" />}
                                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={scheduleEdit.arl_complete} onChange={(e) => setScheduleEdit(p => ({ ...p, arl_complete: e.target.checked }))} className="w-3 h-3" />Done</label>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    <div className={`p-2 text-xs ${
                      scheduleStatus === 'red' ? 'bg-red-100 text-red-700' :
                      scheduleStatus === 'yellow' ? 'bg-amber-100 text-amber-700' :
                      scheduleStatus === 'green' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {scheduleStatus === 'red' && '⚠️ Job is ON HOLD'}
                      {scheduleStatus === 'yellow' && '⚠️ Behind schedule (>5 business days from baseline)'}
                      {scheduleStatus === 'green' && '✓ On schedule (within 5 business days of baseline)'}
                      {scheduleStatus === 'neutral' && (statusNotes.length === 0 ? 'Enter baseline dates to establish schedule' : 'Schedule status unavailable')}
                      <span className="ml-4 text-slate-500">• {statusNotes.length} total record{statusNotes.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
