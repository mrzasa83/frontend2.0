'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ChevronDown, ChevronUp, BarChart3, TrendingUp, Clock, CheckCircle, AlertCircle, PlayCircle, PauseCircle, User } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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

      const res = await fetch('/api/dashboard/current-jobs')
      if (!res.ok) {
        throw new Error('Failed to fetch current jobs')
      }

      const data = await res.json()
      setCurrentJobs(data.results || [])
    } catch (err) {
      console.error('Error fetching current jobs:', err)
      setCurrentError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoadingCurrent(false)
    }
  }

  const fetchTeamBacklog = async () => {
    try {
      setLoadingHistorical(true)
      setHistoricalError(null)

      const res = await fetch('/api/dashboard/team-backlog')
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
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 font-medium">Total Jobs</p>
                        <p className="text-3xl font-bold text-blue-900 mt-1">{currentStats.total}</p>
                      </div>
                      <BarChart3 className="text-blue-600" size={32} />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 font-medium">Active</p>
                        <p className="text-3xl font-bold text-green-900 mt-1">{currentStats.active}</p>
                      </div>
                      <PlayCircle className="text-green-600" size={32} />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-amber-700 font-medium">On Hold</p>
                        <p className="text-3xl font-bold text-amber-900 mt-1">{currentStats.onHold}</p>
                      </div>
                      <PauseCircle className="text-amber-600" size={32} />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-700 font-medium">Job Types</p>
                        <p className="text-3xl font-bold text-purple-900 mt-1">{Object.keys(currentStats.byType).length}</p>
                      </div>
                      <TrendingUp className="text-purple-600" size={32} />
                    </div>
                  </div>
                </div>

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

                {/* Data Table */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Current Jobs List</h3>
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
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Cust PN</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">PCB Eng</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">ASM Eng</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Account Mgr</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentJobs.map((job, idx) => (
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
                    Showing {currentJobs.length} job{currentJobs.length !== 1 ? 's' : ''}
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
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
