import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto'
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino'
import type { ReadableSpan } from '@opentelemetry/sdk-trace'
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

const exporter = vi.hoisted(() => ({
  export: vi.fn(),
  shutdown: vi.fn(async () => {}),
}))

vi.mock('@opentelemetry/exporter-trace-otlp-proto', () => ({
  OTLPTraceExporter: vi.fn(() => exporter),
}))

const logExporter = vi.hoisted(() => ({
  export: vi.fn(),
  shutdown: vi.fn(async () => {}),
}))

vi.mock('@opentelemetry/exporter-logs-otlp-proto', () => ({
  OTLPLogExporter: vi.fn(() => logExporter),
}))

vi.mock('@opentelemetry/sdk-logs', () => ({
  BatchLogRecordProcessor: vi.fn((options: unknown) => ({ options })),
}))

vi.mock('@opentelemetry/instrumentation-pino', () => ({
  PinoInstrumentation: vi.fn(() => ({ name: 'pino' })),
}))

const NodeSDKMock = vi.mocked(NodeSDK)
const OTLPTraceExporterMock = vi.mocked(OTLPTraceExporter)
const OTLPLogExporterMock = vi.mocked(OTLPLogExporter)
const BatchLogRecordProcessorMock = vi.mocked(BatchLogRecordProcessor)
const PinoInstrumentationMock = vi.mocked(PinoInstrumentation)

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

  it('starts no metrics pipeline', async () => {
    await startTracing({ apiKey: 'phc_test', host: 'https://us.i.posthog.com' })

    expect(NodeSDKMock).toHaveBeenCalledWith(expect.objectContaining({ metricReaders: [] }))
  })

  it('exports logs to the PostHog logs endpoint through a batch processor', async () => {
    await startTracing({ apiKey: 'phc_test', host: 'https://us.i.posthog.com' })

    expect(OTLPLogExporterMock).toHaveBeenCalledWith({
      url: 'https://us.i.posthog.com/i/v1/logs',
      headers: { Authorization: 'Bearer phc_test' },
    })
    expect(BatchLogRecordProcessorMock).toHaveBeenCalledWith({ exporter: logExporter })

    const { logRecordProcessors } = NodeSDKMock.mock.calls[0][0]!
    expect(logRecordProcessors).toHaveLength(1)
  })

  it('patches Pino so its log lines become OTel log records', async () => {
    await startTracing({ apiKey: 'phc_test', host: 'https://us.i.posthog.com' })

    expect(PinoInstrumentationMock).toHaveBeenCalledTimes(1)
    const { instrumentations } = NodeSDKMock.mock.calls[0][0]!
    expect(instrumentations).toContainEqual({ name: 'pino' })
  })

  it('shuts the SDK down, flushing buffered spans', async () => {
    await startTracing({ apiKey: 'phc_test', host: 'https://us.i.posthog.com' })

    await stopTracing()

    expect(sdk.shutdown).toHaveBeenCalledTimes(1)
  })
})

describe('what leaves the API on a span', () => {
  const LEAK = 'Failed query: select $1\nparams: maria@example.com'

  const failedSpan = {
    name: 'request',
    status: { code: 2, message: LEAK },
    events: [
      {
        name: 'exception',
        time: [0, 0],
        attributes: {
          'exception.type': 'DrizzleQueryError',
          'exception.message': LEAK,
          'exception.stacktrace': `Error: ${LEAK}\n    at query (session.js:42:15)`,
        },
      },
    ],
    attributes: {
      'url.path': '/events?name=maria',
      'url.query': 'name=maria',
      'client.address': '203.0.113.7',
      'network.peer.address': '203.0.113.7',
      'user_agent.original': 'Mozilla/5.0',
      'db.query.text': 'select $1',
      posthogDistinctId: 'auth0|abc',
      sessionId: 'session-7',
    },
  } as unknown as ReadableSpan

  const exportedSpan = async () => {
    vi.clearAllMocks()
    await startTracing({ apiKey: 'phc_test', host: 'https://us.i.posthog.com' })

    const { traceExporter } = NodeSDKMock.mock.calls[0][0]!
    traceExporter!.export([failedSpan], () => {})

    return (exporter.export.mock.calls[0] as [ReadableSpan[]])[0][0]
  }

  afterEach(async () => {
    await stopTracing()
  })

  it('keeps that a request failed, but not the error text, which can quote query values', async () => {
    const span = await exportedSpan()

    expect(span.status).toEqual({ code: 2 })
    expect(span.events[0].attributes).toEqual({ 'exception.type': 'DrizzleQueryError' })
  })

  it('drops the query string, client IP and user agent', async () => {
    const span = await exportedSpan()

    expect(span.attributes).toEqual({
      'url.path': '/events',
      'db.query.text': 'select $1',
      posthogDistinctId: 'auth0|abc',
      sessionId: 'session-7',
    })
  })

  it('leaves the rest of the span as it was', async () => {
    const span = await exportedSpan()

    expect(span.name).toBe('request')
    expect(span.events[0].name).toBe('exception')
    expect(failedSpan.status.message).toBe(LEAK)
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
