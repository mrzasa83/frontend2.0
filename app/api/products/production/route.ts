import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { apcPN } = await request.json()

    if (!apcPN) {
      return NextResponse.json(
        { error: 'apcPN is required' },
        { status: 400 }
      )
    }

    // Check if part number starts with Z - indicates Obsolete
    const isObsolete = apcPN.toUpperCase().startsWith('Z')
    
    // For Z parts, search without the Z prefix as well
    const searchPattern = isObsolete ? apcPN.substring(1) : apcPN

    // Query Paradigm MS SQL database
    const query = `
      SELECT * 
      FROM DATA0050 
      WHERE CUSTOMER_PART_NUMBER LIKE @partNumber
      ORDER BY CUSTOMER_PART_NUMBER
    `

    const results = await queryMSSQL('1', query, {
      partNumber: `${searchPattern}%`
    })

    // Extract status from the first result's CUSTOMER_PART_NUMBER
    // Format: "12754 X" where X is status character at position 7 (index 6)
    // If blank or no character, status is "Released"
    // If part starts with Z, status is "Obsolete"
    let status = 'Released'
    
    if (isObsolete) {
      status = 'Obsolete'
    } else if (results.length > 0) {
      const custPN = results[0].CUSTOMER_PART_NUMBER || ''
      // Check if there's a character after the 5 digits and space (position 6+)
      if (custPN.length > 6) {
        const statusChar = custPN.substring(6).trim()
        if (statusChar) {
          status = statusChar
        }
      }
    }

    return NextResponse.json({
      success: true,
      apcPN,
      count: results.length,
      data: results,
      status
    })
  } catch (error) {
    console.error('Error fetching production data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch production data', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
