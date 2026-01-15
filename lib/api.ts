/**
 * API utility functions with basePath support
 * 
 * Next.js basePath doesn't automatically prefix fetch() calls,
 * so we need to manually add the prefix for API routes.
 * 
 * Set NEXT_PUBLIC_BASE_PATH in .env.local for production:
 *   NEXT_PUBLIC_BASE_PATH=/frontend
 * 
 * Leave it empty or unset for local development:
 *   NEXT_PUBLIC_BASE_PATH=
 */

/**
 * Get API URL with basePath prefix
 * In production with basePath='/frontend', this returns '/frontend/api/...'
 * In development without basePath, this returns '/api/...'
 */
export function getApiUrl(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${basePath}${normalizedPath}`
}

