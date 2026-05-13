import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { password } = await request.json()
    if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 })

    const username = (session.user as any)?.username
    if (!username) return NextResponse.json({ error: 'No username in session' }, { status: 400 })

    const users = await queryPrimary('SELECT password FROM users WHERE username = ?', [username])
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const valid = await bcrypt.compare(password, users[0].password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    return NextResponse.json({ success: true, verified: true })
  } catch (error) {
    console.error('Error verifying password:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
