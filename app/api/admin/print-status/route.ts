import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL, executeMSSQL } from '@/lib/db/mssql'
import { windowsToLinuxPath } from '@/lib/config/drives'
import * as fs from 'fs'

// Connection names — env vars: DB_MSSQL_1_* (read), DB_MSSQL_ADMIN_* (write)
const READ_CONN = '1'
const ADMIN_CONN = 'ADMIN'

// ─── SQL Queries ────────────────────────────────────────────────

const BACKLOG_SQL = `
  SELECT 
    DATA0006.WORK_ORDER_NUMBER,
    DATA0050.CUSTOMER_PART_NUMBER,
    CASE 
      WHEN DATA0006.WORK_ORDER_NUMBER NOT LIKE '%-000' THEN D17_STD.INV_PART_NUMBER
      WHEN DATA0006.WORK_ORDER_NUMBER LIKE 'W%-000' THEN D17_ALT.INV_PART_NUMBER
      WHEN DATA0006.WORK_ORDER_NUMBER LIKE '%-000' THEN D17_BOM.INV_PART_NUMBER
    END AS INV_PART_NUMBER
  FROM DATA0006 WITH (NOLOCK)
  LEFT JOIN DATA0050 WITH (NOLOCK) ON DATA0006.CUST_PART_PTR = DATA0050.RKEY
  LEFT JOIN DATA0017 AS D17_STD WITH (NOLOCK) ON DATA0006.INVENTORY_PTR = D17_STD.RKEY
  LEFT JOIN DATA0025 AS BOM_STD WITH (NOLOCK) ON DATA0006.BOM_PTR = BOM_STD.RKEY
  LEFT JOIN DATA0017 AS D17_BOM WITH (NOLOCK) ON BOM_STD.INVENTORY_PTR = D17_BOM.RKEY
  LEFT JOIN DATA0025 AS BOM_ALT WITH (NOLOCK) ON DATA0050.BOM_PTR = BOM_ALT.RKEY
  LEFT JOIN DATA0017 AS D17_ALT WITH (NOLOCK) ON BOM_ALT.INVENTORY_PTR = D17_ALT.RKEY
  WHERE DATA0006.PROD_STATUS = '2'
  ORDER BY DATA0050.CUSTOMER_PART_NUMBER`

const ATTACHMENTS_SQL = `
  SELECT 
    d433.RKEY AS ATTACHMENT_RKEY,
    COALESCE(d17.INV_PART_NUMBER, d50.CUSTOMER_PART_NUMBER) AS ITEM,
    COALESCE(d17.INV_PART_DESCRIPTION, d50.CUSTOMER_PART_DESC) AS DESCRIPTION,
    d433.DOCUMENT_PATH, d433.PRINT_ON_TRAVELLER, d433.SOURCE_TYPE, d433.SOURCE_PTR
  FROM DATA0433 d433 WITH (NOLOCK)
  LEFT JOIN DATA0017 d17 WITH (NOLOCK) ON d433.SOURCE_TYPE = 17 AND d433.SOURCE_PTR = d17.RKEY
  LEFT JOIN DATA0050 d50 WITH (NOLOCK) ON d433.SOURCE_TYPE = 50 AND d433.SOURCE_PTR = d50.RKEY
  WHERE d433.PRINT_ON_TRAVELLER = 0
    AND (d17.RKEY IS NOT NULL OR d50.RKEY IS NOT NULL)
    AND COALESCE(d17.INV_PART_NUMBER, d50.CUSTOMER_PART_NUMBER) NOT LIKE 'Z%'
  ORDER BY ITEM`

const PREFIXES_SQL = `
  SELECT 
    LOWER(LEFT(DOCUMENT_PATH,
      NULLIF(CHARINDEX('attdocs', LOWER(DOCUMENT_PATH)), 0) + LEN('attdocs')
    )) AS PREFIX,
    COUNT(*) AS CNT
  FROM DATA0433
  WHERE LOWER(DOCUMENT_PATH) LIKE '%attdocs%'
  GROUP BY LOWER(LEFT(DOCUMENT_PATH,
    NULLIF(CHARINDEX('attdocs', LOWER(DOCUMENT_PATH)), 0) + LEN('attdocs')
  ))
  ORDER BY CNT DESC`

const FIXPATHS_SQL = `
  SELECT 
    d433.RKEY, 
    COALESCE(d17.INV_PART_NUMBER, d50.CUSTOMER_PART_NUMBER) AS ITEM,
    COALESCE(d17.INV_PART_DESCRIPTION, d50.CUSTOMER_PART_DESC) AS DESCRIPTION,
    d433.DOCUMENT_PATH, d433.SOURCE_TYPE, d433.SOURCE_PTR
  FROM DATA0433 d433 WITH (NOLOCK)
  LEFT JOIN DATA0017 d17 WITH (NOLOCK) ON d433.SOURCE_TYPE = 17 AND d433.SOURCE_PTR = d17.RKEY
  LEFT JOIN DATA0050 d50 WITH (NOLOCK) ON d433.SOURCE_TYPE = 50 AND d433.SOURCE_PTR = d50.RKEY
  WHERE LOWER(d433.DOCUMENT_PATH) LIKE LOWER(@prefix) + '%'
  ORDER BY ITEM`

