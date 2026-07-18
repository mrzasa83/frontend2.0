import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { decryptSetting } from '@/lib/settings/crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, password } = await request.json()
  if (!id || !password) return NextResponse.json({ error: 'id and password required' }, { status: 400 })

  const rows = await queryPrimary('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['delete_fai_password']) as any[]
  const stored = rows?.length ? decryptSetting(rows[0].setting_value || '') : ''
  if (!stored) return NextResponse.json({ error: 'Delete password is not configured. Set it in Admin → System Settings.' }, { status: 400 })
  if (password !== stored) return NextResponse.json({ error: 'Incorrect delete password' }, { status: 403 })

  await queryPrimary('DELETE FROM inspection_history WHERE inspection_id = ?', [id])
  await queryPrimary('DELETE FROM inspections WHERE id = ?', [id])
  return NextResponse.json({ success: true })
}
