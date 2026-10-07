import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canReadModule } from '@/lib/config/access'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { getGoldStandard, logHistory } from '@/lib/products/goldStandard'
import { buildCardSet } from '@/lib/products/batchCardData'
import { fromStoredCard, fromCardData } from '@/lib/products/compareModel'
import { resolveProductionPart } from '@/lib/products/partSearch'

export const dynamic = 'force-dynamic'

/**
 * Both sides of a comparison, for the side-by-side view.
 *
 * The gold standard comes out of MySQL as captured; the part being compared is
 * built LIVE from Paradigm. That asymmetry is the point of the feature — the
 * question is whether the part as it stands today still matches the blessed
 * copy, and capturing the candidate first would compare two snapshots and
 * answer a different question.
 *
 * Pairing and diffing happen in the browser, over the cards returned here, so
 * adjusting a match tolerance re-pairs instantly. Doing it server-side would
 * mean re-reading a 28-card assembly out of Paradigm on every nudge of a
 * tolerance — tens of seconds to answer a question the client already has the
 * data for.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { id } = await params
  const gsId = Number(id)
  const sp = new URL(request.url).searchParams
  const likePartId = Number(sp.get('likePartId'))
  // A part can also be compared without being attached first, which is how
  // someone checks a candidate before committing it to the list.
  const adHocPart = (sp.get('part') || '').trim()

  if (!gsId) return NextResponse.json({ error: 'Bad gold standard id' }, { status: 400 })
  if (!likePartId && !adHocPart) {
    return NextResponse.json({ error: 'likePartId or part is required' }, { status: 400 })
  }

  try {
    const detail = await getGoldStandard(gsId)
    if (!detail) return NextResponse.json({ error: 'Gold standard not found' }, { status: 404 })

    let likePart: any = null
    let asked = adHocPart
    if (likePartId) {
      likePart = (detail.likeParts || []).find((p: any) => Number(p.id) === likePartId) || null
      if (!likePart) {
        return NextResponse.json({ error: 'That like part is not on this standard' }, { status: 404 })
      }
      // The APC number first. A batch card is built from the PRODUCTION row,
      // and only the APC number lands on it — asking Paradigm for the customer
      // number finds the sales row, which carries no BOM and no route and so
      // compares as "everything is missing on the right".
      asked = String(likePart.apcPartNumber || '').trim()
        || String(likePart.customerPartNumber || '').trim()
    }
    if (!asked) {
      return NextResponse.json({ error: 'The like part has no part number' }, { status: 400 })
    }

    const goldCards = (detail.cards || []).map(fromStoredCard)
    if (!goldCards.length) {
      return NextResponse.json({
        error: 'This standard has no captured cards yet — recapture it before comparing',
      }, { status: 409 })
    }

    // Accept either number and resolve it to the production row, so a like
    // part stored with only a customer number still builds a real card set.
    let resolved = null
    let otherPartNumber = asked
    let note = ''
    try {
      resolved = await resolveProductionPart(asked)
      if (resolved) {
        otherPartNumber = resolved.raw || resolved.apcPart
        if (resolved.matchedOn === 'customer') {
          note = `${asked} is a customer number; built from APC part ${resolved.apcPart}.`
        }
      }
    } catch { /* fall through to the raw number below */ }

    let liveCards: any[] = []
    let otherError = ''
    try {
      liveCards = await buildCardSet(otherPartNumber)
      if (!liveCards.length) {
        otherError = resolved
          ? `Paradigm has no batch card data for ${resolved.apcPart}.`
          : `No production part in Paradigm matches ${asked}.`
      }
    } catch (e) {
      // Reported rather than thrown: the gold side is worth showing on its
      // own, and "Paradigm has nothing for this part" is a result.
      otherError = e instanceof Error ? e.message : String(e)
    }

    return NextResponse.json({
      success: true,
      standard: detail.standard,
      likePart,
      gold: {
        label: detail.standard?.customerPartNumber || detail.standard?.apcPartNumber || `#${gsId}`,
        capturedAt: detail.standard?.capturedAt ?? null,
        cards: goldCards,
      },
      other: {
        // Labelled by the APC number, because that is what was actually built.
        label: resolved?.apcPart || asked,
        customerPart: resolved?.salesPart || (likePart?.customerPartNumber ?? ''),
        asked,
        note: note || undefined,
        cards: liveCards.map(fromCardData),
        error: otherError || undefined,
      },
    })
  } catch (error) {
    console.error('Gold Standard compare error:', error)
    return NextResponse.json({
      error: 'Compare failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

/**
 * Records that a comparison was run, with the count the client arrived at.
 *
 * The count is the client's because the client does the pairing — it is what
 * the person actually looked at. Stored so the Like Parts list can show when
 * each part was last checked and how far off it was, which is the difference
 * between a list of candidates and a review record.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = (session.user as any)?.name || (session.user as any)?.email || 'unknown'

  const { id } = await params
  const gsId = Number(id)
  let body: any
  try { body = await request.json() } catch { body = null }

  const likePartId = Number(body?.likePartId)
  const diffCount = Number(body?.diffCount)
  if (!gsId || !likePartId) {
    return NextResponse.json({ error: 'likePartId is required' }, { status: 400 })
  }

  try {
    await queryPrimary(
      `UPDATE gold_standard_like_parts
          SET last_compared_at = NOW(), last_compared_by = ?, diff_count = ?
        WHERE id = ? AND gold_standard_id = ?`,
      [user, Number.isFinite(diffCount) ? diffCount : null, likePartId, gsId]
    )
    await logHistory(gsId, 'compared', user, {
      target: 'gold_standard_like_parts',
      detail: `${String(body?.partNumber || '')} — ${Number.isFinite(diffCount) ? diffCount : '?'} differences`,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to record the comparison',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
