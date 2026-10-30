import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { isHealthCheck, startTracing, stopTracing } from './tracing.ts'

// The SDK and exporter are the boundary this module wraps, so the test
// replaces them with fakes instead of patching modules and sending spans.
const sdk = vi.hoisted(() => ({
  start: vi.fn(),
  shutdown: vi.fn(async () => {}),
}))

vi.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: vi.fn(() => sdk),
}))

vi.mock('@opentelemetry/exporter-trace-otlp-proto', () => ({
  OTLPTraceExporter: vi.fn(),
}))

const NodeSDKMock = vi.mocked(NodeSDK)
const OTLPTraceExporterMock = vi.mocked(OTLPTraceExporter)

describe('startTracing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await stopTracing()
  })

  it('does not start the SDK when the PostHog key is unset', async () => {
    const started = await startTracing({ host: 'https://us.i.posthog.com' })

    expect(started).toBe(false)
    expect(NodeSDKMock).not.toHaveBeenCalled()
  })

  it('treats an empty PostHog key as unset', async () => {
    const started = await startTracing({ apiKey: '', host: 'https://us.i.posthog.com' })

    expect(started).toBe(false)
    expect(NodeSDKMock).not.toHaveBeenCalled()
  })

  it('exports spans to the PostHog traces endpoint, authenticated with the key', async () => {
    const started = await startTracing({ apiKey: 'phc_test', host: 'https://us.i.posthog.com' })

    expect(started).toBe(true)
    expect(OTLPTraceExporterMock).toHaveBeenCalledWith({
      url: 'https://us.i.posthog.com/i/v1/traces',
      headers: { Authorization: 'Bearer phc_test' },
    })
    expect(sdk.start).toHaveBeenCalledTimes(1)
  })

  it('starts no metrics or logs pipeline', async () => {
    await startTracing({ apiKey: 'phc_test', host: 'https://us.i.posthog.com' })

    expect(NodeSDKMock).toHaveBeenCalledWith(
      expect.objectContaining({ metricReaders: [], logRecordProcessors: [] })
    )
  })

  it('shuts the SDK down, flushing buffered spans', async () => {
    await startTracing({ apiKey: 'phc_test', host: 'https://us.i.posthog.com' })

    await stopTracing()

    expect(sdk.shutdown).toHaveBeenCalledTimes(1)
  })
})

describe('isHealthCheck', () => {
  it('matches the health check, with or without a query string', () => {
    expect(isHealthCheck('/health')).toBe(true)
    expect(isHealthCheck('/health?probe=alb')).toBe(true)
  })

  it('does not match other routes', () => {
    expect(isHealthCheck('/events')).toBe(false)
    expect(isHealthCheck('/health-report')).toBe(false)
    expect(isHealthCheck('/users/health')).toBe(false)
    expect(isHealthCheck(undefined)).toBe(false)
  })
})

describe('stopTracing', () => {
  it('does nothing when tracing was never started', async () => {
    await expect(stopTracing()).resolves.toBeUndefined()
  })
})
