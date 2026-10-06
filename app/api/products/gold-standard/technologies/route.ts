import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

export const dynamic = 'force-dynamic'

/**
 * NPI technologies, for the picker.
 *
 * npi_technologies is owned by the NPI app, so this reads it and never writes
 * it. Column names are probed rather than assumed: this table predates the
 * gold standard feature and a hard-coded `name` that turns out to be
 * `technology` would fail at runtime on a table we do not control.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const cols = await queryPrimary<any[]>(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'npi_technologies'`)
    const names = (cols || []).map((c: any) => String(c.COLUMN_NAME))
    if (!names.length) {
      return NextResponse.json({
        success: true, technologies: [],
        warning: 'npi_technologies was not found in this database',
      })
    }
    const label = ['name', 'technology', 'technology_name', 'title', 'description']
      .find(c => names.includes(c)) || names.find(c => c !== 'id') || 'id'
    const rows = await queryPrimary<any[]>(
      `SELECT id, \`${label}\` AS name FROM npi_technologies ORDER BY \`${label}\``)
    return NextResponse.json({
      success: true,
      labelColumn: label,
      technologies: (rows || []).map((r: any) => ({ id: Number(r.id), name: String(r.name ?? '') })),
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to read npi_technologies',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
