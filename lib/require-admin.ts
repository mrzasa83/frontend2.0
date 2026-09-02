import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Resolve the current session's roles. frontImage shares the same user/roles
 * tables as frontend2.0, so `session.user.roles` is a string[] of role names.
 */
export async function getSessionRoles(): Promise<string[] | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return ((session.user as any).roles as string[]) || []
}

export function rolesAreAdmin(roles: string[] | null | undefined): boolean {
  return !!roles && roles.includes('Admin')
}

/**
 * Returns { ok: true } for an authenticated admin, otherwise an object with the
 * HTTP status to return. Keeps the admin gate identical across API routes.
 */
export async function requireAdmin(): Promise<
  { ok: true; roles: string[] } | { ok: false; status: 401 | 403 }
> {
  const roles = await getSessionRoles()
  if (roles === null) return { ok: false, status: 401 }
  if (!rolesAreAdmin(roles)) return { ok: false, status: 403 }
  return { ok: true, roles }
}
