# Schmoll MES Interface Integration

This application integrates with Schmoll MES-compatible systems using XML messages over TCP/IP.

## Configuration

Add the following to your `.env.local` file:

```env
# MES / Printer Configuration
MES_HOST=192.168.1.100          # IP address of MES server or printer
MES_PORT=5000                    # TCP port (default 5000)
MES_SENDER_ID=MDI Image Assist  # Sender identifier
MES_RECEIVER_ID=MES Server       # Receiver identifier (or printer name)
MES_TIMEOUT=30000                # Connection timeout in milliseconds
```

## Message Format

The Schmoll MES Interface uses XML messages with the following structure:

```xml
<?xml version="1.0" encoding="utf-8"?>
<schmoll_mes_message version="1">
  <cmd_type>Write</cmd_type>
  <cmd_id>directimaging.Job</cmd_id>
  <cmd_variant>0</cmd_variant>
  <msg_id>1234567890</msg_id>
  <sender_id>MDI Image Assist</sender_id>
  <receiver_id>MES Server</receiver_id>
  <msg_timestamp>2025-01-23T18:30:01.200+01:00</msg_timestamp>
  <data_timestamp>2025-01-23T18:30:00.000+01:00</data_timestamp>
  <data>
    <!-- Command-specific data here -->
  </data>
</schmoll_mes_message>
```

## Available Commands

### Check Connection
```typescript
GET /api/mes
```

Returns MES configuration and connection status.

### Send Custom Message
```typescript
POST /api/mes
{
  "action": "send_custom",
  "data": {
    "cmdType": "Write",
    "cmdId": "AliveCheck",
    "msgId": "123456",
    "data": {}
  }
}
```

### Send Print Job
```typescript
POST /api/mes
{
  "action": "send_print_job",
  "data": {
    "fileName": "L-75522-06_07.txt",
    "partNumber": "L-75522-06/07",
    "workOrder": "XX-123456",
    "operator": "12345"
  }
}
```

### Send Production Data
```typescript
POST /api/mes
{
  "action": "send_production_data",
  "data": {
    "workOrder": "XX-123456",
    "partNumber": "L-75522-06/07",
    "operator": "12345",
    "routeSteps": [...]
  }
}
```

## Command Types

- `Write` - Send data to MES/Printer
- `Read` - Request data from MES/Printer
- `WriteReply` - Response to a Write command
- `ReadReply` - Response to a Read command
- `Event` - Asynchronous event notification

## Common Command IDs

- `AliveCheck` - Connection health check
- `directimaging.Job` - Print job submission
- `directimaging.PartProductionData` - Production data reporting
- `directimaging.Status` - Status inquiry
- `MachineLogin` - Machine login to MES
- `UserLogin` - Operator login

## Network Topology

The system supports:
- **Vertical communication**: Machine ↔ MES Server
- **Horizontal communication**: Machine ↔ Machine (peer-to-peer)

## Testing

### Test Connection
```bash
curl http://localhost:4221/api/mes
```

### Send Test Message
```bash
curl -X POST http://localhost:4221/api/mes \
  -H "Content-Type: application/json" \
  -d '{
    "action": "check_connection"
  }'
```

## Protocol Details

- Transport: TCP/IP
- Port: Configurable (default 5000)
- Format: XML 1.0, UTF-8 encoding
- Message delimiter: Newline (`\n`)
- Timeout: Configurable (default 30 seconds)
- Message complete indicator: `</schmoll_mes_message>`

## Reference

Based on "Schmoll MES Interface" documentation version August 13, 2025.
See: `2025_08_13-MDI_MES_manual.pdf`
