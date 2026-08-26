/**
 * Which system am I, and exactly what code is running?
 *
 * Values are baked in at image build time (see the ARG/ENV block in the
 * Dockerfile) and supplied by deploy.sh. They can't be read from .git at
 * runtime because the container doesn't carry a .git directory, and reading
 * them at runtime from a mounted file would let a DEV container be pointed at
 * PROD values by accident. Baking them in means the answer is a property of the
 * image itself.
 *
 * NEXT_PUBLIC_* is required for the footer, which is a client component —
 * anything not prefixed is stripped from the browser bundle.
 */

export type AppEnvName = 'DEV' | 'PROD' | 'LOCAL'

const raw = (v: string | undefined, fallback = '') => (v && v.trim()) || fallback

/** DEV / PROD / LOCAL. Anything unrecognised is treated as LOCAL. */
export function appEnv(): AppEnvName {
  const v = raw(process.env.NEXT_PUBLIC_APP_ENV, '').toUpperCase()
  if (v === 'DEV' || v === 'DEVELOPMENT') return 'DEV'
  if (v === 'PROD' || v === 'PRODUCTION') return 'PROD'
  return 'LOCAL'
}

export const isDev = () => appEnv() === 'DEV'
export const isProd = () => appEnv() === 'PROD'

export function appVersion(): string {
  return raw(process.env.NEXT_PUBLIC_APP_VERSION, '0.0.0')
}

export function gitSha(): string {
  return raw(process.env.NEXT_PUBLIC_GIT_SHA, '')
}

export function gitShortSha(): string {
  return gitSha().slice(0, 7)
}

export function gitBranch(): string {
  return raw(process.env.NEXT_PUBLIC_GIT_BRANCH, '')
}

/** `git describe --tags --always --dirty`, when deploy.sh supplied it. */
export function gitDescribe(): string {
  return raw(process.env.NEXT_PUBLIC_GIT_DESCRIBE, '')
}

export function buildTime(): string {
  return raw(process.env.NEXT_PUBLIC_BUILD_TIME, '')
}

/** True when the build came from a working tree with uncommitted changes. */
export function isDirtyBuild(): boolean {
  return /-dirty$/.test(gitDescribe())
}

/** One-line summary, e.g. "2.4.0 · a1b2c3d · main". */
export function versionLine(): string {
  const bits = [appVersion()]
  const sha = gitShortSha()
  if (sha && sha !== 'unknow') bits.push(sha)
  const branch = gitBranch()
  if (branch && branch !== 'unknown') bits.push(branch)
  return bits.join(' · ')
}

export function buildInfo() {
  return {
    env: appEnv(),
    version: appVersion(),
    gitSha: gitSha(),
    gitShortSha: gitShortSha(),
    gitBranch: gitBranch(),
    gitDescribe: gitDescribe(),
    buildTime: buildTime(),
    dirty: isDirtyBuild(),
  }
}
