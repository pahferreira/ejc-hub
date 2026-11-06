// The request shape the serializer reads. Fastify hands its own request to the
// Pino serializer, but only these fields are ever logged.
type SerializableRequest = {
  id?: string
  method?: string
  url?: string
}

/**
 * The Pino `req` serializer. ADR #7: no credentials or bodies leave the API, so
 * this keeps only the routing fields and never emits headers. In particular the
 * `authorization` bearer token and `cookie` header are dropped: they are not in
 * the output at all, so a future header addition can't bring them back.
 *
 * Pino doesn't log request or response bodies on its own, and nothing here adds
 * them, so bodies stay out too.
 */
export function serializeRequestForLog(request: SerializableRequest) {
  return {
    id: request.id,
    method: request.method,
    url: request.url,
  }
}
