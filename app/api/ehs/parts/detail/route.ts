import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule } from '@/lib/config/access'
import { loadFamilies } from '@/lib/ehs/loadFamilies'
import { familyForPart, type PartRow } from '@/lib/ehs/familyMatch'
import { windowsToLinuxPath, FILE_SERVE_ALLOWED_BASES } from '@/lib/config/drives'
import path from 'path'

export const dynamic = 'force-dynamic'

/** The part itself. */
const PART_SQL = `
  SELECT TOP 1
    RKEY, INV_PART_NUMBER, INV_PART_DESCRIPTION, MANUFACTURER_NAME, P_M, ACTIVE_FLAG
  FROM DATA0017 WITH (NOLOCK)
  WHERE LTRIM(RTRIM(INV_PART_NUMBER)) = @part`

/**
 * Notepad. Paradigm keeps purchased-part notes in DATA0011, keyed by
 * FILE_POINTER = DATA0017.RKEY with SOURCE_TYPE = 17. The text is split across
 * fixed-width NOTE_PAD_LINE_n columns, so we select the row wholesale and
 * reassemble the lines in column order — that way the number of line columns
 * doesn't have to be hard-coded.
 */
const NOTEPAD_SQL = `
  SELECT * FROM DATA0011 WITH (NOLOCK)
  WHERE FILE_POINTER = @rkey AND SOURCE_TYPE = 17
  ORDER BY RKEY`

/** Attachments — same reference the Build Drawings tab uses. */
const ATTACH_SQL = `
  SELECT
    LTRIM(RTRIM(d433.DOCUMENT_PATH)) AS DOCUMENT_PATH,
    LTRIM(RTRIM(d433.DOCUMENT_DESC)) AS DOCUMENT_DESC,
    d433.PRINT_ON_TRAVELLER
  FROM DATA0433 d433 WITH (NOLOCK)
  WHERE d433.SOURCE_PTR = @rkey AND d433.SOURCE_TYPE = 17
  ORDER BY d433.DOCUMENT_PATH`

/**
 * Reassemble the note from a DATA0011 row set.
 * Each row holds NOTE_PAD_LINE_1..n of char(70) — space-padded, and Paradigm
 * will break mid-word at the 70-character boundary. Lines are right-trimmed and
 * joined in numeric column order; trailing blank lines are dropped, but blank
 * lines in the middle are kept since they're part of the author's layout.
 */
function assembleNotepad(rows: any[]): string {
  const out: string[] = []
  for (const row of rows || []) {
    const lineKeys = Object.keys(row)
      .filter(k => /^NOTE_?PAD_?LINE_?\d+$/i.test(k))
      .sort((a, b) => {
        const na = parseInt(a.replace(/\D+/g, ''), 10)
        const nb = parseInt(b.replace(/\D+/g, ''), 10)
        return na - nb
      })
    for (const k of lineKeys) {
      const v = row[k]
      out.push(v === null || v === undefined ? '' : String(v).replace(/\s+$/, ''))
    }
  }
  while (out.length && !out[out.length - 1].trim()) out.pop()
  return out.join('\n')
}

