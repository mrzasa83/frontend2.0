import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import bcrypt from 'bcryptjs'
import { canWriteScope } from '@/lib/config/access'

export const dynamic = 'force-dynamic'

// Ordered phase pipeline. Approving a phase advances to the next.
const PHASE_ORDER = ['Setup', 'Measurement', 'Verify', 'Submitted', 'Completed']
const nextPhase = (p: string) => {
  const i = PHASE_ORDER.indexOf(p)
  return i >= 0 && i < PHASE_ORDER.length - 1 ? PHASE_ORDER[i + 1] : p
}

const SIGNOFF_ROLES = ['Admin', 'Quality Control']
// Signoff is gated on inspections write (matrix). Tighten via a dedicated
// scope/role if signoff should be narrower than general inspection editing.
const canSignoff = (roles: string[]) => canWriteScope(roles, 'operations/inspections')

// GET ?inspectionId= : signoff timeline
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const inspectionId = searchParams.get('inspectionId')
  if (!inspectionId) return NextResponse.json({ error: 'inspectionId required' }, { status: 400 })

  try {
    const signoffs = await queryPrimary(
      'SELECT phase, approved_by, approved_at, note FROM inspection_signoffs WHERE inspection_id = ? ORDER BY approved_at ASC',
      [inspectionId]
    )
    return NextResponse.json({ success: true, signoffs: signoffs || [], phaseOrder: PHASE_ORDER })
  } catch (error) {
    return NextResponse.json({ error: 'Failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

// POST : approve the current stage (requires password). Advances phase.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = (session.user as any)?.roles || []
  const username = (session.user as any)?.username
  if (!username) return NextResponse.json({ error: 'No username in session' }, { status: 400 })
  if (!canSignoff(roles)) return NextResponse.json({ error: 'Only Quality Control or Admin can sign off' }, { status: 403 })

  try {
    const { inspectionId, password, note } = await request.json()
    if (!inspectionId) return NextResponse.json({ error: 'inspectionId required' }, { status: 400 })
    if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 })

    // Verify the signer's password
    const users = await queryPrimary('SELECT password FROM users WHERE username = ?', [username])
    if (!users?.length) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const valid = await bcrypt.compare(password, users[0].password)
    if (!valid) return NextResponse.json({ error: 'Invalid password' }, { status: 401 })

    // Current phase
    const rows = await queryPrimary('SELECT phase FROM inspections WHERE id = ?', [inspectionId])
    if (!rows?.length) return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    const current = rows[0].phase as string
    if (['Completed', 'Canceled'].includes(current)) {
      return NextResponse.json({ error: `Cannot sign off a ${current} inspection` }, { status: 400 })
    }

    // Record the signoff for the current phase (idempotent on re-approve)
    await queryPrimary(
      `INSERT INTO inspection_signoffs (inspection_id, phase, approved_by, note)
       VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE approved_by = VALUES(approved_by), approved_at = CURRENT_TIMESTAMP, note = VALUES(note)`,
      [inspectionId, current, username, note || null]
    )

    // Advance the phase
    const next = nextPhase(current)
    if (next !== current) {
      await queryPrimary('UPDATE inspections SET phase = ? WHERE id = ?', [next, inspectionId])
      await queryPrimary(
        'INSERT INTO inspection_history (inspection_id, field_name, old_value, new_value, changed_by) VALUES (?,?,?,?,?)',
        [inspectionId, 'phase', current, next, username]
      )
    }

    return NextResponse.json({ success: true, signedPhase: current, newPhase: next, approvedBy: username })
  } catch (error) {
    return NextResponse.json({ error: 'Failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
