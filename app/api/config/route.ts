import { NextResponse } from 'next/server'

// Runtime client config. Read server-side env at request time (not inlined at
// build), so values can be set via docker-compose APP_ENV / deploy.sh without
// rebuilding the image.
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    frontVueUrl: process.env.FRONTVUE_URL || 'http://nh2934rh/frontVue',
  })
}
