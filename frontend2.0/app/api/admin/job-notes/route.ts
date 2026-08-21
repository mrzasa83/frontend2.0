import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { querySecondary } from '@/lib/db/mysql-secondary'

// Helper to parse date from day/month/year columns
function parseDate(day: string | null, month: string | null, year: string | null): string | null {
  if (!day || !month || !year) return null
  
  const monthMap: Record<string, string> = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  }
  
  const monthNum = monthMap[month] || month
  const dayPadded = day.toString().padStart(2, '0')
  
  return `${year}-${monthNum}-${dayPadded}`
}

// Helper to extract date or "Complete" from notes field
// Looks for patterns like [CAM: 10/10/2025] or [CAM: Complete]
function extractDateFromNotes(notes: string, tag: string): { date: string | null; complete: boolean } {
  if (!notes) return { date: null, complete: false }
  
  // Match pattern like [TAG: value] or [TAG:value]
  const regex = new RegExp(`\\[${tag}:\\s*([^\\]]+)\\]`, 'i')
  const match = notes.match(regex)
  
  if (!match) return { date: null, complete: false }
  
  const value = match[1].trim()
  
  if (value.toLowerCase() === 'complete') {
    return { date: null, complete: true }
  }
  
  // Try to parse as date (MM/DD/YYYY format)
  const dateMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (dateMatch) {
    const [, month, day, year] = dateMatch
    return {
      date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
      complete: false
    }
  }
  
  return { date: null, complete: false }
}

// Helper to extract section text and hold info from notes
// Looks for [TAG] followed by text until the next [TAG] or end
// Also parses [Owner: X; Target: Y; Action: Z] within the section
// And parses [On Hold: date] and [Days On Hold: X]
function extractSectionFromNotes(notes: string, tag: string): {
  text: string
  hasHold: boolean
  owner: string | null
  target: string | null
  action: string | null
  onHoldDate: string | null
  daysOnHold: number
} {
  if (!notes) return { text: '', hasHold: false, owner: null, target: null, action: null, onHoldDate: null, daysOnHold: 0 }
  
  // Find the section starting with [TAG]
  const sectionRegex = new RegExp(`\\[${tag}\\]\\s*([\\s\\S]*?)(?=\\n\\[(?!Owner|On Hold|Days On Hold)|$)`, 'i')
  const sectionMatch = notes.match(sectionRegex)
  
  if (!sectionMatch) return { text: '', hasHold: false, owner: null, target: null, action: null, onHoldDate: null, daysOnHold: 0 }
  
  let sectionText = sectionMatch[1].trim()
  
  // Check for hold information: [Owner: X; Target: Y; Action: Z]
  const holdRegex = /\[Owner:\s*([^;]+);\s*Target:\s*([^;]+);\s*Action:\s*([^\]]+)\]/i
  const holdMatch = sectionText.match(holdRegex)
  
  let owner: string | null = null
  let target: string | null = null
  let action: string | null = null
  let hasHold = false
  
  if (holdMatch) {
    hasHold = true
    owner = holdMatch[1].trim()
    
    // Parse target date (MM/DD/YYYY format)
    const targetStr = holdMatch[2].trim()
    const targetDateMatch = targetStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (targetDateMatch) {
      const [, month, day, year] = targetDateMatch
      target = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    
    action = holdMatch[3].trim()
    
    // Remove the hold bracket from the text for cleaner display
    sectionText = sectionText.replace(holdRegex, '').trim()
  }
  
  // Parse [On Hold: MM/DD/YYYY]
  let onHoldDate: string | null = null
  const onHoldRegex = /\[On Hold:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\]/i
  const onHoldMatch = sectionText.match(onHoldRegex)
  if (onHoldMatch) {
    const [, month, day, year] = onHoldMatch
    onHoldDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    sectionText = sectionText.replace(onHoldRegex, '').trim()
  }
  
  // Parse [Days On Hold: X]
  let daysOnHold = 0
  const daysOnHoldRegex = /\[Days On Hold:\s*(\d+)\]/i
  const daysOnHoldMatch = sectionText.match(daysOnHoldRegex)
  if (daysOnHoldMatch) {
    daysOnHold = parseInt(daysOnHoldMatch[1], 10)
    sectionText = sectionText.replace(daysOnHoldRegex, '').trim()
  }
  
  // Clean up the text - remove extra whitespace and newlines
  sectionText = sectionText.replace(/\s+/g, ' ').trim()
  
  return { text: sectionText, hasHold, owner, target, action, onHoldDate, daysOnHold }
}

export type JobStatusNote = {
  id: number
  job_id: number
  timestamp: number
  timestampFormatted: string
  notes: string
  hdw_date: string | null
  bom_date: string | null
  cam_date: string | null
  cam_complete: boolean
  rev_date: string | null
  rev_complete: boolean
  prl_date: string | null  // PCB Week
  arl_date: string | null  // ASM Week
  // Section text and hold info
  hdw_text: string
  hdw_hold: { hasHold: boolean; owner: string | null; target: string | null; action: string | null; onHoldDate: string | null; daysOnHold: number }
  pcb_text: string
  pcb_hold: { hasHold: boolean; owner: string | null; target: string | null; action: string | null; onHoldDate: string | null; daysOnHold: number }
  asm_text: string
  asm_hold: { hasHold: boolean; owner: string | null; target: string | null; action: string | null; onHoldDate: string | null; daysOnHold: number }
}

