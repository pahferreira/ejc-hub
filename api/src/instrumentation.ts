// Loaded with `--import`, before `server.ts`. OpenTelemetry can only patch
// Fastify, `pg` and Pino if it starts before they are first required, so
// nothing imported here may pull them in.
import { env } from './core/envs/env.ts'
import { startTracing } from './core/observability/tracing.ts'

await startTracing({ apiKey: env.POSTHOG_API_KEY, host: env.POSTHOG_HOST })
