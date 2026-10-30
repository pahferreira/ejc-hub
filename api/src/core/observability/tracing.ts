import type { NodeSDK } from '@opentelemetry/sdk-node'

// The only file that imports the OpenTelemetry SDK. It must not import
// Fastify, `pg` or Pino: `src/instrumentation.ts` loads it before they are
// required, so their instrumentations can patch them.
//
// The SDK is imported lazily, once a key is known: loading it costs ~40 MB of
// RSS, which an API running without PostHog shouldn't pay.

type TracingConfig = {
  apiKey?: string
  host: string
}

const HEALTH_PATH = '/health'

let sdk: NodeSDK | undefined

/** True for the load balancer's health check, which is never traced. */
export function isHealthCheck(url: string | undefined) {
  return url?.split('?')[0] === HEALTH_PATH
}

/**
 * Starts the OpenTelemetry SDK, exporting traces to PostHog. Without a key it
 * does nothing, and the API runs untraced. Returns whether it started.
 */
export async function startTracing({ apiKey, host }: TracingConfig) {
  if (!apiKey) {
    return false
  }

  const [
    { NodeSDK },
    { OTLPTraceExporter },
    { HttpInstrumentation },
    { PgInstrumentation },
    { FastifyOtelInstrumentation },
  ] = await Promise.all([
    import('@opentelemetry/sdk-node'),
    import('@opentelemetry/exporter-trace-otlp-proto'),
    import('@opentelemetry/instrumentation-http'),
    import('@opentelemetry/instrumentation-pg'),
    import('@fastify/otel'),
  ])

  sdk = new NodeSDK({
    serviceName: 'ejc-hub-api',
    traceExporter: new OTLPTraceExporter({
      url: `${host}/i/v1/traces`,
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
    // Empty, not omitted: otherwise the SDK starts default OTLP metric and
    // log exporters aimed at localhost. Logs will reuse this SDK later.
    metricReaders: [],
    logRecordProcessors: [],
    instrumentations: [
      // `instrumentation-http` only sees the raw URL, and `@fastify/otel` only
      // the route, so `/health` is excluded in both.
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (request) => isHealthCheck(request.url),
      }),
      new FastifyOtelInstrumentation({ registerOnInitialization: true, ignorePaths: HEALTH_PATH }),
      // ADR #7: only IDs leave the API. Off by default, but explicit so query
      // parameter values never end up on a span.
      new PgInstrumentation({ enhancedDatabaseReporting: false }),
    ],
  })
  sdk.start()

  return true
}

/** Flushes buffered spans. A no-op when tracing never started. */
export async function stopTracing() {
  await sdk?.shutdown()
  sdk = undefined
}
