import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { encryptSetting, decryptSetting } from '@/lib/settings/crypto'

export const dynamic = 'force-dynamic'

const KEY = 'delete_fai_password'

async function admin() {
  const s = await getServerSession(authOptions)
  return s?.user?.roles?.includes('Admin') ? s : null
}

export async function GET() {
  const s = await admin()
  if (!s) return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  const rows = await queryPrimary('SELECT setting_value FROM app_settings WHERE setting_key = ?', [KEY]) as any[]
  const value = rows?.length ? decryptSetting(rows[0].setting_value || '') : ''
  return NextResponse.json({ success: true, deleteFaiPassword: value })
}

export async function PUT(request: NextRequest) {
  const s = await admin()
  if (!s) return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  const { deleteFaiPassword } = await request.json()
  const by = (s.user as any)?.username || s.user?.name || 'admin'
  const enc = encryptSetting(String(deleteFaiPassword ?? ''))
  await queryPrimary(
    `INSERT INTO app_settings (setting_key, setting_value, is_encrypted, updated_by)
     VALUES (?,?,1,?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
    [KEY, enc, by]
  )
  return NextResponse.json({ success: true })
}
