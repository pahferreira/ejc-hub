import type { NodeSDK } from '@opentelemetry/sdk-node'
import { ScrubbingSpanExporter } from './scrub-span.ts'

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
    { OTLPLogExporter },
    { BatchLogRecordProcessor },
    { HttpInstrumentation },
    { PgInstrumentation },
    { PinoInstrumentation },
    { FastifyOtelInstrumentation },
  ] = await Promise.all([
    import('@opentelemetry/sdk-node'),
    import('@opentelemetry/exporter-trace-otlp-proto'),
    import('@opentelemetry/exporter-logs-otlp-proto'),
    import('@opentelemetry/sdk-logs'),
    import('@opentelemetry/instrumentation-http'),
    import('@opentelemetry/instrumentation-pg'),
    import('@opentelemetry/instrumentation-pino'),
    import('@fastify/otel'),
  ])

  sdk = new NodeSDK({
    serviceName: 'ejc-hub-api',
    traceExporter: new ScrubbingSpanExporter(
      new OTLPTraceExporter({
        url: `${host}/i/v1/traces`,
        headers: { Authorization: `Bearer ${apiKey}` },
      })
    ),
    // Empty, not omitted: otherwise the SDK starts a default OTLP metric
    // exporter aimed at localhost.
    metricReaders: [],
    // Fastify's built-in Pino logs, patched by `instrumentation-pino`, go to
    // PostHog's logs endpoint. A batch processor (spike #311), not the simple
    // one, so a burst of lines doesn't become a burst of HTTP calls. In
    // OpenTelemetry JS 3.0 the processor takes an options object.
    logRecordProcessors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({
          url: `${host}/i/v1/logs`,
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
      }),
    ],
    instrumentations: [
      // Patches Fastify's built-in Pino 9.7 so every log line becomes an OTel
      // log record. Child-logger bindings (set after auth) ride along as log
      // attributes, and lines inside a request carry its trace.
      new PinoInstrumentation(),
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
