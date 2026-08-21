import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ROLE_DEFS, ROLE_ACCESS, ALL_MODULES } from '@/lib/config/access'
import { MODULES } from '@/lib/config/modules'

export const dynamic = 'force-dynamic'

// GET: the current access matrix (roles × modules read/write) for the viewer.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user?.roles?.includes('Admin')) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  // Friendly module labels from the nav config
  const moduleLabels: Record<string, string> = {}
  for (const m of MODULES) moduleLabels[m.id] = m.name

  const matrix = ROLE_DEFS.map(def => {
    const a = ROLE_ACCESS[def.name] || { read: [], write: [] }
    const readAll = a.read.includes('*')
    const writeAll = a.write.includes('*')
    return {
      role: def.name,
      description: def.description,
      legacy: !!def.legacy,
      modules: ALL_MODULES.map(mid => ({
        id: mid,
        label: moduleLabels[mid] || mid,
        read: mid === 'dashboard' ? true : readAll || a.read.includes(mid),
        write: writeAll || a.write.includes(mid),
      })),
      writeScopes: writeAll ? ['Any'] : a.write,
    }
  })

  return NextResponse.json({
    success: true,
    modules: ALL_MODULES.map(mid => ({ id: mid, label: moduleLabels[mid] || mid })),
    matrix,
  })
}
