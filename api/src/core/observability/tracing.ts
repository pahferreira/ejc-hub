import type { NodeSDK } from '@opentelemetry/sdk-node'
import type { LoggerProvider } from '@opentelemetry/sdk-logs'
import type { logs as LogsApi } from '@opentelemetry/api-logs'
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
let loggerProvider: LoggerProvider | undefined
let logsApi: typeof LogsApi | undefined

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
    { LoggerProvider, BatchLogRecordProcessor },
    { logs },
    { resourceFromAttributes },
    { HttpInstrumentation },
    { PgInstrumentation },
    { PinoInstrumentation },
    { FastifyOtelInstrumentation },
  ] = await Promise.all([
    import('@opentelemetry/sdk-node'),
    import('@opentelemetry/exporter-trace-otlp-proto'),
    import('@opentelemetry/exporter-logs-otlp-proto'),
    import('@opentelemetry/sdk-logs'),
    import('@opentelemetry/api-logs'),
    import('@opentelemetry/resources'),
    import('@opentelemetry/instrumentation-http'),
    import('@opentelemetry/instrumentation-pg'),
    import('@opentelemetry/instrumentation-pino'),
    import('@fastify/otel'),
  ])

  // The logs pipeline is built and registered by hand, not through the
  // `NodeSDK`'s `logRecordProcessors`. This OpenTelemetry build ships two
  // separate Logs APIs: the `NodeSDK` registers its logger provider through
  // `@opentelemetry/api`, but `instrumentation-pino` reads the provider from
  // `@opentelemetry/api-logs`. Registering through the same `api-logs` the Pino
  // instrumentation uses is what connects Fastify's log lines to the exporter;
  // without it, every line is emitted into a disconnected no-op provider.
  loggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({ 'service.name': 'ejc-hub-api' }),
    // A batch processor (spike #311), not the simple one, so a burst of lines
    // doesn't become a burst of HTTP calls. In OpenTelemetry JS 3.0 the
    // processor takes an options object.
    processors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({
          url: `${host}/i/v1/logs`,
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
      }),
    ],
  })
  logsApi = logs
  logs.setGlobalLoggerProvider(loggerProvider)

  sdk = new NodeSDK({
    serviceName: 'ejc-hub-api',
    traceExporter: new ScrubbingSpanExporter(
      new OTLPTraceExporter({
        url: `${host}/i/v1/traces`,
        headers: { Authorization: `Bearer ${apiKey}` },
      })
    ),
    // Both empty, not omitted: otherwise the SDK starts default OTLP metric and
    // log exporters aimed at localhost. The logs pipeline is the hand-built
    // `loggerProvider` above, registered through `api-logs`.
    metricReaders: [],
    logRecordProcessors: [],
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

/** Flushes buffered spans and logs. A no-op when tracing never started. */
export async function stopTracing() {
  await Promise.all([sdk?.shutdown(), loggerProvider?.shutdown()])
  // Clear the `api-logs` global so a later `startTracing` can register again;
  // `setGlobalLoggerProvider` is a no-op while one is already registered.
  logsApi?.disable()
  sdk = undefined
  loggerProvider = undefined
  logsApi = undefined
}
