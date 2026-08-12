'use client'

import { useState, useEffect } from 'react'

interface WorkOrderData {
  // We'll define this based on your SQL query results
  [key: string]: any
}

interface AppSettings {
  loggingEnabled: boolean
}

export default function Home() {
  const [operator, setOperator] = useState('')
  const [workOrder, setWorkOrder] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<WorkOrderData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminBadge, setAdminBadge] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [settings, setSettings] = useState<AppSettings>({ loggingEnabled: true })

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  // Save settings to localStorage
  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings)
    localStorage.setItem('appSettings', JSON.stringify(newSettings))
  }

  const handleAdminLogin = () => {
    if (adminBadge === '98712') {
      setIsAdmin(true)
      setAdminBadge('')
    } else {
      alert('Invalid admin badge ID')
      setAdminBadge('')
    }
  }

  const toggleLogging = () => {
    const newSettings = { ...settings, loggingEnabled: !settings.loggingEnabled }
    saveSettings(newSettings)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate operator badge ID (5 digits)
    if (!/^\d{5}$/.test(operator.trim())) {
      setError('Operator Badge ID must be exactly 5 digits')
      return
    }

    if (!workOrder.trim()) {
      setError('Please enter a Work Order')
      return
    }

    setLoading(true)
    setError(null)
    setData(null)

    try {
      const response = await fetch('/api/work-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          operator, 
          workOrder,
          loggingEnabled: settings.loggingEnabled 
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch work order data')
      }

      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setOperator('')
    setWorkOrder('')
    setData(null)
    setError(null)
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Admin Button */}
        <div className="bg-blue-600 text-white p-6 rounded-t-lg shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">MDI Image Assist</h1>
            <p className="text-blue-100 mt-1">Work Order Processing</p>
          </div>
          <button
            onClick={() => setShowAdmin(!showAdmin)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg text-sm font-semibold transition-colors"
          >
            {showAdmin ? 'Close Admin' : 'Admin'}
          </button>
        </div>

        {/* Admin Panel */}
        {showAdmin && (
          <div className="bg-gray-50 border-x border-gray-200 p-6">
            {!isAdmin ? (
              <div className="max-w-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin Access</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={adminBadge}
                    onChange={(e) => setAdminBadge(e.target.value)}
                    placeholder="Enter admin badge ID"
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    maxLength={5}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleAdminLogin()
                    }}
                  />
                  <button
                    onClick={handleAdminLogin}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Login
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Admin Settings</h3>
                  <button
                    onClick={() => setIsAdmin(false)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Logout
                  </button>
                </div>
                
                {/* Logging Toggle */}
                <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                  <div>
                    <h4 className="font-semibold text-gray-800">Database Logging</h4>
                    <p className="text-sm text-gray-600">Log all activity to MySQL database</p>
                  </div>
                  <button
                    onClick={toggleLogging}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      settings.loggingEnabled ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        settings.loggingEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {/* Status Indicator */}
                <div className="mt-3 text-sm">
                  <span className="font-medium">Status: </span>
                  <span className={settings.loggingEnabled ? 'text-green-600' : 'text-orange-600'}>
                    {settings.loggingEnabled ? 'Logging Enabled' : 'Logging Disabled (Debug Mode)'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input Form */}
        <div className="bg-white p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Operator Badge ID Input */}
              <div>
                <label htmlFor="operator" className="block text-sm font-semibold text-gray-700 mb-2">
                  Operator Badge ID
                </label>
                <input
                  type="text"
                  id="operator"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="5-digit badge ID"
                  disabled={loading}
                  maxLength={5}
                  pattern="\d{5}"
                />
                <p className="text-xs text-gray-500 mt-1">Enter 5-digit badge number</p>
              </div>

              {/* Work Order Input */}
              <div>
                <label htmlFor="workOrder" className="block text-sm font-semibold text-gray-700 mb-2">
                  Work Order
                </label>
                <input
                  type="text"
                  id="workOrder"
                  value={workOrder}
                  onChange={(e) => setWorkOrder(e.target.value)}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Enter work order number"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Submit'}
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                Reset
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Data Display */}
          {data && (
            <div className="mt-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Work Order Details</h2>
              {data.data && data.data.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Customer</th>
                          <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Cust Part #</th>
                          <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Sales Order</th>
                          <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Work Order</th>
                          <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Inv Part #</th>
                          <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">NRUP</th>
                          <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Step</th>
                          <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Circ Size</th>
                          <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Panel Size</th>
                          <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Dept</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.data.map((row: any, idx: number) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 border-b text-sm">{row.ABBR_NAME}</td>
                            <td className="px-4 py-2 border-b text-sm">{row.CUSTOMER_PART_NUMBER}</td>
                            <td className="px-4 py-2 border-b text-sm">{row.SALES_ORDER}</td>
                            <td className="px-4 py-2 border-b text-sm font-medium">{row.WORK_ORDER}</td>
                            <td className="px-4 py-2 border-b text-sm">{row.INV_PART_NUMBER}</td>
                            <td className="px-4 py-2 border-b text-sm">{row.NRUP}</td>
                            <td className="px-4 py-2 border-b text-sm">{row.STEP}</td>
                            <td className="px-4 py-2 border-b text-sm">{row.CIRC_SIZE}</td>
                            <td className="px-4 py-2 border-b text-sm">{row.PNL_SIZE}</td>
                            <td className="px-4 py-2 border-b text-sm">{row.DEPT_CODE}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Route Data Display */}
                  {data.routeData && (
                    <div className="mt-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-3">
                        Route Information
                        <span className="ml-2 text-sm font-normal text-gray-600">
                          (Extracted Code: {data.routeData.extractedCode})
                        </span>
                      </h3>

                      {data.routeData.note && (
                        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                          <p className="text-sm text-yellow-700">{data.routeData.note}</p>
                        </div>
                      )}

                      {/* Route Query 1 Results */}
                      {data.routeData.routeQuery1Results && data.routeData.routeQuery1Results.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-md font-semibold text-gray-700 mb-2">
                            Customer Part Route ({data.routeData.routeQuery1Results.length} step{data.routeData.routeQuery1Results.length !== 1 ? 's' : ''})
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-300 text-sm">
                              <thead className="bg-blue-50">
                                <tr>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Step</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Dept Code</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Dept Name</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Param 1</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Param 2</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Param 3</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Param 4</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Param 5</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Param 6</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Param 7</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Param 8</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.routeData.routeQuery1Results.map((row: any, idx: number) => (
                                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-3 py-2 border-b">{row.STEP_NUMBER}</td>
                                    <td className="px-3 py-2 border-b">{row.DEPT_CODE}</td>
                                    <td className="px-3 py-2 border-b">{row.DEPT_NAME}</td>
                                    <td className="px-3 py-2 border-b">{row.PARAMETER_1}</td>
                                    <td className="px-3 py-2 border-b">{row.PARAMETER_2}</td>
                                    <td className="px-3 py-2 border-b">{row.PARAMETER_3}</td>
                                    <td className="px-3 py-2 border-b">{row.PARAMETER_4}</td>
                                    <td className="px-3 py-2 border-b">{row.PARAMETER_5}</td>
                                    <td className="px-3 py-2 border-b">{row.PARAMETER_6}</td>
                                    <td className="px-3 py-2 border-b">{row.PARAMETER_7}</td>
                                    <td className="px-3 py-2 border-b">{row.PARAMETER_8}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Route Query 2 Results */}
                      {data.routeData.routeQuery2Results && data.routeData.routeQuery2Results.length > 0 && (
                        <div>
                          <h4 className="text-md font-semibold text-gray-700 mb-2">
                            Inventory Part Route ({data.routeData.routeQuery2Results.length} step{data.routeData.routeQuery2Results.length !== 1 ? 's' : ''})
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-300 text-sm">
                              <thead className="bg-green-50">
                                <tr>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Step</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Dept Code</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Dept Name</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Param 1</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Param 2</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Param 3</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Param 4</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Param 5</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Param 6</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Param 7</th>
                                  <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700">Param 8</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.routeData.routeQuery2Results.map((row: any, idx: number) => (
                                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-3 py-2 border-b">{row.STEP_NUMBER}</td>
                                    <td className="px-3 py-2 border-b">{row.DEPT_CODE}</td>
                                    <td className="px-3 py-2 border-b">{row.DEPT_NAME}</td>
                                    <td className="px-3 py-2 border-b">{row.PARAMETER_1}</td>
                                    <td className="px-3 py-2 border-b">{row.PARAMETER_2}</td>
                                    <td className="px-3 py-2 border-b">{row.PARAMETER_3}</td>
                                    <td className="px-3 py-2 border-b">{row.PARAMETER_4}</td>
                                    <td className="px-3 py-2 border-b">{row.PARAMETER_5}</td>
                                    <td className="px-3 py-2 border-b">{row.PARAMETER_6}</td>
                                    <td className="px-3 py-2 border-b">{row.PARAMETER_7}</td>
                                    <td className="px-3 py-2 border-b">{row.PARAMETER_8}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <p className="text-yellow-700">No data found for this work order.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-gray-200 p-4 rounded-b-lg shadow-lg text-center text-sm text-gray-600">
          <p>Enter operator badge ID and work order number to begin processing</p>
        </div>
      </div>
    </main>
  )
}
