// app/auth/callback/route.ts
import type { NextRequest } from 'next/server'
import { exchangeCodeForSession } from '@/app/auth/actions'

export async function GET(request: NextRequest) {
  // The `exchangeCodeForSession` function from actions.ts
  // will handle the code exchange and then redirect.
  return await exchangeCodeForSession(request);
}
