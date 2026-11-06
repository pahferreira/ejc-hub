/**
 * Returns the hostname(s) `posthog-js` should inject tracing headers on, so
 * frontend session replays link to the API traces made during them.
 *
 * posthog-js matches a request by `new URL(requestUrl).hostname`, so we pass the
 * bare hostname of the API — derived from the same `VITE_API_URL` the axios
 * client uses — rather than the full URL. This keeps the headers scoped to the
 * API host in both local dev (`http://localhost:4000` → `localhost`) and
 * production, and off every other host (Auth0, PostHog ingest, etc.).
 *
 * Returns an empty list when `apiUrl` is unset or unparseable, so `posthog.init`
 * never throws over configuration.
 */
export function getApiTracingHosts(apiUrl?: string): string[] {
  if (!apiUrl) {
    return []
  }

  try {
    return [new URL(apiUrl).hostname]
  } catch {
    return []
  }
}
