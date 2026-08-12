import { NextRequest, NextResponse } from 'next/server'
import { sendMESMessage, checkMESConnection, sendPrintJob, sendProductionData } from '@/lib/mes-client'

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    // MES Configuration from environment
    const mesConfig = {
      host: process.env.MES_HOST || 'localhost',
      port: parseInt(process.env.MES_PORT || '5000'),
      senderId: process.env.MES_SENDER_ID || 'MDI Image Assist',
      receiverId: process.env.MES_RECEIVER_ID || 'MES Server',
      timeout: parseInt(process.env.MES_TIMEOUT || '30000'),
    }

    let result: any

    switch (action) {
      case 'check_connection':
        result = await checkMESConnection(mesConfig)
        return NextResponse.json({
          success: result.available,
          available: result.available,
          error: result.error,
          timestamp: new Date().toISOString(),
        })

      case 'send_print_job':
        result = await sendPrintJob(mesConfig, data)
        break

      case 'send_production_data':
        result = await sendProductionData(mesConfig, data)
        break

      case 'send_custom':
        result = await sendMESMessage(mesConfig, data)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: check_connection, send_print_job, send_production_data, send_custom' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: result.success || false,
      ...result,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('MES API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Simple status check endpoint
  const mesConfig = {
    host: process.env.MES_HOST || 'localhost',
    port: parseInt(process.env.MES_PORT || '5000'),
    senderId: process.env.MES_SENDER_ID || 'MDI Image Assist',
    receiverId: process.env.MES_RECEIVER_ID || 'MES Server',
    timeout: parseInt(process.env.MES_TIMEOUT || '30000'),
  }

  try {
    const result = await checkMESConnection(mesConfig)
    
    return NextResponse.json({
      configured: true,
      host: mesConfig.host,
      port: mesConfig.port,
      available: result.available,
      error: result.error,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      configured: true,
      host: mesConfig.host,
      port: mesConfig.port,
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
}
