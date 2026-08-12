/**
 * LDI Backend Client
 * Calls the Python FastAPI service for Genesis operations.
 * Supports both local and remote configurations.
 */

const LDI_BACKEND_URL = process.env.LDI_BACKEND_URL || 'http://localhost:8100'

interface LDIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

async function ldiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${LDI_BACKEND_URL}${path}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `LDI backend error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to LDI backend at ${LDI_BACKEND_URL}. ` +
        `Ensure the Python service is running (cd python && python server.py)`
      )
    }
    throw error
  }
}

// ---- Validation ----

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  info: {
    job: string
    job_upper: string
    on_hold: boolean
    exists_in_genesis: boolean
    revision_path?: string
    archive_data_path?: string
    needs_revision_selection: boolean
    revision_options?: {
      prompt: string
      options: { label: string; revision: string | null }[]
    }
    locked_by?: string
    cleaned_orphan?: boolean
    cleaned_unlocked?: boolean
  }
}

export async function validateJob(
  job: string,
  genesisHost?: string,
  genesisUser?: string,
  archiveBasePath?: string
): Promise<ValidationResult> {
  return ldiRequest<ValidationResult>('/api/validate', {
    method: 'POST',
    body: JSON.stringify({
      job,
      genesis_host: genesisHost,
      genesis_user: genesisUser,
      archive_base_path: archiveBasePath,
    }),
  })
}

// ---- Acquisition ----

export interface LayerInfo {
  name: string
  type: string        // Genesis matrix type: signal | power_ground | mixed | drill | ...
  polarity: string    // positive | negative | ''
  row: string | null
}

export interface AcquireResult {
  success: boolean
  job: string
  revision: string
  steps: string[]
  layers: string[]
  layer_info?: LayerInfo[]
  timestamp: string
}

export async function acquireJob(
  job: string,
  revisionChoice?: number,
  genesisHost?: string,
  genesisUser?: string,
  archiveBasePath?: string
): Promise<AcquireResult> {
  return ldiRequest<AcquireResult>('/api/acquire', {
    method: 'POST',
    body: JSON.stringify({
      job,
      revision_choice: revisionChoice,
      genesis_host: genesisHost,
      genesis_user: genesisUser,
      archive_base_path: archiveBasePath,
    }),
  })
}

// ---- Layers ----

export interface LayersResult {
  job: string
  layers: string[]
  layer_info?: LayerInfo[]
  steps: string[]
  count: number
}

export async function getLayers(job: string): Promise<LayersResult> {
  return ldiRequest<LayersResult>(`/api/layers/${job}`)
}

// ---- Date Code ----

export interface DateCodeResult {
  code: string | null
  format: string
  auto: boolean
  needs_manual: boolean
  today: string
  day_of_year: number
  week: number
}

export async function getDateCode(
  format: string,
  manual?: string
): Promise<DateCodeResult> {
  const params = new URLSearchParams({ format })
  if (manual) params.set('manual', manual)
  return ldiRequest<DateCodeResult>(`/api/date-code?${params}`)
}

export interface DateCodeFormat {
  format: string
  code: string | null
  auto: boolean
  needs_manual: boolean
}

export async function getDateCodeFormats(): Promise<{ formats: DateCodeFormat[] }> {
  return ldiRequest<{ formats: DateCodeFormat[] }>('/api/date-code/formats')
}

// ---- Output (SSE) ----

export interface OutputEvent {
  type: 'start' | 'progress' | 'complete' | 'error'
  message: string
  timestamp: string
}

export interface LayerOverride {
  name: string
  polarity?: string       // "positive" | "negative"
  scale_x?: number        // output scale factor, default 1.0
  scale_y?: number
}

export function startOutput(
  job: string,
  layers: string[],
  dateCode?: string,
  dateCodeFormat?: string,
  dateCodeManual?: string,
  onEvent?: (event: OutputEvent) => void,
  onComplete?: () => void,
  onError?: (error: string) => void,
  layerOverrides?: LayerOverride[]
): AbortController {
  const controller = new AbortController()

  const doOutput = async () => {
    try {
      const response = await fetch(`${LDI_BACKEND_URL}/api/output`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job,
          layers,
          layer_overrides: layerOverrides,
          date_code: dateCode,
          date_code_format: dateCodeFormat,
          date_code_manual: dateCodeManual,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        onError?.(err.detail || 'Output failed')
        return
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        onError?.('No response stream')
        return
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: OutputEvent = JSON.parse(line.slice(6))
              onEvent?.(event)

              if (event.type === 'complete') {
                onComplete?.()
              } else if (event.type === 'error') {
                onError?.(event.message)
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        onError?.(error.message)
      }
    }
  }

  doOutput()
  return controller
}

// ---- Backend Status ----

export interface BackendStatus {
  genesis_connected: boolean
  genesis_host: string
  config_loaded: boolean
  timestamp: string
}

export async function getBackendStatus(): Promise<BackendStatus> {
  return ldiRequest<BackendStatus>('/api/status')
}

// ---- Configuration ----

export async function getLDIConfig(): Promise<Record<string, any>> {
  return ldiRequest<Record<string, any>>('/api/config')
}

export async function updateLDIConfig(key: string, value: any): Promise<void> {
  await ldiRequest('/api/config', {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  })
}

export async function getSpecialJobs(): Promise<Record<string, any>> {
  return ldiRequest<Record<string, any>>('/api/config/special-jobs')
}

export async function updateSpecialJob(
  job: string,
  prompt: string,
  options: { label: string; revision: string | null }[]
): Promise<void> {
  await ldiRequest('/api/config/special-jobs', {
    method: 'POST',
    body: JSON.stringify({ job, prompt, options }),
  })
}

export async function deleteSpecialJob(job: string): Promise<void> {
  await ldiRequest(`/api/config/special-jobs/${job}`, {
    method: 'DELETE',
  })
}
