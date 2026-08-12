/**
 * Schmoll MES Interface API Integration
 * 
 * This module handles communication with Schmoll MES-compatible systems
 * using XML messages over TCP/IP
 */

import net from 'net'

export interface MESConfig {
  host: string
  port: number
  senderId: string  // e.g., "MDI Image Assist"
  receiverId: string  // e.g., "MES Server" or printer name
  timeout?: number  // milliseconds, default 30000
}

export interface MESMessage {
  cmdType: 'Write' | 'Read' | 'WriteReply' | 'ReadReply' | 'Event'
  cmdId: string
  cmdVariant?: number
  msgId: string
  msgResult?: string
  data: any
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

/**
 * Get current timestamp in ISO 8601 format with timezone
 */
function getCurrentTimestamp(): string {
  const now = new Date()
  const offset = -now.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const absOffset = Math.abs(offset)
  const hours = String(Math.floor(absOffset / 60)).padStart(2, '0')
  const minutes = String(absOffset % 60).padStart(2, '0')
  
  return now.toISOString().replace('Z', `${sign}${hours}:${minutes}`)
}

/**
 * Build XML message for Schmoll MES Interface
 */
function buildXMLMessage(
  config: MESConfig,
  message: MESMessage
): string {
  const timestamp = getCurrentTimestamp()
  
  let xml = '<?xml version="1.0" encoding="utf-8"?>\n'
  xml += '<schmoll_mes_message version="1">\n'
  xml += `  <cmd_type>${message.cmdType}</cmd_type>\n`
  xml += `  <cmd_id>${message.cmdId}</cmd_id>\n`
  xml += `  <cmd_variant>${message.cmdVariant || 0}</cmd_variant>\n`
  xml += `  <msg_id>${message.msgId}</msg_id>\n`
  
  if (message.msgResult) {
    xml += `  <msg_result>${message.msgResult}</msg_result>\n`
  }
  
  xml += `  <sender_id>${config.senderId}</sender_id>\n`
  xml += `  <receiver_id>${config.receiverId}</receiver_id>\n`
  xml += `  <msg_timestamp>${timestamp}</msg_timestamp>\n`
  xml += `  <data_timestamp>${timestamp}</data_timestamp>\n`
  xml += '  <data>\n'
  
  // Add data payload
  if (typeof message.data === 'string') {
    xml += message.data
  } else if (typeof message.data === 'object') {
    // Convert object to XML elements
    for (const [key, value] of Object.entries(message.data)) {
      xml += `    <${key}>${value}</${key}>\n`
    }
  }
  
  xml += '  </data>\n'
  xml += '</schmoll_mes_message>'
  
  return xml
}

/**
 * Send a message to the MES system via TCP
 */
export async function sendMESMessage(
  config: MESConfig,
  message: MESMessage
): Promise<{ success: boolean; response?: string; error?: string }> {
  return new Promise((resolve) => {
    const timeout = config.timeout || 30000
    const client = new net.Socket()
    let timeoutHandle: NodeJS.Timeout
    let responseData = ''

    // Generate message ID if not provided
    if (!message.msgId) {
      message.msgId = generateMessageId()
    }

    // Build XML message
    const xmlMessage = buildXMLMessage(config, message)
    
    console.log('=== MES MESSAGE SEND ===')
    console.log(`Host: ${config.host}:${config.port}`)
    console.log(`Message ID: ${message.msgId}`)
    console.log(`Command: ${message.cmdId}`)
    console.log('XML Message:')
    console.log(xmlMessage)
    console.log('========================')

    // Set timeout
    timeoutHandle = setTimeout(() => {
      client.destroy()
      resolve({
        success: false,
        error: 'Connection timeout'
      })
    }, timeout)

    // Handle connection
    client.connect(config.port, config.host, () => {
      console.log('Connected to MES server')
      
      // Send the XML message
      client.write(xmlMessage + '\n')
    })

    // Handle incoming data
    client.on('data', (data) => {
      responseData += data.toString()
      
      // Check if we have a complete XML message (ends with closing tag)
      if (responseData.includes('</schmoll_mes_message>')) {
        clearTimeout(timeoutHandle)
        client.destroy()
        
        console.log('=== MES RESPONSE ===')
        console.log(responseData)
        console.log('====================')
        
        resolve({
          success: true,
          response: responseData
        })
      }
    })

    // Handle errors
    client.on('error', (err) => {
      clearTimeout(timeoutHandle)
      console.error('MES connection error:', err)
      resolve({
        success: false,
        error: err.message
      })
    })

    // Handle close
    client.on('close', () => {
      clearTimeout(timeoutHandle)
      if (!responseData) {
        resolve({
          success: false,
          error: 'Connection closed without response'
        })
      }
    })
  })
}

/**
 * Send a print job command to the MES/Printer
 */
export async function sendPrintJob(
  config: MESConfig,
  jobData: {
    fileName?: string
    filePath?: string
    partNumber?: string
    workOrder?: string
    operator?: string
    [key: string]: any
  }
): Promise<{ success: boolean; response?: string; error?: string }> {
  
  // Build the print job message
  const message: MESMessage = {
    cmdType: 'Write',
    cmdId: 'directimaging.Job',  // Adjust based on actual command needed
    msgId: generateMessageId(),
    data: jobData
  }

  return sendMESMessage(config, message)
}

/**
 * Check MES connection with AliveCheck
 */
export async function checkMESConnection(
  config: MESConfig
): Promise<{ available: boolean; error?: string }> {
  const message: MESMessage = {
    cmdType: 'Read',
    cmdId: 'AliveCheck',
    msgId: generateMessageId(),
    data: {}
  }

  const result = await sendMESMessage(config, message)
  
  return {
    available: result.success,
    error: result.error
  }
}

/**
 * Send production data to MES
 */
export async function sendProductionData(
  config: MESConfig,
  productionData: {
    workOrder: string
    partNumber: string
    operator: string
    routeSteps: any[]
    [key: string]: any
  }
): Promise<{ success: boolean; response?: string; error?: string }> {
  
  const message: MESMessage = {
    cmdType: 'Write',
    cmdId: 'directimaging.PartProductionData',
    msgId: generateMessageId(),
    data: productionData
  }

  return sendMESMessage(config, message)
}
