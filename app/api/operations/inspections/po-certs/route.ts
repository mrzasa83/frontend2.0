import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { PO_ROOT, parsePoFilename, normCust } from '@/lib/certs/poParser'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const MAX_DEPTH = 6

type FileRow = {
  apcPart: string
  customerPart: string
  version: string
  versionRank: number | null
  fileName: string
  filePath: string
  folder: string        // top-level PO folder this file lives under
  relDir: string        // sub-path within the folder ('' if directly inside)
  parsed: boolean
}

// Recursively collect PDFs under a directory.
async function walkPdfs(dir: string, depth: number, out: string[]) {
  if (depth > MAX_DEPTH) return
  let entries: any[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch { return }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) await walkPdfs(full, depth + 1, out)
    else if (e.isFile() && e.name.toLowerCase().endsWith('.pdf')) out.push(full)
  }
}

// Resolve which top-level PO folders to search for a given FAI customer.
// 1. Explicit admin mapping (paradigm_customer -> po_folder)
// 2. Loose fallback: folder name norm- contains / is-contained-by the customer
async function resolveFolders(customer: string): Promise<{ folders: string[]; usedMapping: boolean }> {
  const cust = (customer || '').trim()
  if (!cust) return { folders: [], usedMapping: false }

  // 1. Mapping
  try {
    const rows = await queryPrimary(
      'SELECT po_folder FROM po_customer_mapping WHERE paradigm_customer = ?',
      [cust]
    )
    if (rows?.length) return { folders: rows.map((r: any) => r.po_folder), usedMapping: true }
  } catch { /* table may not exist yet */ }

  // 2. Loose fallback against the real folder list
  try {
    const entries = await fs.readdir(PO_ROOT(), { withFileTypes: true })
    const nc = normCust(cust)
    const matches = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .filter(name => {
        const nf = normCust(name)
        if (!nf || !nc) return false
        return nf.includes(nc) || nc.includes(nf)
      })
    return { folders: matches, usedMapping: false }
  } catch {
    return { folders: [], usedMapping: false }
  }
}

function isUnderRoot(p: string): boolean {
  const resolved = path.resolve(p)
  return resolved === path.resolve(PO_ROOT()) || resolved.startsWith(path.resolve(PO_ROOT()) + path.sep)
}

// GET ?customer=NORTBALT[&folder=NGC][&part=76272]
//   Lists parsed PO cert files. If `folder` given, restrict to that one folder;
//   otherwise use the customer mapping / loose fallback.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const customer = searchParams.get('customer') || ''
  const explicitFolder = searchParams.get('folder') || ''
  const partFilter = (searchParams.get('part') || '').trim()

  try {
    let folders: string[]
    let usedMapping = false
    if (explicitFolder) {
      folders = [explicitFolder]
    } else {
      const r = await resolveFolders(customer)
      folders = r.folders
      usedMapping = r.usedMapping
    }

    if (!folders.length) {
      return NextResponse.json({ success: true, files: [], folders: [], usedMapping, note: 'No PO folder resolved for this customer' })
    }

    const rows: FileRow[] = []
    for (const folder of folders) {
      const folderPath = path.join(PO_ROOT(), folder)
      if (!isUnderRoot(folderPath)) continue
      const pdfs: string[] = []
      await walkPdfs(folderPath, 0, pdfs)
      for (const full of pdfs) {
        const fileName = path.basename(full)
        const parsed = parsePoFilename(fileName)
        const relDir = path.relative(folderPath, path.dirname(full))
        if (!parsed.parsed) {
          // keep unparseable ones as a single row (no apc part) so nothing is hidden
          rows.push({
            apcPart: '', customerPart: parsed.customerPart, version: parsed.version,
            versionRank: parsed.versionRank, fileName, filePath: full, folder, relDir, parsed: false,
          })
          continue
        }
        // Break out each APC part into its own row (several parts on one PO)
        for (const apc of parsed.apcParts) {
          rows.push({
            apcPart: apc, customerPart: parsed.customerPart, version: parsed.version,
            versionRank: parsed.versionRank, fileName, filePath: full, folder, relDir, parsed: true,
          })
        }
      }
    }

    // Optional server-side part pre-filter (the FAI part number)
    const filtered = partFilter
      ? rows.filter(r => r.apcPart.includes(partFilter) || r.customerPart.toUpperCase().includes(partFilter.toUpperCase()))
      : rows

    return NextResponse.json({ success: true, files: filtered, folders, usedMapping })
  } catch (error) {
    console.error('PO cert files error:', error)
    return NextResponse.json({
      error: 'Failed to list PO certs',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
