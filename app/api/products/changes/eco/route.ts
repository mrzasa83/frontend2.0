import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

// eco_status meanings TBD — placeholder mapping until workflow is understood
function statusLabel(s: number): string {
  switch (s) {
    case 0: return 'Open'
    case 1: return 'Closed'
    case 2: return 'Rejected'
    default: return `Status ${s}`
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  try {
    if (id) {
      // Single record
      const rows = await queryPrimary('SELECT * FROM eco WHERE id = ?', [id])
      if (!rows?.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const record = rows[0]

      const combineDateTime = (d: string | null, t: string | null): string | null => {
        if (!d) return null
        try {
          const months: Record<string, string> = {
            Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',
            Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'
          }
          const m = d.match(/^(\d{1,2})([A-Za-z]{3})(\d{4})$/)
          if (m) return new Date(`${m[3]}-${months[m[2]] || '01'}-${m[1].padStart(2,'0')}T${t || '00:00:00'}`).toISOString()
        } catch {}
        return d + (t ? ' ' + t : '')
      }

      record.submitted_at = combineDateTime(record.subdate, record.subtime)
      record.closed_at = combineDateTime(record.closeddate, record.closedtime)
      record.status = statusLabel(Number(record.eco_status))

      return NextResponse.json({ success: true, record })
    }

    // List view
    const rows = await queryPrimary(`
      SELECT
        id, request, eco_status, change_status, partnum, customer, toolnum,
        software, submission_type, disposition, action_required, comments,
        cam_operator, job_type, urgent, support_type, support_requester,
        subdate, subtime, closeddate, closedtime,
        STR_TO_DATE(CONCAT(NULLIF(subdate,''), ' ', NULLIF(subtime,'')), '%d%b%Y %H:%i:%s') AS submitted_at,
        STR_TO_DATE(CONCAT(NULLIF(closeddate,''), ' ', NULLIF(closedtime,'')), '%d%b%Y %H:%i:%s') AS closed_at,
        CASE eco_status
          WHEN 0 THEN 'Open'
          WHEN 1 THEN 'Closed'
          WHEN 2 THEN 'Rejected'
          ELSE CONCAT('Status ', eco_status)
        END AS status
      FROM eco
      ORDER BY submitted_at DESC, id DESC
    `)

    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    console.error('Error fetching ECO:', error)
    return NextResponse.json({
      error: 'Failed to fetch', details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
