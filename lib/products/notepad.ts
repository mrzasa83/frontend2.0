/**
 * Paradigm notepad text.
 *
 * Notes live in DATA0011, keyed by FILE_POINTER = the owning record's RKEY with
 * SOURCE_TYPE identifying which table that RKEY belongs to (17 = DATA0017
 * inventory). The text is split across fixed-width NOTE_PAD_LINE_n columns, so
 * a row is selected wholesale and the lines reassembled in column order —
 * that way the number of line columns never has to be hard-coded.
 *
 * Extracted from app/api/ehs/parts/detail/route.ts so the buy-material list can
 * pull notes for a whole BOM without duplicating the reassembly rules.
 */

/** One part's notepad rows. */
export const NOTEPAD_SQL = `
  SELECT * FROM DATA0011 WITH (NOLOCK)
  WHERE FILE_POINTER = @rkey AND SOURCE_TYPE = 17
  ORDER BY RKEY`

/**
 * Notepad rows for many parts at once, keyed by RKEY.
 *
 * The EHS picker deliberately avoids a correlated FOR XML PATH across the whole
 * notepad table because it's far too slow behind a type-ahead. This is the
 * other case: a bounded set of RKEYs from one BOM, so a plain IN list over an
 * indexed FILE_POINTER is cheap. FILE_POINTER is selected explicitly alongside
 * the wildcard so the caller can group rows without depending on column order.
 */
export function notepadBatchSql(rkeyParams: string[]): string {
  return `
    SELECT FILE_POINTER AS __owner_rkey, *
    FROM DATA0011 WITH (NOLOCK)
    WHERE SOURCE_TYPE = 17 AND FILE_POINTER IN (${rkeyParams.join(', ')})
    ORDER BY FILE_POINTER, RKEY`
}

/**
 * Reassemble a note from a DATA0011 row set.
 *
 * Each row holds NOTE_PAD_LINE_1..n of char(70) — space-padded, and Paradigm
 * will break mid-word at the 70-character boundary. Lines are right-trimmed and
 * joined in numeric column order; trailing blank lines are dropped, but blank
 * lines in the middle are kept since they're part of the author's layout.
 */
export function assembleNotepad(rows: any[]): string {
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

/** Group batched notepad rows by owner RKEY and assemble each one. */
export function assembleNotepadByRkey(rows: any[]): Map<string, string> {
  const grouped = new Map<string, any[]>()
  for (const row of rows || []) {
    const key = String(row.__owner_rkey ?? row.FILE_POINTER ?? '').trim()
    if (!key) continue
    const list = grouped.get(key)
    if (list) list.push(row)
    else grouped.set(key, [row])
  }
  const out = new Map<string, string>()
  for (const [rkey, group] of grouped) out.set(rkey, assembleNotepad(group))
  return out
}