// GET - Fetch job status notes by job name
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const jobName = searchParams.get('jobName')

    if (!jobName) {
      return NextResponse.json(
        { error: 'jobName parameter is required' },
        { status: 400 }
      )
    }

    const query = `
      SELECT 
        umj.id,
        umj.job_id,
        umj.notes,
        umj.time_stamp,
        umj.hdw_comp_day,
        umj.hdw_comp_month,
        umj.hdw_comp_year,
        umj.bom_comp_day,
        umj.bom_comp_month,
        umj.bom_comp_year,
        umj.pcb_comp_day,
        umj.pcb_comp_month,
        umj.pcb_comp_year,
        umj.asm_comp_day,
        umj.asm_comp_month,
        umj.asm_comp_year
      FROM job 
      JOIN umr_job_status_notes umj ON job.id = umj.job_id
      WHERE job.name = ?
      ORDER BY umj.time_stamp DESC
    `

    const results = await querySecondary(query, [jobName])

    // Transform results
    const notes: JobStatusNote[] = (results as any[]).map(row => {
      const cam = extractDateFromNotes(row.notes, 'CAM')
      const rev = extractDateFromNotes(row.notes, 'Rev')
      
      // Extract section text and hold info
      const hdwSection = extractSectionFromNotes(row.notes, 'HDW')
      const pcbSection = extractSectionFromNotes(row.notes, 'PCB')
      const asmSection = extractSectionFromNotes(row.notes, 'ASM')
      
      // Format timestamp
      const timestampMs = row.time_stamp * 1000
      const timestampDate = new Date(timestampMs)
      const timestampFormatted = timestampDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      return {
        id: row.id,
        job_id: row.job_id,
        timestamp: row.time_stamp,
        timestampFormatted,
        notes: row.notes || '',
        hdw_date: parseDate(row.hdw_comp_day, row.hdw_comp_month, row.hdw_comp_year),
        bom_date: parseDate(row.bom_comp_day, row.bom_comp_month, row.bom_comp_year),
        cam_date: cam.date,
        cam_complete: cam.complete,
        rev_date: rev.date,
        rev_complete: rev.complete,
        prl_date: parseDate(row.pcb_comp_day, row.pcb_comp_month, row.pcb_comp_year),
        arl_date: parseDate(row.asm_comp_day, row.asm_comp_month, row.asm_comp_year),
        hdw_text: hdwSection.text,
        hdw_hold: { hasHold: hdwSection.hasHold, owner: hdwSection.owner, target: hdwSection.target, action: hdwSection.action, onHoldDate: hdwSection.onHoldDate, daysOnHold: hdwSection.daysOnHold },
        pcb_text: pcbSection.text,
        pcb_hold: { hasHold: pcbSection.hasHold, owner: pcbSection.owner, target: pcbSection.target, action: pcbSection.action, onHoldDate: pcbSection.onHoldDate, daysOnHold: pcbSection.daysOnHold },
        asm_text: asmSection.text,
        asm_hold: { hasHold: asmSection.hasHold, owner: asmSection.owner, target: asmSection.target, action: asmSection.action, onHoldDate: asmSection.onHoldDate, daysOnHold: asmSection.daysOnHold },
      }
    })

    return NextResponse.json({
      success: true,
      jobName,
      count: notes.length,
      notes
    })

  } catch (error) {
    console.error('Job Notes API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch job notes', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

// POST - Create new job status note (for future use)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { 
      jobName, 
      notes,
      hdw_date,
      bom_date,
      prl_date,
      arl_date
    } = body

    if (!jobName) {
      return NextResponse.json(
        { error: 'jobName is required' },
        { status: 400 }
      )
    }

    // First get the job_id
    const jobQuery = `SELECT id FROM job WHERE name = ? LIMIT 1`
    const jobResults = await querySecondary(jobQuery, [jobName]) as any[]
    
    if (jobResults.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    const jobId = jobResults[0].id

    // Parse dates into day/month/year
    const parseDateParts = (dateStr: string | null) => {
      if (!dateStr) return { day: null, month: null, year: null }
      const date = new Date(dateStr)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return {
        day: date.getDate().toString().padStart(2, '0'),
        month: months[date.getMonth()],
        year: date.getFullYear().toString()
      }
    }

    const hdw = parseDateParts(hdw_date)
    const bom = parseDateParts(bom_date)
    const prl = parseDateParts(prl_date)
    const arl = parseDateParts(arl_date)

    const insertQuery = `
      INSERT INTO umr_job_status_notes (
        job_id, notes, time_stamp,
        hdw_comp_day, hdw_comp_month, hdw_comp_year,
        bom_comp_day, bom_comp_month, bom_comp_year,
        pcb_comp_day, pcb_comp_month, pcb_comp_year,
        asm_comp_day, asm_comp_month, asm_comp_year
      ) VALUES (?, ?, UNIX_TIMESTAMP(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    await querySecondary(insertQuery, [
      jobId,
      notes || '',
      hdw.day, hdw.month, hdw.year,
      bom.day, bom.month, bom.year,
      prl.day, prl.month, prl.year,
      arl.day, arl.month, arl.year
    ])

    return NextResponse.json({
      success: true,
      message: 'Job status note created'
    })

  } catch (error) {
    console.error('Job Notes POST Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create job note', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