// GET ?part=HDW0000000014 -> the part, its notepad, attachments, family and
// whichever compliance applies (inherited, or its own when the family is per-part).
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  // Material Mgt sits under Product now, so either module grants read.
  if (!canReadModule(roles, 'ehs') && !canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const partNumber = (new URL(request.url).searchParams.get('part') || '').trim()
  if (!partNumber) return NextResponse.json({ error: 'part is required' }, { status: 400 })

  try {
    const partRows = await queryMSSQL<any[]>('1', PART_SQL, { part: partNumber })
    if (!partRows?.length) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }
    const p = partRows[0]
    const rkey = Number(p.RKEY)
    const clean = (v: any) => String(v ?? '').trim()

    const [noteRows, attachRows, families, ownRows] = await Promise.all([
      queryMSSQL<any[]>('1', NOTEPAD_SQL, { rkey }).catch(e => {
        console.error('EHS notepad query failed for', partNumber, e); return []
      }),
      queryMSSQL<any[]>('1', ATTACH_SQL, { rkey }).catch(e => {
        console.error('EHS attachment query failed for', partNumber, e); return []
      }),
      loadFamilies(),
      queryPrimary<any[]>(
        `SELECT reach_status, rohs_status, prop65_status, notes, updated_by, updated_at
         FROM ehs_part_compliance WHERE part_number = ? LIMIT 1`, [clean(p.INV_PART_NUMBER)]
      ).catch(() => []),
    ])

    const asPart: PartRow = {
      RKEY: rkey,
      INV_PART_NUMBER: clean(p.INV_PART_NUMBER),
      INV_PART_DESCRIPTION: clean(p.INV_PART_DESCRIPTION),
      MANUFACTURER_NAME: clean(p.MANUFACTURER_NAME),
      ACTIVE_FLAG: clean(p.ACTIVE_FLAG),
    }
    const fam = familyForPart(asPart, families)
    const inherits = fam ? (fam.inherit_compliance ?? 1) : 1
    const own = ownRows?.[0] || null

    // Where the classification comes from:
    //   'Family' — inherited from the family definition
    //   'Part'   — the family doesn't flow down, so the part carries its own
    //   ''       — no family yet, so nothing to inherit and nothing to set
    const source = !fam ? '' : (inherits ? 'Family' : 'Part')
    const compliance = source === 'Family'
      ? {
          reach_status: fam!.reach_status || 'Unknown',
          rohs_status: fam!.rohs_status || 'Unknown',
          prop65_status: fam!.prop65_status || 'Unknown',
        }
      : source === 'Part'
        ? {
            reach_status: own?.reach_status || 'Unknown',
            rohs_status: own?.rohs_status || 'Unknown',
            prop65_status: own?.prop65_status || 'Unknown',
          }
        : { reach_status: '', rohs_status: '', prop65_status: '' }

    // Paradigm stores absolute Windows paths. Anything on a share we don't map
    // comes back unconverted, and the file-serve whitelist would reject it with a
    // bare "Access denied" — so flag it here instead of leaving the user guessing.
    const bases = FILE_SERVE_ALLOWED_BASES()
    const attachments = (attachRows || []).map(a => {
      const win = clean(a.DOCUMENT_PATH)
      const linux = windowsToLinuxPath(win)
      const name = path.basename((linux || win).replace(/\\\\/g, '/'))
      const converted = !!linux && !/^\\\\|^[A-Za-z]:\\/.test(linux)
      const allowed = converted && bases.some(b => linux.startsWith(b))
      return {
        name,
        description: clean(a.DOCUMENT_DESC),
        path: linux,
        windows_path: win,
        extension: (path.extname(name) || '').replace(/^\./, '').toLowerCase(),
        print_on_traveller: Number(a.PRINT_ON_TRAVELLER) === 1,
        servable: allowed,
        reason: allowed ? '' : (converted
          ? 'Resolved, but outside the paths the file server is allowed to read.'
          : 'This share is not mapped to a mount point, so the file cannot be resolved.'),
      }
    })

    return NextResponse.json({
      success: true,
      part: {
        rkey,
        part_number: asPart.INV_PART_NUMBER,
        description: asPart.INV_PART_DESCRIPTION,
        manufacturer: asPart.MANUFACTURER_NAME,
        active_flag: asPart.ACTIVE_FLAG,
        pm: clean(p.P_M),
      },
      family: fam ? {
        id: fam.id, family_name: fam.family_name,
        inherit_compliance: inherits ? 1 : 0,
        reach_status: fam.reach_status, rohs_status: fam.rohs_status, prop65_status: fam.prop65_status,
      } : null,
      compliance_source: source,      // 'Family' | 'Part' | ''
      compliance,
      part_compliance: own,           // the stored per-part record, when there is one
      notepad: assembleNotepad(noteRows || []),
      attachments,
    })
  } catch (error) {
    console.error('EHS part detail error:', error)
    return NextResponse.json({
      error: 'Failed to load the part',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
