import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

// PUT - Update audit definition
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRoles = session.user.roles || []
  const canEdit = userRoles.some(role => 
    ['Admin', 'ProcessEng', 'ProductEng'].includes(role)
  )
  
  if (!canEdit) {
    return NextResponse.json({ error: 'Not authorized to edit audits' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, active, fields, authorized_users } = body

    if (!name || !fields || !authorized_users) {
      return NextResponse.json(
        { error: 'Name, fields, and authorized_users are required' },
        { status: 400 }
      )
    }

    await queryPrimary(
      `UPDATE audit_def 
       SET name = ?, description = ?, active = ?, fields_json = ?, authorized_users_json = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        name,
        description || null,
        active ?? 1,
        JSON.stringify(fields),
        JSON.stringify(authorized_users),
        id
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'Audit updated successfully'
    })
  } catch (error) {
    console.error('Audits PUT Error:', error)
    return NextResponse.json(
      { error: 'Failed to update audit' },
      { status: 500 }
    )
  }
}

// DELETE - Delete audit definition
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRoles = session.user.roles || []
  const canDelete = userRoles.some(role => 
    ['Admin', 'ProcessEng', 'ProductEng'].includes(role)
  )
  
  if (!canDelete) {
    return NextResponse.json({ error: 'Not authorized to delete audits' }, { status: 403 })
  }

  try {
    const { id } = await params
    
    // Records will be deleted automatically due to CASCADE
    await queryPrimary('DELETE FROM audit_def WHERE id = ?', [id])

    return NextResponse.json({
      success: true,
      message: 'Audit deleted successfully'
    })
  } catch (error) {
    console.error('Audits DELETE Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete audit' },
      { status: 500 }
    )
  }
}
