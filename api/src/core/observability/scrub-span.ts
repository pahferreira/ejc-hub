import type { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace'

// Personal data `instrumentation-http` records on every request.
const FORBIDDEN_ATTRIBUTES = [
  'url.query',
  'client.address',
  'network.peer.address',
  'user_agent.original',
]

// Only the type: the message and stack quote the error's text.
const SAFE_EXCEPTION_ATTRIBUTE = 'exception.type'

// `@fastify/otel` sets `url.path` to the raw URL, query string included.
const withoutQueryString = (urlPath: unknown) =>
  typeof urlPath === 'string' ? urlPath.split('?')[0] : urlPath

const scrubSpan = (span: ReadableSpan): ReadableSpan => {
  const attributes = Object.fromEntries(
    Object.entries(span.attributes)
      .filter(([key]) => !FORBIDDEN_ATTRIBUTES.includes(key))
      .map(([key, value]) => [key, key === 'url.path' ? withoutQueryString(value) : value])
  )

  const events = span.events.map((event) =>
    event.name === 'exception'
      ? {
          ...event,
          attributes: Object.fromEntries(
            Object.entries(event.attributes ?? {}).filter(
              ([key]) => key === SAFE_EXCEPTION_ATTRIBUTE
            )
          ),
        }
      : event
  )

  // `create`, not a spread: a span's fields can live on its prototype.
  return Object.create(span, {
    attributes: { value: attributes },
    events: { value: events },
    status: { value: { code: span.status.code } },
  }) as ReadableSpan
}

/**
 * Drops what the data policy forbids from a span before it leaves the API.
 *
 * The instrumentations copy `error.message` onto the span's status and
 * exception event, and those texts quote values: Drizzle's ends with the bound
 * parameters, and Postgres's can repeat them. Whatever the error class, the
 * text goes, so a new library can't bring it back. Trace readers still see that
 * a span failed, and the scrubbed error itself is in error tracking.
 */
export class ScrubbingSpanExporter implements SpanExporter {
  #exporter: SpanExporter

  constructor(exporter: SpanExporter) {
    this.#exporter = exporter
  }

  export(...[spans, resultCallback]: Parameters<SpanExporter['export']>) {
    this.#exporter.export(spans.map(scrubSpan), resultCallback)
  }

  shutdown() {
    return this.#exporter.shutdown()
  }

  async forceFlush() {
    await this.#exporter.forceFlush?.()
  }
}
