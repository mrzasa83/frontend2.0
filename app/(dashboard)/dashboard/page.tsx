'use client'


import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ChevronDown, ChevronUp, BarChart3, TrendingUp, Clock, CheckCircle, AlertCircle, PlayCircle, PauseCircle, User, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getApiUrl } from '@/lib/api'

type BacklogItem = {
  id: number
  name: string
  job_type: string
  routeType: string
  cust_pn: string | null
  rev: string | null
  build_spec_pdigm: string | null
  proc_id: number
  group_id: number
  status_id: number
  startTime: string
  endTime: string | null
}

type CurrentJob = {
  Status: string
  name: string
  customer: string | null
  job_type: string | null
  shop_pn: string | null
  cust_pn: string | null
  'PCB Eng': string | null
  'ASM Eng': string | null
  'CAM Eng': string | null
  account_mngr: string | null
  route: number | null
  hdw_date: string | null
  bom_date: string | null
  pcb_date: string | null
  asm_date: string | null
  // From MSSQL Paradigm
  release_status?: string | null
  program?: string | null
}

// Placeholder type for My Backlog items - will be refined when API is connected
type MyBacklogItem = CurrentJob

export default function DashboardPage() {
  const { data: session } = useSession()
  const [teamBacklog, setTeamBacklog] = useState<BacklogItem[]>([])
  const [currentJobs, setCurrentJobs] = useState<CurrentJob[]>([])
  const [myBacklogItems, setMyBacklogItems] = useState<MyBacklogItem[]>([])
  const [loadingHistorical, setLoadingHistorical] = useState(true)
  const [loadingCurrent, setLoadingCurrent] = useState(true)
  const [loadingMyBacklog, setLoadingMyBacklog] = useState(true)
  const [historicalError, setHistoricalError] = useState<string | null>(null)
  const [currentError, setCurrentError] = useState<string | null>(null)
  const [myBacklogError, setMyBacklogError] = useState<string | null>(null)
  const [currentOpen, setCurrentOpen] = useState(true)
  const [historicalOpen, setHistoricalOpen] = useState(false)
  // My Backlog open state will be set after loading based on whether user has assignments
  const [myBacklogOpen, setMyBacklogOpen] = useState(false)
  // Filter for current jobs: 'all', 'active', or 'onhold'
  const [currentJobsFilter, setCurrentJobsFilter] = useState<'all' | 'active' | 'onhold'>('all')
  // Sort state for current jobs table
  const [currentJobsSort, setCurrentJobsSort] = useState<{
    key: keyof CurrentJob | null
    direction: 'asc' | 'desc'
  }>({ key: 'name', direction: 'asc' })

  useEffect(() => {
    fetchTeamBacklog()
    fetchCurrentJobs()
    fetchMyBacklog()
  }, [])

  // Update myBacklogOpen when myBacklogItems changes
  useEffect(() => {
    // Only open My Backlog if user has assignments
    if (!loadingMyBacklog) {
      setMyBacklogOpen(myBacklogItems.length > 0)
    }
  }, [myBacklogItems, loadingMyBacklog])

  const fetchMyBacklog = async () => {
    try {
      setLoadingMyBacklog(true)
      setMyBacklogError(null)

      // TODO: Replace with actual API call when ready
      // For now, this is a placeholder that returns empty array
      // The API will filter current-jobs by username matching PCB Eng, ASM Eng, or CAM Eng
      
      // Simulating API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Placeholder: empty array means no assignments, accordion stays closed
      setMyBacklogItems([])
      
    } catch (err) {
      console.error('Error fetching my backlog:', err)
      setMyBacklogError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoadingMyBacklog(false)
    }
  }

  const fetchCurrentJobs = async () => {
    try {
      setLoadingCurrent(true)
      setCurrentError(null)

      const res = await fetch(getApiUrl('/api/dashboard/current-jobs'))
      if (!res.ok) {
        throw new Error('Failed to fetch current jobs')
      }

      const data = await res.json()
      const jobs = data.results || []
      setCurrentJobs(jobs)
      
      // Fetch release status and program from MSSQL
      await fetchJobStatuses(jobs)
    } catch (err) {
      console.error('Error fetching current jobs:', err)
      setCurrentError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoadingCurrent(false)
    }
  }

  const fetchJobStatuses = async (jobs: CurrentJob[]) => {
    try {
      const shopPNs = jobs.map(j => j.shop_pn).filter(pn => pn && pn.trim() !== '')
      if (shopPNs.length === 0) return

      const res = await fetch(getApiUrl('/api/admin/job-status'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopPNs })
      })

      if (!res.ok) return

      const data = await res.json()
      if (data.success && data.data) {
        setCurrentJobs(prev => prev.map(job => {
          if (!job.shop_pn) return job
          const statusData = data.data[job.shop_pn]
          return statusData 
            ? { ...job, release_status: statusData.releaseStatus, program: statusData.program } 
            : job
        }))
      }
    } catch (err) {
      console.error('Error fetching job statuses from MSSQL:', err)
    }
  }

  const fetchTeamBacklog = async () => {
    try {
      setLoadingHistorical(true)
      setHistoricalError(null)

      const res = await fetch(getApiUrl('/api/dashboard/team-backlog'))
      if (!res.ok) {
        throw new Error('Failed to fetch team backlog')
      }

      const data = await res.json()
      setTeamBacklog(data.results || [])
    } catch (err) {
      console.error('Error fetching team backlog:', err)
      setHistoricalError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoadingHistorical(false)
    }
  }

  // Current jobs statistics
  const currentStats = {
    total: currentJobs.length,
    active: currentJobs.filter(j => j.Status === 'Active').length,
    onHold: currentJobs.filter(j => j.Status === 'On Hold').length,
    byType: currentJobs.reduce((acc, job) => {
      const type = job.job_type || 'Unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  // Handle sort for current jobs table
  const handleCurrentJobsSort = (key: keyof CurrentJob) => {
    setCurrentJobsSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Filtered and sorted current jobs
  const filteredCurrentJobs = currentJobs
    .filter(job => {
      if (currentJobsFilter === 'all') return true
      if (currentJobsFilter === 'active') return job.Status === 'Active'
      if (currentJobsFilter === 'onhold') return job.Status === 'On Hold'
      return true
    })
    .sort((a, b) => {
      if (!currentJobsSort.key) return 0
      
      const aVal = a[currentJobsSort.key]
      const bVal = b[currentJobsSort.key]
      
      // Handle null values - push them to the end
      if (aVal === null && bVal === null) return 0
      if (aVal === null) return 1
      if (bVal === null) return -1
      
      // Compare values
      let comparison = 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal)
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }
      
      return currentJobsSort.direction === 'asc' ? comparison : -comparison
    })

  // Historical statistics
  const historicalStats = {
    total: teamBacklog.length,
    byType: teamBacklog.reduce((acc, item) => {
      acc[item.job_type] = (acc[item.job_type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byYear: teamBacklog.reduce((acc, item) => {
      const year = new Date(item.startTime).getFullYear()
      acc[year] = (acc[year] || 0) + 1
      return acc
    }, {} as Record<number, number>),
    byRoute: teamBacklog.reduce((acc, item) => {
      acc[item.routeType] = (acc[item.routeType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  // My backlog statistics
  const myBacklogStats = {
    total: myBacklogItems.length,
    active: myBacklogItems.filter(j => j.Status === 'Active').length,
    onHold: myBacklogItems.filter(j => j.Status === 'On Hold').length
  }

  // Prepare chart data
  const typeChartData = Object.entries(historicalStats.byType).map(([name, value]) => ({
    name,
    count: value
  }))

  const yearChartData = Object.entries(historicalStats.byYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, count]) => ({
      year,
      count
    }))

  const routeChartData = Object.entries(historicalStats.byRoute).map(([name, value]) => ({
    name,
    count: value
  }))

  const currentTypeChartData = Object.entries(currentStats.byType).map(([name, value]) => ({
    name,
    count: value
  }))

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

  if (loadingHistorical && loadingCurrent && loadingMyBacklog) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Welcome back, {session?.user?.name || session?.user?.email}
        </p>
      </div>

      {/* My Backlog Accordion - Now at the top */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => setMyBacklogOpen(!myBacklogOpen)}
          className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <User className="text-indigo-600" size={24} />
            <div className="text-left">
              <h2 className="text-xl font-bold text-slate-800">My Backlog</h2>
              <p className="text-sm text-slate-600">
                {loadingMyBacklog 
                  ? 'Loading...' 
                  : myBacklogItems.length > 0 
                    ? `${myBacklogItems.length} job${myBacklogItems.length !== 1 ? 's' : ''} assigned to you`
                    : 'No current assignments'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!loadingMyBacklog && myBacklogItems.length > 0 && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                {myBacklogItems.length}
              </span>
            )}
            {myBacklogOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        </button>

        {myBacklogOpen && (
          <div className="p-6 border-t border-slate-200">
            {myBacklogError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                <p className="font-semibold">Error loading my backlog</p>
                <p className="text-sm">{myBacklogError}</p>
                <button 
                  onClick={fetchMyBacklog}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            ) : loadingMyBacklog ? (
              <div className="text-center py-8">Loading...</div>
            ) : myBacklogItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <User size={48} className="mx-auto mb-4 opacity-50" />
                <p>No jobs currently assigned to you</p>
                <p className="text-sm mt-2">Jobs where you are listed as PCB Eng, ASM Eng, or CAM Eng will appear here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-indigo-700 font-medium">My Jobs</p>
                        <p className="text-3xl font-bold text-indigo-900 mt-1">{myBacklogStats.total}</p>
                      </div>
                      <User className="text-indigo-600" size={32} />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 font-medium">Active</p>
                        <p className="text-3xl font-bold text-green-900 mt-1">{myBacklogStats.active}</p>
                      </div>
                      <PlayCircle className="text-green-600" size={32} />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-amber-700 font-medium">On Hold</p>
                        <p className="text-3xl font-bold text-amber-900 mt-1">{myBacklogStats.onHold}</p>
                      </div>
                      <PauseCircle className="text-amber-600" size={32} />
                    </div>
                  </div>
                </div>

                {/* Data Table */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">My Assigned Jobs</h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Status</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Job Name</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Customer</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Type</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Shop PN</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Role</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">HDW Date</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">BOM Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myBacklogItems.map((job, idx) => {
                            // Determine user's role on this job
                            const username = session?.user?.name || session?.user?.email || ''
                            let role = ''
                            if (job['PCB Eng'] === username) role = 'PCB Eng'
                            else if (job['ASM Eng'] === username) role = 'ASM Eng'
                            else if (job['CAM Eng'] === username) role = 'CAM Eng'

                            return (
                              <tr key={idx} className="border-t border-slate-200 hover:bg-slate-50">
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    job.Status === 'Active' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {job.Status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-medium">{job.name}</td>
                                <td className="px-4 py-3">{job.customer || '-'}</td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                    {job.job_type || '-'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">{job.shop_pn || '-'}</td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                                    {role || '-'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {job.hdw_date ? new Date(job.hdw_date).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-4 py-3">
                                  {job.bom_date ? new Date(job.bom_date).toLocaleDateString() : '-'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Jobs Accordion */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => setCurrentOpen(!currentOpen)}
          className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <PlayCircle className="text-green-600" size={24} />
            <div className="text-left">
              <h2 className="text-xl font-bold text-slate-800">Current Jobs</h2>
              <p className="text-sm text-slate-600">Active and on-hold jobs</p>
            </div>
          </div>
          {currentOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>

        {currentOpen && (
          <div className="p-6 border-t border-slate-200">
            {currentError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                <p className="font-semibold">Error loading current jobs</p>
                <p className="text-sm">{currentError}</p>
                <button 
                  onClick={fetchCurrentJobs}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            ) : loadingCurrent ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-6">
                {/* Chart */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Jobs by Type</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={currentTypeChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Quick Stats - Clickable for filtering */}
                <div className="grid grid-cols-4 gap-4">
                  <button
                    onClick={() => setCurrentJobsFilter('all')}
                    className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 transition-all text-left ${
                      currentJobsFilter === 'all' 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-blue-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 font-medium">Total Jobs</p>
                        <p className="text-3xl font-bold text-blue-900 mt-1">{currentStats.total}</p>
                      </div>
                      <BarChart3 className="text-blue-600" size={32} />
                    </div>
                    {currentJobsFilter === 'all' && (
                      <p className="text-xs text-blue-600 mt-2">✓ Showing all</p>
                    )}
                  </button>

                  <button
                    onClick={() => setCurrentJobsFilter('active')}
                    className={`bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 transition-all text-left ${
                      currentJobsFilter === 'active' 
                        ? 'border-green-500 ring-2 ring-green-200' 
                        : 'border-green-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 font-medium">Active</p>
                        <p className="text-3xl font-bold text-green-900 mt-1">{currentStats.active}</p>
                      </div>
                      <PlayCircle className="text-green-600" size={32} />
                    </div>
                    {currentJobsFilter === 'active' && (
                      <p className="text-xs text-green-600 mt-2">✓ Filtered</p>
                    )}
                  </button>

                  <button
                    onClick={() => setCurrentJobsFilter('onhold')}
                    className={`bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border-2 transition-all text-left ${
                      currentJobsFilter === 'onhold' 
                        ? 'border-amber-500 ring-2 ring-amber-200' 
                        : 'border-amber-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-amber-700 font-medium">On Hold</p>
                        <p className="text-3xl font-bold text-amber-900 mt-1">{currentStats.onHold}</p>
                      </div>
                      <PauseCircle className="text-amber-600" size={32} />
                    </div>
                    {currentJobsFilter === 'onhold' && (
                      <p className="text-xs text-amber-600 mt-2">✓ Filtered</p>
                    )}
                  </button>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-700 font-medium">Job Types</p>
                        <p className="text-3xl font-bold text-purple-900 mt-1">{Object.keys(currentStats.byType).length}</p>
                      </div>
                      <TrendingUp className="text-purple-600" size={32} />
                    </div>
                  </div>
                </div>

                {/* Data Table */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">
                      {currentJobsFilter === 'all' && 'All Current Jobs'}
                      {currentJobsFilter === 'active' && 'Active Jobs'}
                      {currentJobsFilter === 'onhold' && 'On Hold Jobs'}
                    </h3>
                    {currentJobsFilter !== 'all' && (
                      <button
                        onClick={() => setCurrentJobsFilter('all')}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Clear filter
                      </button>
                    )}
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 sticky top-0">
                          <tr>
                            <th 
                              className="text-left px-4 py-3 font-medium text-slate-700 cursor-pointer hover:bg-slate-200 select-none"
                              onClick={() => handleCurrentJobsSort('Status')}
                            >
                              <div className="flex items-center gap-1">
                                Status
                                {currentJobsSort.key === 'Status' ? (
                                  currentJobsSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                ) : (
                                  <ArrowUpDown size={14} className="text-slate-400" />
                                )}
                              </div>
                            </th>
                            <th 
                              className="text-left px-4 py-3 font-medium text-slate-700 cursor-pointer hover:bg-slate-200 select-none"
                              onClick={() => handleCurrentJobsSort('release_status')}
                            >
                              <div className="flex items-center gap-1">
                                Release
                                {currentJobsSort.key === 'release_status' ? (
                                  currentJobsSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                ) : (
                                  <ArrowUpDown size={14} className="text-slate-400" />
                                )}
                              </div>
                            </th>
                            <th 
                              className="text-left px-4 py-3 font-medium text-slate-700 cursor-pointer hover:bg-slate-200 select-none"
                              onClick={() => handleCurrentJobsSort('program')}
                            >
                              <div className="flex items-center gap-1">
                                Program
                                {currentJobsSort.key === 'program' ? (
                                  currentJobsSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                ) : (
                                  <ArrowUpDown size={14} className="text-slate-400" />
                                )}
                              </div>
                            </th>
                            <th 
                              className="text-left px-4 py-3 font-medium text-slate-700 cursor-pointer hover:bg-slate-200 select-none"
                              onClick={() => handleCurrentJobsSort('name')}
                            >
                              <div className="flex items-center gap-1">
                                Job Name
                                {currentJobsSort.key === 'name' ? (
                                  currentJobsSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                ) : (
                                  <ArrowUpDown size={14} className="text-slate-400" />
                                )}
                              </div>
                            </th>
                            <th 
                              className="text-left px-4 py-3 font-medium text-slate-700 cursor-pointer hover:bg-slate-200 select-none"
                              onClick={() => handleCurrentJobsSort('customer')}
                            >
                              <div className="flex items-center gap-1">
                                Customer
                                {currentJobsSort.key === 'customer' ? (
                                  currentJobsSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                ) : (
                                  <ArrowUpDown size={14} className="text-slate-400" />
                                )}
                              </div>
                            </th>
                            <th 
                              className="text-left px-4 py-3 font-medium text-slate-700 cursor-pointer hover:bg-slate-200 select-none"
                              onClick={() => handleCurrentJobsSort('job_type')}
                            >
                              <div className="flex items-center gap-1">
                                Type
                                {currentJobsSort.key === 'job_type' ? (
                                  currentJobsSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                ) : (
                                  <ArrowUpDown size={14} className="text-slate-400" />
                                )}
                              </div>
                            </th>
                            <th 
                              className="text-left px-4 py-3 font-medium text-slate-700 cursor-pointer hover:bg-slate-200 select-none"
                              onClick={() => handleCurrentJobsSort('shop_pn')}
                            >
                              <div className="flex items-center gap-1">
                                Shop PN
                                {currentJobsSort.key === 'shop_pn' ? (
                                  currentJobsSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                ) : (
                                  <ArrowUpDown size={14} className="text-slate-400" />
                                )}
                              </div>
                            </th>
                            <th 
                              className="text-left px-4 py-3 font-medium text-slate-700 cursor-pointer hover:bg-slate-200 select-none"
                              onClick={() => handleCurrentJobsSort('cust_pn')}
                            >
                              <div className="flex items-center gap-1">
                                Cust PN
                                {currentJobsSort.key === 'cust_pn' ? (
                                  currentJobsSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                ) : (
                                  <ArrowUpDown size={14} className="text-slate-400" />
                                )}
                              </div>
                            </th>
                            <th 
                              className="text-left px-4 py-3 font-medium text-slate-700 cursor-pointer hover:bg-slate-200 select-none"
                              onClick={() => handleCurrentJobsSort('PCB Eng')}
                            >
                              <div className="flex items-center gap-1">
                                PCB Eng
                                {currentJobsSort.key === 'PCB Eng' ? (
                                  currentJobsSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                ) : (
                                  <ArrowUpDown size={14} className="text-slate-400" />
                                )}
                              </div>
                            </th>
                            <th 
                              className="text-left px-4 py-3 font-medium text-slate-700 cursor-pointer hover:bg-slate-200 select-none"
                              onClick={() => handleCurrentJobsSort('ASM Eng')}
                            >
                              <div className="flex items-center gap-1">
                                ASM Eng
                                {currentJobsSort.key === 'ASM Eng' ? (
                                  currentJobsSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                ) : (
                                  <ArrowUpDown size={14} className="text-slate-400" />
                                )}
                              </div>
                            </th>
                            <th 
                              className="text-left px-4 py-3 font-medium text-slate-700 cursor-pointer hover:bg-slate-200 select-none"
                              onClick={() => handleCurrentJobsSort('account_mngr')}
                            >
                              <div className="flex items-center gap-1">
                                Account Mgr
                                {currentJobsSort.key === 'account_mngr' ? (
                                  currentJobsSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                ) : (
                                  <ArrowUpDown size={14} className="text-slate-400" />
                                )}
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCurrentJobs.map((job, idx) => (
                            <tr key={idx} className="border-t border-slate-200 hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  job.Status === 'Active' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {job.Status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {job.release_status ? (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    job.release_status === 'Released' 
                                      ? 'bg-emerald-100 text-emerald-700' 
                                      : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    {job.release_status}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {job.program ? (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                    {job.program}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-medium">{job.name}</td>
                              <td className="px-4 py-3">{job.customer || '-'}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {job.job_type || '-'}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-xs">{job.shop_pn || '-'}</td>
                              <td className="px-4 py-3 font-mono text-xs">{job.cust_pn || '-'}</td>
                              <td className="px-4 py-3">{job['PCB Eng'] || '-'}</td>
                              <td className="px-4 py-3">{job['ASM Eng'] || '-'}</td>
                              <td className="px-4 py-3">{job.account_mngr || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    Showing {filteredCurrentJobs.length} of {currentJobs.length} job{currentJobs.length !== 1 ? 's' : ''}
                    {currentJobsFilter !== 'all' && (
                      <span className="ml-1">
                        ({currentJobsFilter === 'active' ? 'active only' : 'on hold only'})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historical Look Accordion */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => setHistoricalOpen(!historicalOpen)}
          className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={24} />
            <div className="text-left">
              <h2 className="text-xl font-bold text-slate-800">Historical Look</h2>
              <p className="text-sm text-slate-600">Departmental throughput and analytics (last 3 years)</p>
            </div>
          </div>
          {historicalOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>

        {historicalOpen && (
          <div className="p-6 border-t border-slate-200">
            {historicalError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                <p className="font-semibold">Error loading data</p>
                <p className="text-sm">{historicalError}</p>
                <button 
                  onClick={fetchTeamBacklog}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            ) : loadingHistorical ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Total Jobs</p>
                        <p className="text-3xl font-bold text-slate-800 mt-1">{historicalStats.total}</p>
                      </div>
                      <BarChart3 className="text-blue-600" size={32} />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Job Types</p>
                        <p className="text-3xl font-bold text-slate-800 mt-1">{Object.keys(historicalStats.byType).length}</p>
                      </div>
                      <TrendingUp className="text-green-600" size={32} />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Routes</p>
                        <p className="text-3xl font-bold text-slate-800 mt-1">{Object.keys(historicalStats.byRoute).length}</p>
                      </div>
                      <Clock className="text-amber-600" size={32} />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 font-medium">This Year</p>
                        <p className="text-3xl font-bold text-slate-800 mt-1">
                          {historicalStats.byYear[new Date().getFullYear()] || 0}
                        </p>
                      </div>
                      <CheckCircle className="text-purple-600" size={32} />
                    </div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Jobs by Type */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Jobs by Type</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={typeChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {typeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Jobs by Year */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Throughput by Year</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={yearChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Jobs by Route */}
                  <div className="bg-slate-50 rounded-lg p-4 col-span-2">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Jobs by Route Type</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={routeChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Data Table */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Historical Jobs</h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Job Name</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Type</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Route</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Customer PN</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Rev</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Start Time</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">End Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamBacklog.slice(0, 50).map((item) => (
                            <tr key={item.id} className="border-t border-slate-200 hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium">{item.name}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {item.job_type}
                                </span>
                              </td>
                              <td className="px-4 py-3">{item.routeType}</td>
                              <td className="px-4 py-3">{item.cust_pn || '-'}</td>
                              <td className="px-4 py-3">{item.rev || '-'}</td>
                              <td className="px-4 py-3">
                                {new Date(item.startTime).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                {item.endTime ? new Date(item.endTime).toLocaleDateString() : 'In Progress'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {teamBacklog.length > 50 && (
                    <p className="text-sm text-slate-600 mt-2">
                      Showing 50 of {teamBacklog.length} jobs
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
