# MDI Image Assist - UI Updates Implementation Guide

## Summary of Completed Updates

✅ **MySQL Schema** (`setup-mysql-schema.sql`)
- Updated activity_log → activity_log_mdi (with machine column)
- Created config_mdi table for system configuration
- Added default configuration values

✅ **MySQL Library** (`lib/mysql.ts`)
- Updated logActivity() to include machine parameter
- Added getConfig(), setConfig(), getAllConfig() functions
- Changed table name to activity_log_mdi

✅ **Config API** (`app/api/config/route.ts`)
- GET /api/config?system=MDI&key=machines
- POST /api/config with {system, key, value, updatedBy}

✅ **Work Order Route** (`app/api/work-order/route.ts`)
- Updated all logActivity() calls to new signature

## Remaining UI Updates Needed

### 1. Add Tabs to Main Page (app/page.tsx)

Add these state variables near the top:
```typescript
const [activeTab, setActiveTab] = useState<'main' | 'admin' | 'print-queue'>('main')
const [machines, setMachines] = useState<MDIMachine[]>([])
const [defaultMachine, setDefaultMachine] = useState<string>('')
const [qualifiedUsers, setQualifiedUsers] = useState<string[]>([])
```

Add tab navigation below the header:
```tsx
{/* Tab Navigation */}
<div className="bg-white border-b border-gray-200">
  <nav className="flex space-x-4 px-6">
    <button
      onClick={() => setActiveTab('main')}
      className={`py-4 px-3 border-b-2 font-medium text-sm ${
        activeTab === 'main'
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      Work Order
    </button>
    <button
      onClick={() => setActiveTab('print-queue')}
      className={`py-4 px-3 border-b-2 font-medium text-sm ${
        activeTab === 'print-queue'
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      Print Queue
    </button>
    {isAdmin && (
      <button
        onClick={() => setActiveTab('admin')}
        className={`py-4 px-3 border-b-2 font-medium text-sm ${
          activeTab === 'admin'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        Admin Config
      </button>
    )}
  </nav>
</div>
```

### 2. Admin Tab Content

Replace the existing admin panel with expanded version:
```tsx
{activeTab === 'admin' && isAdmin && (
  <div className="bg-white p-8 shadow-lg">
    <h2 className="text-2xl font-bold text-gray-800 mb-6">System Configuration</h2>
    
    {/* Mode Toggle */}
    <div className="mb-8 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Operating Mode</h3>
      <div className="flex items-center justify-between">
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
      <div className="mt-2 text-sm">
        <span className="font-medium">Status: </span>
        <span className={settings.loggingEnabled ? 'text-green-600' : 'text-orange-600'}>
          {settings.loggingEnabled ? 'Live Mode' : 'Debug Mode'}
        </span>
      </div>
    </div>

    {/* MDI Machines Configuration */}
    <div className="mb-8 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">MDI Machines</h3>
      
      {/* Machine List */}
      <div className="space-y-2 mb-4">
        {machines.map((machine, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-white rounded border">
            <div>
              <div className="font-medium">{machine.name}</div>
              <div className="text-sm text-gray-600">{machine.host}:{machine.port}</div>
            </div>
            <div className="flex gap-2">
              {machine.name === defaultMachine && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Default</span>
              )}
              <button
                onClick={() => {
                  const newMachines = machines.filter((_, i) => i !== idx)
                  setMachines(newMachines)
                  saveConfigToDb('machines', newMachines)
                }}
                className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Machine Form */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Machine Name (e.g., MDI-001)"
          value={newMachine.name}
          onChange={(e) => setNewMachine({...newMachine, name: e.target.value})}
          className="w-full px-3 py-2 border rounded"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Host/IP (e.g., 192.168.1.100)"
            value={newMachine.host}
            onChange={(e) => setNewMachine({...newMachine, host: e.target.value})}
            className="px-3 py-2 border rounded"
          />
          <input
            type="number"
            placeholder="Port"
            value={newMachine.port}
            onChange={(e) => setNewMachine({...newMachine, port: parseInt(e.target.value)})}
            className="px-3 py-2 border rounded"
          />
        </div>
        <button
          onClick={() => {
            if (newMachine.name && newMachine.host) {
              const updated = [...machines, newMachine]
              setMachines(updated)
              saveConfigToDb('machines', updated)
              setNewMachine({ name: '', host: '', port: 5000 })
            }
          }}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Machine
        </button>
      </div>
    </div>

    {/* Qualified Users */}
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Qualified Admin Users</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {qualifiedUsers.map((user, idx) => (
          <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-white rounded border">
            <span>{user}</span>
            <button
              onClick={() => {
                const updated = qualifiedUsers.filter((_, i) => i !== idx)
                setQualifiedUsers(updated)
                saveConfigToDb('qualified_users', updated)
              }}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Badge ID (5 digits)"
          value={newUser}
          onChange={(e) => setNewUser(e.target.value.replace(/\D/g, '').slice(0, 5))}
          maxLength={5}
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={() => {
            if (newUser && newUser.length === 5 && !qualifiedUsers.includes(newUser)) {
              const updated = [...qualifiedUsers, newUser]
              setQualifiedUsers(updated)
              saveConfigToDb('qualified_users', updated)
              setNewUser('')
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add User
        </button>
      </div>
    </div>
  </div>
)}
```

### 3. Print Queue Tab (Placeholder)

```tsx
{activeTab === 'print-queue' && (
  <div className="bg-white p-8 shadow-lg">
    <h2 className="text-2xl font-bold text-gray-800 mb-6">Print Queue Status</h2>
    <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
      <p className="text-gray-600 mb-4">Print queue monitoring coming soon</p>
      <p className="text-sm text-gray-500">
        This will show active print jobs on configured MDI machines
      </p>
    </div>
  </div>
)}
```

### 4. Update Admin Login

Check against qualified_users from database instead of hardcoded:
```typescript
const handleAdminLogin = () => {
  // Load qualified users first
  loadConfig().then(() => {
    if (qualifiedUsers.includes(adminBadge)) {
      setIsAdmin(true)
      setAdminBadge('')
      setActiveTab('admin')
    } else {
      alert('Invalid admin badge ID')
      setAdminBadge('')
    }
  })
}
```

## Database Setup

Run this SQL on your MySQL server:
```bash
mysql -h apceng03 -u dbFrontEnd -p node_app < setup-mysql-schema.sql
```

## Testing

1. **Test Config API:**
```bash
curl http://localhost:4221/api/config?system=MDI
```

2. **Add a machine:**
```bash
curl -X POST http://localhost:4221/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "system": "MDI",
    "key": "machines",
    "value": [{"name":"MDI-001","host":"192.168.1.100","port":5000}]
  }'
```

3. **Check activity log:**
```sql
SELECT * FROM activity_log_mdi ORDER BY created_at DESC LIMIT 10;
```

## File Writer Fix

The file-writer.ts exists and should work. If you still see the error:
1. Delete `.next` folder: `rm -rf .next`
2. Reinstall: `npm install`
3. Rebuild: `npm run build`

The import path `@/lib/file-writer` is correct based on your tsconfig.json paths configuration.
