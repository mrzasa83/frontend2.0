import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { hasColumn } from '@/lib/db/schemaProbe'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('PUT /api/users/[id] called')
  
  const session = await getServerSession(authOptions)
  
  if (!session) {
    console.log('No session found')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    const { id } = await params  // <-- AWAIT params here!

    console.log('Updating user ID:', id)
    console.log('Update data:', data)

    // office_location arrives with a migration that may not have run yet, so
    // the column is only written when it exists — a pending migration
    // shouldn't take user editing down.
    const withLocation = await hasColumn('Users', 'office_location')
    const withNetUser = await hasColumn('Users', 'network_username')

    const setCols = [
      'name = ?', 'email = ?', 'nickname = ?', 'phone = ?',
      'mobile = ?', 'title = ?', 'role = ?', 'active = ?',
      ...(withLocation ? ['office_location = ?'] : []),
      ...(withNetUser ? ['network_username = ?'] : []),
      'updatedAt = NOW()',
    ]
    const setArgs: any[] = [
      data.name || null,
      data.email || null,
      data.nickname || null,
      data.phone || null,
      data.mobile || null,
      data.title || null,
      data.role || null,
      data.active !== undefined ? data.active : null,
      ...(withLocation ? [data.office_location || null] : []),
      ...(withNetUser ? [data.network_username || null] : []),
    ]

    const result = await queryPrimary(
      `UPDATE Users SET ${setCols.join(', ')} WHERE id = ?`,
      [...setArgs, id]
    )

    console.log('Update result:', result)

    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully',
      affectedRows: (result as any).affectedRows 
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update user', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

// GET method for testing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // <-- AWAIT params here too!
  
  return NextResponse.json({ 
    message: 'PUT route exists',
    userId: id 
  })
}