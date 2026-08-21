import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// Only FAIadmin (or Admin) may delete, and the acting user must confirm with
// their OWN login password (bcrypt vs users table) to commit the delete.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = (session.user as any)?.roles || []
  if (!roles.includes('Admin') && !roles.includes('FAIadmin')) {
    return NextResponse.json({ error: 'Only FAI Admin can delete inspections' }, { status: 403 })
  }

  const username = (session.user as any)?.username
  if (!username) return NextResponse.json({ error: 'No username in session' }, { status: 400 })

  const { id, password } = await request.json()
  if (!id || !password) return NextResponse.json({ error: 'id and password required' }, { status: 400 })

  // Verify the acting user's own login password
  const users = await queryPrimary('SELECT password FROM users WHERE username = ?', [username]) as any[]
  if (!users?.length) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const valid = await bcrypt.compare(password, users[0].password)
  if (!valid) return NextResponse.json({ error: 'Incorrect password' }, { status: 403 })

  await queryPrimary('DELETE FROM inspection_history WHERE inspection_id = ?', [id])
  await queryPrimary('DELETE FROM inspections WHERE id = ?', [id])
  return NextResponse.json({ success: true })
}