// ─── GET ────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tab = searchParams.get('tab')

  try {
    if (tab === 'backlog') {
      const backlogRows = await queryMSSQL<any[]>(READ_CONN, BACKLOG_SQL)
      const attachRows = await queryMSSQL<any[]>(READ_CONN, ATTACHMENTS_SQL)

      const attMap: Record<string, any[]> = {}
      for (const att of attachRows) {
        const item = att.ITEM?.trim()
        if (item) { if (!attMap[item]) attMap[item] = []; attMap[item].push(att) }
      }

      const seen = new Set<number>()
      const results: any[] = []
      for (const row of backlogRows) {
        const part = row.CUSTOMER_PART_NUMBER?.trim()
        if (part && attMap[part]) {
          for (const att of attMap[part]) {
            if (!seen.has(att.ATTACHMENT_RKEY)) {
              seen.add(att.ATTACHMENT_RKEY)
              results.push({
                customerPartNumber: part,
                workOrder: row.WORK_ORDER_NUMBER?.trim(),
                invPartNumber: row.INV_PART_NUMBER?.trim(),
                attachmentRkey: att.ATTACHMENT_RKEY,
                documentPath: att.DOCUMENT_PATH?.trim(),
              })
            }
          }
        }
      }

      return NextResponse.json({
        success: true, tab: 'backlog',
        totalBacklog: backlogRows.length, totalAttachments: attachRows.length,
        count: results.length, data: results,
      })
    }

    if (tab === 'attachments') {
      const rows = await queryMSSQL<any[]>(READ_CONN, ATTACHMENTS_SQL)
      return NextResponse.json({
        success: true, tab: 'attachments', count: rows.length,
        data: rows.map(r => ({
          item: r.ITEM?.trim(), description: r.DESCRIPTION?.trim(),
          documentPath: r.DOCUMENT_PATH?.trim(), attachmentRkey: r.ATTACHMENT_RKEY,
          printOnTraveller: r.PRINT_ON_TRAVELLER,
          sourceType: r.SOURCE_TYPE, sourcePtr: r.SOURCE_PTR,
        })),
      })
    }

    if (tab === 'prefixes') {
      const rows = await queryMSSQL<any[]>(READ_CONN, PREFIXES_SQL)
      const prefixes = rows
        .filter(r => r.PREFIX)
        .map(r => ({
          prefix: r.PREFIX.replace(/[/\\]+$/, '') + '\\',
          count: r.CNT,
        }))
      return NextResponse.json({ success: true, prefixes })
    }

    if (tab === 'fixpaths') {
      const prefix = searchParams.get('prefix')
      const fromPrefix = searchParams.get('fromPrefix') || ''
      const toPrefix = searchParams.get('toPrefix') || ''
      if (!prefix) return NextResponse.json({ error: 'prefix required' }, { status: 400 })

      const rows = await queryMSSQL<any[]>(READ_CONN, FIXPATHS_SQL, { prefix: prefix.toLowerCase() })

      const fromLower = fromPrefix.toLowerCase()

      // Helper: resolve a path case-insensitively on the Linux filesystem.
      // Windows paths are case-insensitive but Linux isn't — walk each segment.
      function resolveCaseInsensitive(targetPath: string): string | null {
        const segments = targetPath.split('/').filter(Boolean)
        let current = '/'

        for (const seg of segments) {
          try {
            const entries = fs.readdirSync(current)
            const match = entries.find(e => e.toLowerCase() === seg.toLowerCase())
            if (!match) return null
            current = current === '/' ? `/${match}` : `${current}/${match}`
          } catch {
            return null
          }
        }
        return current
      }

      // Check if file/dir exists on the Linux mount (case-insensitive)
      function checkPath(winPath: string): 'found' | 'missing' | 'unmapped' {
        try {
          const linuxPath = windowsToLinuxPath(winPath)
          if (linuxPath === winPath) return 'unmapped'

          // Try exact match first (fast path)
          if (fs.existsSync(linuxPath)) return 'found'

          // Try case-insensitive resolution
          const resolved = resolveCaseInsensitive(linuxPath)
          if (resolved && fs.existsSync(resolved)) return 'found'

          return 'missing'
        } catch {
          return 'unmapped'
        }
      }

      const data = rows.map(r => {
        const oldPath = (r.DOCUMENT_PATH || '').trim().replace(/\//g, '\\')
        let newPath = oldPath
        if (fromPrefix && toPrefix && oldPath.toLowerCase().startsWith(fromLower)) {
          newPath = toPrefix + oldPath.substring(fromPrefix.length)
        }

        const oldStatus = checkPath(oldPath)
        const newStatus = (fromPrefix && toPrefix && oldPath !== newPath) ? checkPath(newPath) : null

        return {
          rkey: r.RKEY,
          item: r.ITEM?.trim(),
          description: r.DESCRIPTION?.trim(),
          documentPath: oldPath,
          newPath,
          sourceType: r.SOURCE_TYPE,
          sourcePtr: r.SOURCE_PTR,
          oldStatus,   // 'found' | 'missing' | 'unmapped'
          newStatus,   // 'found' | 'missing' | 'unmapped' | null
          changed: oldPath !== newPath,
        }
      })

      const summary = {
        total: data.length,
        oldFound: data.filter(d => d.oldStatus === 'found').length,
        oldMissing: data.filter(d => d.oldStatus === 'missing').length,
        oldUnmapped: data.filter(d => d.oldStatus === 'unmapped').length,
        newFound: data.filter(d => d.newStatus === 'found').length,
        newMissing: data.filter(d => d.newStatus === 'missing').length,
      }

      return NextResponse.json({
        success: true, tab: 'fixpaths', count: rows.length,
        data, summary,
      })
    }

    return NextResponse.json({ error: 'tab parameter required' }, { status: 400 })
  } catch (error) {
    console.error('Error in print-status:', error)
    return NextResponse.json({
      error: 'Failed to query Paradigm',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// ─── POST: Updates ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = (session.user as any)?.roles || []
  if (!roles.includes('Admin')) {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
  }

  try {
    const { action, rkeys, updates } = await request.json()

    if (action === 'updatePrintOnTraveller') {
      if (!rkeys?.length) return NextResponse.json({ error: 'rkeys required' }, { status: 400 })
      let total = 0
      for (const rkey of rkeys) {
        total += await executeMSSQL(ADMIN_CONN,
          'UPDATE DATA0433 SET PRINT_ON_TRAVELLER = 1 WHERE RKEY = @rkey', { rkey })
      }
      console.log(`Print update: ${total} rows by ${session.user?.name}. RKEYs: ${rkeys.join(',')}`)
      return NextResponse.json({ success: true, updated: total })
    }

    if (action === 'updatePaths') {
      // updates: [{ rkey, newPath }]
      if (!updates?.length) return NextResponse.json({ error: 'updates required' }, { status: 400 })
      let total = 0
      for (const { rkey, newPath } of updates) {
        total += await executeMSSQL(ADMIN_CONN,
          'UPDATE DATA0433 SET DOCUMENT_PATH = @newPath WHERE RKEY = @rkey',
          { rkey, newPath })
      }
      console.log(`Path update: ${total} rows by ${session.user?.name}`)
      return NextResponse.json({ success: true, updated: total })
    }

    if (action === 'findFiles') {
      const { items } = await request.clone().json()
      if (!items?.length) return NextResponse.json({ error: 'items required' }, { status: 400 })

      // Use the same fs module that works for resolveCaseInsensitive above
      // Walk directories with fs.readdirSync + fs.statSync (no withFileTypes, no child_process)
      function findInDir(dir: string, targetLower: string, maxDepth: number, results: string[]): void {
        if (maxDepth <= 0 || results.length >= 20) return
        let entries: string[]
        try {
          entries = fs.readdirSync(dir)
        } catch { return }

        for (const entry of entries) {
          if (results.length >= 20) return
          if (entry.startsWith('.')) continue
          const full = dir + '/' + entry
          try {
            const stat = fs.statSync(full)
            if (stat.isFile() && entry.toLowerCase() === targetLower) {
              results.push(full)
            } else if (stat.isDirectory()) {
              findInDir(full, targetLower, maxDepth - 1, results)
            }
          } catch { /* permission denied — skip */ }
        }
      }

      const allResults: Record<number, string[]> = {}
      const diagnostics: string[] = []

      // Quick sanity check
      try {
        const testEntries = fs.readdirSync('/mnt/sdrive')
        diagnostics.push(`/mnt/sdrive readable: ${testEntries.length} entries`)
      } catch (e) {
        diagnostics.push(`/mnt/sdrive NOT readable: ${e}`)
      }

      for (const item of items) {
        const docPath = (item.documentPath || '').trim()
        const fileName = docPath.replace(/^.*[/\\]/, '').replace(/[\x00-\x1f]+$/g, '').trim()
        if (!fileName) {
          allResults[item.rkey] = []
          diagnostics.push(`RKEY ${item.rkey}: empty filename from "${docPath}"`)
          continue
        }

        diagnostics.push(`RKEY ${item.rkey}: searching for "${fileName}"`)
        const found: string[] = []
        findInDir('/mnt/sdrive', fileName.toLowerCase(), 10, found)
        allResults[item.rkey] = found
        diagnostics.push(`RKEY ${item.rkey}: found ${found.length} match(es)`)
      }

      return NextResponse.json({ success: true, results: allResults, diagnostics })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating:', error)
    return NextResponse.json({
      error: 'Failed to update',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
