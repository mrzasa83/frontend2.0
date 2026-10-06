import { deflateRawSync, crc32 } from 'zlib'

/**
 * A minimal ZIP writer, because the project has no archive dependency and
 * adding one for this is more surface than the format needs.
 *
 * Writes a classic (non-ZIP64) archive: one local header per entry, then the
 * central directory, then the end-of-central-directory record. PDFs are
 * already compressed, so entries are STOREd unless deflating actually wins.
 *
 * ZIP64 is NOT implemented, so this refuses an archive that would exceed the
 * 4 GB / 65,535-entry limits rather than writing a file that looks fine and
 * unpacks wrong. A certificate pack is nowhere near either, and a silent
 * truncation in a quality submission is the kind of failure nobody catches
 * until an auditor does.
 */

export type ZipEntry = { name: string; data: Buffer }

const MAX_ENTRIES = 0xffff
const MAX_BYTES = 0xffffffff

/** zlib exposes crc32 from Node 20.12; fall back to a table if it is absent. */
let crcTable: Uint32Array | null = null
function crc32Fallback(buf: Buffer): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      crcTable[i] = c >>> 0
    }
  }
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const checksum = (buf: Buffer): number =>
  typeof crc32 === 'function' ? (crc32(buf) >>> 0) : crc32Fallback(buf)

/**
 * Makes entry names unique and safe. Two certs can legitimately share a file
 * name (same lot, different folder); without this the second would silently
 * overwrite the first on extraction.
 */
export function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>()
  return names.map(raw => {
    const clean = (raw || 'file')
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/^\.+/, '')
      .slice(0, 180) || 'file'
    const n = seen.get(clean.toLowerCase()) ?? 0
    seen.set(clean.toLowerCase(), n + 1)
    if (n === 0) return clean
    const dot = clean.lastIndexOf('.')
    return dot > 0
      ? `${clean.slice(0, dot)} (${n + 1})${clean.slice(dot)}`
      : `${clean} (${n + 1})`
  })
}

export function buildZip(entries: ZipEntry[]): Buffer {
  if (entries.length > MAX_ENTRIES) {
    throw new Error(`Too many files for a ZIP (${entries.length}); limit is ${MAX_ENTRIES}`)
  }

  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0

  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, 'utf8')
    const crc = checksum(e.data)

    // Try deflate, keep it only if it actually helps. PDFs usually don't.
    let method = 0
    let payload = e.data
    try {
      const deflated = deflateRawSync(e.data)
      if (deflated.length < e.data.length) { method = 8; payload = deflated }
    } catch { /* STORE is always valid */ }

    if (offset + payload.length > MAX_BYTES) {
      throw new Error('Archive would exceed 4 GB; ZIP64 is not implemented')
    }

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)            // version needed
    local.writeUInt16LE(0x0800, 6)        // UTF-8 name flag
    local.writeUInt16LE(method, 8)
    local.writeUInt16LE(0, 10)            // mod time
    local.writeUInt16LE(0, 12)            // mod date
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(payload.length, 18)
    local.writeUInt32LE(e.data.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28)
    locals.push(local, nameBuf, payload)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)          // version made by
    central.writeUInt16LE(20, 6)          // version needed
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(method, 10)
    central.writeUInt16LE(0, 12)
    central.writeUInt16LE(0, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(payload.length, 20)
    central.writeUInt32LE(e.data.length, 24)
    central.writeUInt16LE(nameBuf.length, 28)
    central.writeUInt16LE(0, 30)          // extra
    central.writeUInt16LE(0, 32)          // comment
    central.writeUInt16LE(0, 34)          // disk
    central.writeUInt16LE(0, 36)          // internal attrs
    central.writeUInt32LE(0, 38)          // external attrs
    central.writeUInt32LE(offset, 42)
    centrals.push(central, nameBuf)

    offset += local.length + nameBuf.length + payload.length
  }

  const centralBuf = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(centralBuf.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)

  return Buffer.concat([...locals, centralBuf, end])
}
