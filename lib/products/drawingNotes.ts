import crypto from 'crypto'
import { queryPrimary } from '@/lib/db/mysql-primary'

/**
 * Drawing Notes — shared data logic.
 *
 * The interesting part of this feature is not storage, it is deciding whether
 * a block of text scanned off a drawing is a note already on file or a new one.
 * That decision lives here so the scan route, a future bulk importer, and
 * manual entry all make it the same way.
 */

export type ScannedNote = {
  note_number: string
  text: string
  text_hash: string
  page: number
  zone: string
  bbox: number[]
  page_width: number
  page_height: number
  extraction_method: string
  drawing_number?: string
  drawing_rev?: string
  drawing_rev_date?: string
  sheet_label?: string
}

/**
 * Canonical form for dedup. MUST stay in step with normalize_note() in
 * scripts/scan_drawing_notes.py — if the two drift, the same note scanned
 * before and after the change lands on two different rows.
 *
 * Case-folded, whitespace collapsed, and the punctuation OCR most often
 * mangles removed. Digits and decimal points are preserved on purpose:
 * ".050 max" and ".060 max" are different requirements.
 */
export function normalizeNote(text: string): string {
  let t = (text || '').toLowerCase()
  t = t.replace(/\s+/g, ' ')
  t = t.replace(/\u2019/g, "'").replace(/[\u201c\u201d]/g, '"')
  t = t.replace(/[,;:"'`]/g, '')
  t = t.replace(/\s*-\s*/g, '-')
  return t.replace(/^[\s.]+|[\s.]+$/g, '')
}

export function textHash(text: string): string {
  return crypto.createHash('sha1').update(normalizeNote(text), 'utf8').digest('hex')
}

export function pathHash(p: string): string {
  return crypto.createHash('sha1').update(String(p || ''), 'utf8').digest('hex')
}

/** N + 10 digits, e.g. N0000000001. */
export function formatNoteCode(n: number | string): string {
  return 'N' + String(n).padStart(10, '0')
}

/**
 * Allocate the next note_code.
 *
 * One INSERT into an AUTO_INCREMENT table, taking the number from the same
 * result. Deliberately NOT the counter-row idiom:
 *
 *     UPDATE drawing_note_seq SET next_val = LAST_INSERT_ID(next_val + 1);
 *     SELECT LAST_INSERT_ID();
 *
 * LAST_INSERT_ID() is scoped to a connection, and queryPrimary draws from a
 * pool, so those two statements can run on different connections — the SELECT
 * then returns 0 or some other request's value. That yields note_id 0 and
 * orphaned versions, and it only shows up under load.
 */
export async function nextNoteCode(user = ''): Promise<string> {
  const res = await queryPrimary<any>(
    'INSERT INTO drawing_note_seq (allocated_by) VALUES (?)', [user]
  )
  const n = Number(res?.insertId || 0)
  if (!n) throw new Error('Could not allocate a note code')
  return formatNoteCode(n)
}

/** Derive a short label from the note text, for the master list's Name column. */
export function deriveName(text: string): string {
  const t = (text || '').trim().replace(/\s+/g, ' ')
  // Prefer a standard reference if the note cites one — "IPC-610",
  // "J-STD-001", "IPC-CC-830" — since that is how people refer to these.
  const std = t.match(/\b((?:IPC|J-STD|MIL|ASTM|ANSI|SAE|AS)[A-Z0-9-]*\d[A-Z0-9-]*)\b/i)
  if (std) {
    const lead = t.split(/\s+/).slice(0, 2).join(' ').replace(/[.,]$/, '')
    return `${lead} ${std[1].toUpperCase()}`.slice(0, 300)
  }
  const firstSentence = t.split(/(?<=\.)\s/)[0] || t
  return firstSentence.replace(/\.$/, '').slice(0, 120)
}

export type IngestResult = {
  note_code: string
  note_id: number
  version_id: number
  isNew: boolean
  note_number: string
  page: number
  zone: string
  text: string
}

/**
 * Record one scanned note against a part.
 *
 * Three outcomes, in order:
 *   1. Text already on file for this customer -> link the part to the existing
 *      note. This is the common case and the reason the feature exists.
 *   2. New text -> create the note plus a Pending v1 for someone to approve.
 *   3. Same note, same file, same position -> update the sighting in place, so
 *      re-scanning a drawing is idempotent rather than duplicating rows.
 *
 * Near-matches are never merged automatically. A note differing by one
 * character is usually a different requirement, not a typo, and an approver
 * looking at two similar Pending notes can merge them deliberately.
 */
export async function ingestScannedNote(
  n: ScannedNote,
  ctx: {
    apcPart: string
    customerPart: string
    customer: string
    pdfPath: string
    pdfName: string
    user: string
  }
): Promise<IngestResult> {
  const hash = n.text_hash || textHash(n.text)

  const existing = await queryPrimary<any[]>(
    `SELECT n.id, n.note_code,
            (SELECT v.id FROM drawing_note_versions v
              WHERE v.note_id = n.id ORDER BY v.version_no DESC LIMIT 1) AS latest_version_id
       FROM drawing_notes n
      WHERE n.customer = ? AND n.text_hash = ?
      LIMIT 1`,
    [ctx.customer, hash]
  )

  let noteId: number
  let noteCode: string
  let versionId: number
  let isNew = false

  if (existing && existing.length) {
    noteId = Number(existing[0].id)
    noteCode = String(existing[0].note_code)
    versionId = Number(existing[0].latest_version_id || 0)
  } else {
    isNew = true
    noteCode = await nextNoteCode(ctx.user)
    const name = deriveName(n.text)
    const ins = await queryPrimary<any>(
      `INSERT INTO drawing_notes (note_code, customer, name, text_hash, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [noteCode, ctx.customer, name, hash, ctx.user]
    )
    noteId = Number(ins?.insertId || 0)

    // v1 lands Pending: a scan is a proposal, never an approved note.
    const vIns = await queryPrimary<any>(
      `INSERT INTO drawing_note_versions
         (note_id, version_no, status, name, note_text, created_by)
       VALUES (?, 1, 'Pending', ?, ?, ?)`,
      [noteId, name, n.text, ctx.user]
    )
    versionId = Number(vIns?.insertId || 0)
  }

  const ph = pathHash(ctx.pdfPath)
  const bbox = n.bbox || []
  await queryPrimary(
    `INSERT INTO drawing_note_sources
       (note_id, apc_part_number, customer_part_number, customer,
        pdf_path, pdf_name, pdf_path_hash, page_no, zone_label,
        bbox_x0, bbox_y0, bbox_x1, bbox_y1, page_width, page_height,
        drawing_number, drawing_rev, drawing_rev_date, sheet_label,
        extraction_method, note_number, raw_text, scanned_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       zone_label = VALUES(zone_label),
       bbox_x0 = VALUES(bbox_x0), bbox_y0 = VALUES(bbox_y0),
       bbox_x1 = VALUES(bbox_x1), bbox_y1 = VALUES(bbox_y1),
       drawing_number = VALUES(drawing_number),
       drawing_rev = VALUES(drawing_rev),
       drawing_rev_date = VALUES(drawing_rev_date),
       sheet_label = VALUES(sheet_label),
       extraction_method = VALUES(extraction_method),
       raw_text = VALUES(raw_text),
       scanned_by = VALUES(scanned_by),
       scanned_at = CURRENT_TIMESTAMP`,
    [
      noteId, ctx.apcPart, ctx.customerPart, ctx.customer,
      ctx.pdfPath, ctx.pdfName, ph, n.page || 1, n.zone || '',
      bbox[0] ?? null, bbox[1] ?? null, bbox[2] ?? null, bbox[3] ?? null,
      n.page_width ?? null, n.page_height ?? null,
      n.drawing_number || '', n.drawing_rev || '',
      n.drawing_rev_date || null, n.sheet_label || '',
      n.extraction_method || 'text', n.note_number || '', n.text, ctx.user,
    ]
  )

  return {
    note_code: noteCode, note_id: noteId, version_id: versionId, isNew,
    note_number: n.note_number, page: n.page, zone: n.zone, text: n.text,
  }
}

/**
 * Approve one aspect of a version, and promote it if both are now signed.
 *
 * Promotion is the moment the catalogue changes: the new version becomes
 * Active, whatever was Active becomes Inactive with an inactivated_at stamp,
 * and the master's pointer moves. The History tab is built from those stamps,
 * which is why they are written here rather than inferred later.
 */
export async function approveAspect(
  versionId: number,
  aspect: 'description' | 'how_to',
  user: string,
  comment = ''
): Promise<{ promoted: boolean; status: string }> {
  const vRows = await queryPrimary<any[]>(
    'SELECT id, note_id, status, version_no FROM drawing_note_versions WHERE id = ?',
    [versionId]
  )
  if (!vRows?.length) throw new Error('Version not found')
  const v = vRows[0]
  if (v.status === 'Inactive') {
    throw new Error('That version has already been superseded.')
  }

  await queryPrimary(
    `INSERT INTO drawing_note_approvals
       (version_id, note_id, aspect, approved_by, approved_at, comment)
     VALUES (?, ?, ?, ?, NOW(), ?)
     ON DUPLICATE KEY UPDATE
       approved_by = VALUES(approved_by),
       approved_at = VALUES(approved_at),
       comment = VALUES(comment)`,
    [versionId, v.note_id, aspect, user, comment]
  )

  const got = await queryPrimary<any[]>(
    'SELECT aspect FROM drawing_note_approvals WHERE version_id = ?',
    [versionId]
  )
  const aspects = new Set((got || []).map(r => String(r.aspect)))
  const complete = aspects.has('description') && aspects.has('how_to')

  if (!complete || v.status === 'Active') {
    return { promoted: false, status: v.status }
  }

  // Both signatures in — promote. Everything else for this note stands down.
  await queryPrimary(
    `UPDATE drawing_note_versions
        SET status = 'Inactive', inactivated_at = NOW(), superseded_by = ?
      WHERE note_id = ? AND id <> ? AND status = 'Active'`,
    [versionId, v.note_id, versionId]
  )
  await queryPrimary(
    `UPDATE drawing_note_versions
        SET status = 'Active', approved_at = NOW(), approved_by = ?
      WHERE id = ?`,
    [user, versionId]
  )
  await queryPrimary(
    `UPDATE drawing_notes
        SET active_version_id = ?,
            name = (SELECT name FROM drawing_note_versions WHERE id = ?)
      WHERE id = ?`,
    [versionId, versionId, v.note_id]
  )
  return { promoted: true, status: 'Active' }
}


/**
 * Drafting boilerplate that appears in nearly every note and therefore
 * distinguishes nothing. Left in, they drag unrelated notes up the ranking:
 * "SOLDERING SHALL BE IAW J-STD-001" and "WORKMANSHIP IAW IPC-610" share only
 * the word "iaw", which is enough to outrank a genuine match on raw overlap.
 */
const NOTE_STOPWORDS = new Set([
  'shall', 'be', 'the', 'of', 'and', 'with', 'in', 'accordance', 'iaw', 'per',
  'as', 'is', 'are', 'to', 'for', 'all', 'any', 'this', 'that', 'on', 'or',
  'from', 'by', 'not', 'required', 'requirements', 'used', 'using', 'shown',
  'where', 'which', 'each', 'other', 'than', 'have', 'has', 'been', 'may',
])

/**
 * Canonical form of a standard reference, so the same standard written two
 * ways collides.
 *
 *   IPC-610, IPC-A-610, IPC A 610   ->  ipc610
 *   J-STD-001, JSTD001              ->  jstd001
 *
 * Single-letter segments are dropped because they are revision or class
 * qualifiers that move independently of the standard being cited.
 */
function canonStandard(tok: string): string {
  if (!/^[a-z]+[a-z0-9-]*\d/.test(tok)) return tok
  const parts = tok.split('-').filter(p => p.length > 1 || /\d/.test(p))
  const joined = parts.join('')
  return /^[a-z]+\d/.test(joined) ? joined : tok
}

function noteTokens(text: string): Set<string> {
  const out = new Set<string>()
  for (const raw of normalizeNote(text).split(/[^a-z0-9.\-/]+/)) {
    if (raw.length < 3) continue
    const tok = canonStandard(raw.replace(/^[.\-/]+|[.\-/]+$/g, ''))
    if (tok.length < 3 || NOTE_STOPWORDS.has(tok)) continue
    out.add(tok)
  }
  return out
}

/**
 * How alike two notes read, 0..1. Used ONLY to shortlist candidates for a
 * human to group — never to merge anything.
 *
 * Exact-wording duplicates never reach this: they are already collapsed into a
 * single note by the text hash at scan time, which ignores the note number, so
 * note 9 on one drawing and note 12 on another saying the same thing are the
 * same record. What is left is the hard case — the same requirement worded
 * differently — and that is a judgement call, which is why the result is a
 * ranked list rather than an action.
 *
 * Cosine-style rather than Jaccard: a terse note and a verbose one can state
 * the same requirement, and dividing by the union punishes exactly that pair.
 * Dividing by the geometric mean keeps short-vs-long comparable without
 * letting a two-word note score 100% against everything.
 */
export function similarity(a: string, b: string): number {
  const A = noteTokens(a)
  const B = noteTokens(b)
  if (!A.size || !B.size) return 0
  let hits = 0
  for (const w of A) if (B.has(w)) hits++
  return hits / Math.sqrt(A.size * B.size)
}
