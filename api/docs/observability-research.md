# Observability research: API + infra

Research date: **2026-10-23**. All facts come from vendor docs, pricing pages, specs or package registries. Short reference tags like [ph-logs] link to the [Sources](#7-sources) list at the bottom. Anything marked **(opinion)** is a judgement, not a sourced fact.

**What the repo shows**

- API: Fastify 5.3 with its built-in pino 9.7 logger (`logger: true` in `api/src/server.ts`), ESM (`"type": "module"`), run with `node --experimental-strip-types`. Drizzle uses `pg`, and auth is Auth0.
- Prod: a single **t4g.micro** (2 vCPU, **1 GiB RAM**, 10% baseline CPU per vCPU [aws-t4]) per the comment in `.github/workflows/deploy-api.yml`. Docker Compose pulls from ECR and is deployed over SSM.
- Postgres is **RDS**, not on the same box. The `api/Dockerfile` trusts the RDS CA bundle (commit `ca50f2d`), and `api/docker-compose.yml` only defines a local dev DB.
- Frontend PostHog (`app/src/main.tsx`, `App.tsx`, `hooks/useAuthentication.ts`):
  - `posthog.init` uses `defaults: '2026-01-30'` with exception autocapture on.
  - `identify(user.sub, {email, name})` and `reset()` run on logout.
  - It calls `captureException` and one custom `capture` (`useMeetingForm.ts`), and uses feature flags and `PostHogErrorBoundary`.
  - Session replay isn't configured in code, so it depends on the project setting. `tracing_headers` is **not** set.
- The API has **no** observability SDK. Route handlers catch errors and call `fastifyErrorHandler` (`api/src/shared/fastify-error-handler.ts`), which uses `console.log` and not the Fastify logger.

---

## 1. TL;DR recommendation

1. **App/API observability goes in PostHog. This works, and it covers more than the PostHog-AI table says.** PostHog now has **Distributed Tracing** over OTLP [ph-trace-start], logs over OTLP [ph-logs-node], and backend error tracking [ph-fastify]. All three can link to the same person and session replay as the frontend [ph-logs-replay].
2. **Infra goes in Grafana Cloud Free.** Use Alloy with `prometheus.exporter.unix` and cAdvisor for the EC2 host and containers [g-linux][g-docker], Synthetic Monitoring for `/health` [g-sm-checks], and a CloudWatch pull for RDS [g-cw]. That fits the free tier at $0 (10k series, 50 GB logs, 100k API checks, 14-day retention [g-pricing]).
3. **Fallback if Alloy is too heavy on a 1 GiB box:** use the AWS CloudWatch agent with 3–5 custom metrics (memory and disk, which EC2 doesn't report on its own) plus CloudWatch alarms. Both fit the free tier of 10 custom metrics and 10 alarms [aws-cw-pricing][aws-agent-metrics]. Add **Better Stack Free** for uptime checks (10 monitors, 3-minute checks [bs-uptime]).
4. **The real gaps in "PostHog only" are elsewhere.** PostHog has no uptime or synthetic checks. On the free plan, insight and metric alerts run at most hourly and are capped at 5 [ph-alerts]. Metrics are an alpha with 30-day retention [ph-metrics]. There's no PagerDuty or Opsgenie destination. Logs and traces keep 14 days by default [ph-logs-pricing].
5. **Cadence should be driven by alerts, not dashboards** [sre-monitoring]: collect at 60 s, which is the Prometheus and Alloy default [prom-config][g-scrape]. Do a 10-minute check after each deploy and a 15-minute review once a week **(opinion)**.

---

## 2. Corrected comparison table

Alt 1 = **AWS CloudWatch**, which is native: EC2 and RDS metrics are already there for free. Alt 2 = **Better Stack**, which is the cheapest way to get uptime checks and on-call outside PostHog. Why not the others:

- **Sentry:** it overlaps the error tracking PostHog already does, and the free plan is 1 user, 5k errors and 1 uptime monitor [sentry].
- **Datadog:** the free plan keeps metrics for 1 day [dd].
- **New Relic:** the free plan has 1 full user, and ingest stops at 100 GB [nr].
- **Axiom:** it's log-centric, and its pricing page doesn't mention host metrics [axiom].

🔧 marks a cell that **corrects** the original PostHog-AI table.

| Capability | PostHog | Grafana (Cloud) | AWS CloudWatch | Better Stack |
|---|---|---|---|---|
| Log collection | ✅ OTLP over HTTP. Has Node, Pino and Winston guides [ph-logs-install][ph-pino] | ✅ Loki via Alloy. The Linux integration ships journal logs, and the Docker integration ships container logs [g-linux][g-docker] | ✅ CloudWatch Logs. 5 GB/month is free [aws-cw-pricing] | ✅ 3 GB on the free plan [bs-pricing] |
| Log search & filtering | ✅ Full-text on message, plus severity, service, trace_id and attributes [ph-logs-search]. 🔧 Also has a **read-only LogQL (Loki-compatible) API**, so Grafana can query PostHog logs [ph-logql] | ✅ LogQL | ✅ Logs Insights (scans count toward the 5 GB free) [aws-cw-pricing] | ✅ (not verified in detail) |
| Log-based metrics | 🔧 ⚠️ **Alpha**: it writes into application metrics, which are alpha. Max 10 enabled rules, new logs only [ph-log-metrics] | ✅ Loki metric queries | ✅ Metric filters (not verified in detail) | Not verified |
| Application metrics | ⚠️ Open alpha, ingested over OTLP **or** `posthog.metrics` in posthog-node. **30-day retention during alpha** [ph-metrics] | ✅ Mature (Prometheus data model) [g-dpm] | ✅ Custom metrics at $0.30/metric/month after the free 10 [aws-cw-pricing] | ✅ 30 GB on the free plan [bs-pricing] |
| Distributed tracing | 🔧 **✅ Available.** OTLP traces to `/i/v1/traces` with a waterfall view, correlated logs, and spans joined to person and session [ph-trace-start][ph-trace-node]. The posthog-node span API is *experimental* [ph-node] | ✅ Tempo (50 GB free) [g-pricing] | ✅ X-Ray / Application Signals (free trial allowance) [aws-cw-pricing] | ✅ 3 GB with 3-day retention on the free plan [bs-pricing] |
| Dashboards | ✅ Insights and dashboards. Metric charts can be saved as insights [ph-metrics-explore] | ✅ Very mature. The Linux integration ships 7 dashboards [g-linux] | ✅ 3 custom dashboards free [aws-cw-pricing] | ✅ |
| Alerting | ✅ but with limits 🔧:<br>• **Insight and metric alerts:** max 5 on the free plan; hourly or daily (15 min needs Boost, ~2 min needs Scale) [ph-alerts]<br>• **Log alerts:** checked every 5 min [ph-log-alerts]<br>• **Error alerts:** on new or reopened issues, plus spikes [ph-err-alerts] | ✅ Very mature | ✅ 10 alarms free, then $0.10/alarm [aws-cw-pricing] | ✅ Uptime and heartbeat alerts [bs-uptime] |
| Error tracking | ✅ Grouping, assignment, Node SDK, Fastify guide [ph-fastify]. 100k exceptions/month free [ph-err-pricing] | 🔧 ⚠️ **Frontend:** real error grouping (fingerprinting) and source maps through Frontend Observability [g-fingerprint]. **Backend:** the Application Observability docs don't describe error grouping [g-appo11y] | ❌ No issue grouping (logs and alarms only) | ✅ 100k exceptions/month free [bs-pricing] |
| Infra monitoring | 🔧 ⚠️ **Possible but immature.** Metrics (alpha) explicitly cover "infrastructure metrics … resource usage", and a Docker metrics agent scrapes Prometheus `/metrics` endpoints every 15 s [ph-metrics][ph-metrics-docker]. No host integration with shipped dashboards or alerts is documented | ✅ Linux node integration (24 alert rules, 7 dashboards) and Docker/cAdvisor integration [g-linux][g-docker] | ✅ EC2 basic metrics are free, but **memory and disk need the agent** [aws-ec2-metrics][aws-agent-metrics]. RDS sends 1-minute metrics for free [aws-rds-cw] | ⚠️ The collector needs **≥2 GiB RAM and 2 vCPU** even without eBPF [bs-collector]. **That doesn't fit a t4g.micro (1 GiB)** [aws-t4] |
| OpenTelemetry support | 🔧 ✅ OTLP over **HTTP** for logs, metrics **and traces** [ph-logs-node][ph-metrics][ph-trace-start] (gRPC isn't documented) | ✅ Full OTLP | ✅ Agent and OTel metrics ($0.50/GB) [aws-cw-pricing] | ✅ OTel Collector exporter [bs-collector] |
| Product analytics | ✅ 1M events/month free [ph-pricing] | ❌ Faro RUM covers sessions and interactions, not funnels or cohorts [g-faro] | ❌ | ❌ |
| Session recordings | ✅ 5k/month free, 30-day retention [ph-pricing][ph-replay-ret] | 🔧 ⚠️ **Exists:** Session Replay add-on to Frontend Observability, *public preview* [g-replay] | ❌ | ❌ |
| User-level context | ✅ `posthogDistinctId` and `sessionId` on logs and spans link to the person and replay [ph-logs-replay][ph-trace-node] | 🔧 ⚠️ **Exists:** Faro `setUser({id,email,username,attributes})` [g-metas], and Faro propagates `traceparent` to backend APIs [g-faro-tracing] | ❌ | ❌ |
| SQL queries | ✅ "SQL", a wrapper over ClickHouse SQL [ph-sql] | 🔧 ✅ The Postgres data source is **preinstalled** (packaged as a plugin) [g-postgres] | ⚠️ Logs Insights QL (not SQL) | ❌ |
| Notification channels | 🔧 **Depends on alert type:**<br>• Insight alerts: email, Slack, Discord, Teams, webhook [ph-alerts]<br>• Log alerts: **only Slack, Teams and webhook** [ph-log-alerts]<br>• No native PagerDuty or Opsgenie | ✅ 20+ contact points, including PagerDuty, Opsgenie, Telegram, Discord and SNS [g-contact] | ✅ SNS (email, SMS) | ✅ Slack and email on free [bs-pricing] |
| **Pricing at this scale** | $0 likely. Free tier per month: logs 10 GB (then $0.25/GB), exceptions 100k, events 1M, replays 5k [ph-logs-pricing][ph-pricing]. Traces share the logs meter [ph-trace-basics] | $0. Free tier: 10k series, 50 GB each of logs and traces, 3 users, 3 IRM users. Pro is $19/month base [g-pricing] | ~$0 if ≤10 custom metrics, ≤10 alarms, ≤3 dashboards and ≤5 GB logs [aws-cw-pricing] | $0 on free. A responder seat is $29–34/month [bs-pricing] |
| **Data retention** | Free plan: events 1 year [ph-pricing], replays 30 days [ph-replay-ret]. Logs and traces 14 days by default, extra retention $0.05/GB-month [ph-logs-pricing]. Metrics 30 days during alpha [ph-metrics] | 14 days for every signal on free [g-pricing] | RDS 1-minute points are kept 15 days [aws-rds-cw] | Logs and traces kept 3 days on free [bs-pricing] |
| **Uptime / synthetic** | ❌ None in the docs index (UptimeRobot only as a *data source*) [ph-llms] | ✅ HTTP, ping, DNS, TCP, multi-HTTP, k6 and browser checks every 10–3600 s [g-sm-checks]. 100k API runs/month free [g-pricing] | ⚠️ Synthetics gives only 100 canary runs/month free [aws-cw-pricing] | ✅ 10 monitors with 3-minute checks free [bs-uptime] |
| **Self-hosting** | ⚠️ Docker Compose "hobby" deployment (MIT). Officially unsupported with no guarantees [ph-selfhost] | ✅ Grafana, Loki and Tempo are AGPL-3.0, Alloy is Apache-2.0 [g-oss] | ❌ (AWS-only) | ❌ |
| **Fastify setup effort** | Low to medium. Fastify guide for posthog-node [ph-fastify], Pino logs through OTel [ph-pino], traces through OTel and `@fastify/otel` [otel-fastify] | Medium. OTel, plus Alloy or an OTLP gateway [g-appo11y] | Medium. Agent and IAM role, nothing in app code for infra [aws-ec2-health] | Infra: n/a on 1 GiB. Uptime: no code |
| **Frontend RUM (Faro)** | (posthog-js already does this) | ✅ 50k sessions/month free [g-pricing]. Errors, sessions and web vitals [g-faro] | ❌ | ❌ |
| **On-call / escalation** | ❌ | ✅ Grafana IRM, 3 users free [g-pricing] | ⚠️ Through SNS only | ✅ Responder seats (paid) [bs-pricing] |

Notes:

- PostHog docs don't put an alpha or beta label on **Logs** or **Distributed Tracing** themselves. The labels apply only to Metrics, log-based metrics, and the posthog-node span API [ph-metrics][ph-log-metrics][ph-node].
- Better Stack contradicts itself. The pricing page says "10 monitors & heartbeats" combined [bs-pricing], but the uptime page says "10 monitors, 10 heartbeats" [bs-uptime].

---

## 3. What you'd miss by keeping app observability in PostHog only

- **Uptime and black-box probing.** PostHog doesn't check `/health` from outside [ph-llms]. The SRE book treats external probing as the check that covers what white-box monitoring misses [sre-alerting]. Today the only probe is the deploy workflow's health check.
- **Alert latency and volume on the free plan.** Insight and metric alerts are limited to **5 total** and run **hourly** at best [ph-alerts]. Log alerts check every 5 minutes [ph-log-alerts]. Grafana and CloudWatch evaluate every minute or faster **(the CloudWatch side isn't verified here)**.
- **Routing.** PostHog has no PagerDuty or Opsgenie destination, and log alerts can't send email or Discord [ph-log-alerts]. Grafana has 20+ contact points and IRM [g-contact][g-pricing].
- **Metrics maturity.** PostHog metrics are an alpha with 30-day retention, and the endpoint may change before GA [ph-metrics]. There's no PromQL, recording rules, or ecosystem of ready-made exporter dashboards **(opinion, based on the docs only describing a viewer, SQL and insight alerts [ph-metrics-explore])**.
- **Retention.** Logs and traces keep 14 days unless you pay $0.05/GB-month [ph-logs-pricing]. That's the same as Grafana Free [g-pricing], so it's not a loss compared to Grafana, only compared to paid tools.
- **Infra integrations.** There's nothing like Grafana's Linux integration with its 24 pre-built alerts [g-linux]. You'd need to write host alerts yourself.
- **What you would *not* miss** (the original table was wrong here): tracing [ph-trace-start], user and session correlation [ph-logs-replay], and full-text log search [ph-logs-search].

---

## 4. Infra monitoring for one EC2 box: minimal setup and cost

### Option A (recommended): Grafana Cloud Free, $0

| Piece | How | Source |
|---|---|---|
| Host CPU, memory, disk, network | Alloy on the host with `prometheus.exporter.unix` (Linux Server integration). It ships 24 alert rules and 7 dashboards | [g-linux] |
| Containers | `prometheus.exporter.cadvisor` with `docker_only = true`. **Needs Alloy running as root** and the `alloy` user in the `docker` group | [g-docker] |
| RDS | CloudWatch metrics scrape job (role-based, no Alloy needed). RDS resources **must be tagged** | [g-cw] |
| `/health` uptime | Synthetic Monitoring HTTP check. 1 probe every 60 s = 43,200 runs/month (my arithmetic), under the 100k free | [g-sm-checks][g-pricing] |
| Alerts | Start from the integration's shipped rules and send them to Slack, Discord, Telegram or email | [g-linux][g-contact] |

Caveats:

- **Memory on a 1 GiB box.** Alloy uses about 11 GiB per 1M active series [g-alloy-res], so a few thousand series is small. Even so, measure Alloy's RSS before you rely on it on a t4g.micro **(opinion)**.
- Install Alloy through `user_data` or SSM like the rest of the box **(opinion)**.

### Option B (fallback): CloudWatch agent plus Better Stack uptime, ~$0

| Piece | How | Source |
|---|---|---|
| Free, already there | EC2 CPU and network (5-minute basic), StatusCheckFailed (1-minute, free), CPU credit metrics for t4g | [aws-ec2-metrics] |
| Memory and disk | CloudWatch agent (ARM64 packages exist, `yum install amazon-cloudwatch-agent` on AL2023). Collect only `mem_used_percent`, `disk_used_percent` (root path), `swap_used_percent`. Each one is a custom metric | [aws-agent-dl][aws-ec2-health] |
| RDS | Already in CloudWatch at 1-minute resolution for free: `FreeStorageSpace`, `FreeableMemory`, `CPUUtilization`, `DatabaseConnections`, `CPUCreditBalance` | [aws-rds-cw][aws-rds-metrics] |
| Alarms | ≤10 standard alarms through SNS email (free tier) | [aws-cw-pricing] |
| Uptime | Better Stack Free: 10 monitors, 3-minute checks, Slack and email | [bs-uptime][bs-pricing] |

Caveats:

- The agent's documented Linux metrics have **no per-container metrics** [aws-agent-metrics].
- The default EC2 Health solution config produces about 22 metrics on a t2.micro [aws-ec2-health]. That's over the 10 free, so trim the config.

**Why A over B (opinion):** A covers containers, uptime, RDS and alert routing in one free UI, and ships alert rules. B is lighter on the box and has nothing new to sign up for, but needs a second vendor for uptime.

---

## 5. Cadence

### Collection intervals (sourced defaults)

| Source | Default | Source |
|---|---|---|
| Prometheus `scrape_interval` / rule `evaluation_interval` | 1m / 1m | [prom-config] |
| Alloy `prometheus.scrape` | 60 s (timeout 10 s) | [g-scrape] |
| Grafana Cloud billing baseline | 1 DPM = 60 s scrape. 15 s costs 4× | [g-dpm] |
| EC2 basic monitoring | 5-minute data points (1-minute with paid detailed monitoring). Status checks every 1 minute, free | [aws-ec2-metrics] |
| CloudWatch agent (EC2 Health config) | `metrics_collection_interval: 60` | [aws-ec2-health] |
| RDS → CloudWatch | 1-minute periods, kept 15 days | [aws-rds-cw] |
| PostHog metrics agent | 15 s scrape | [ph-metrics-docker] |
| OTel SDK metric export / `posthog.metrics` flush | 60 s / 10 s | [ph-metrics] |
| PostHog log alerts / insight alerts (free) | Every 5 minutes / hourly | [ph-log-alerts][ph-alerts] |
| Grafana Synthetic Monitoring | 10–3600 s (your choice) | [g-sm-checks] |
| Better Stack Free uptime | 3 minutes | [bs-uptime] |

**Recommendation (opinion):** keep everything at **60 s**. 15 s costs 4× in Grafana Cloud [g-dpm] and gives nothing to a single low-traffic instance. Run the `/health` probe every 60 s from 1–2 probes.

### Human rhythm

Sourced principles:

- Don't rely on someone "staring at a screen". Email alerts become noise. Every page should be actionable. Alert on symptoms rather than causes [sre-monitoring].
- Require a condition to hold for at least two evaluations before firing, to avoid flapping [sre-alerting].

Practical rhythm **(opinion)**:

| When | What | ~Time |
|---|---|---|
| Alert fires | Act. Every alert should map to something you'll do | n/a |
| After each deploy | PostHog error tracking (new issues?), p95 of the main routes in traces, Grafana host panel | 10 min |
| Weekly | Triage open error issues, slowest traces, memory and disk trend, RDS free storage and CPU credits | 15 min |
| Monthly | Usage against free tiers (PostHog GB, Grafana series, CloudWatch metrics). Prune noisy alerts | 15 min |

### Starter alert list

| # | Alert | Tool | Basis |
|---|---|---|---|
| 1 | `/health` fails from a probe 2 checks in a row | Grafana SM or Better Stack | Black-box probing and "for" duration are sourced [sre-alerting]. Threshold is opinion |
| 2 | Root filesystem <5% free (warning), <3% (critical) | Grafana | **Shipped rule** `NodeFilesystemAlmostOutOfSpace` [g-linux] |
| 3 | Memory pressure | Grafana | **Shipped rule** `NodeMemoryHighUtilization` [g-linux] (threshold not stated in docs) |
| 4 | Host rebooted / systemd service failed | Grafana | **Shipped rules** `NodeHasRebooted` and `NodeSystemdServiceFailed` [g-linux] |
| 5 | EC2 `StatusCheckFailed` ≥1 for 2 minutes | CloudWatch | Metric is sourced [aws-ec2-metrics]. Threshold is opinion |
| 6 | t4g `CPUCreditBalance` low (for example <20% of max) | CloudWatch or Grafana | Metric is sourced [aws-ec2-metrics]. Threshold is opinion |
| 7 | RDS `FreeStorageSpace` <20%, `FreeableMemory` low, `CPUCreditBalance` low | CloudWatch or Grafana | Metrics are sourced [aws-rds-metrics]. Thresholds are opinion |
| 8 | New or reopened error issue in the API | PostHog | Feature is sourced [ph-err-alerts] |
| 9 | Error issue spike | PostHog | Feature is sourced [ph-err-alerts] |
| 10 | Log count with `severity=error` and `service.name=api` >N in 10 minutes | PostHog log alert | Mechanism is sourced [ph-log-alerts]. N is opinion |

---

## 6. Fastify integration sketch (notes only, no repo changes)

### Identity and session propagation

- **Frontend.** Add `tracing_headers: ['api.pontoejc.com']` to `posthog.init` in `app/src/main.tsx`. This needs posthog-js ≥1.380 (the app has ^1.416). It adds `X-POSTHOG-DISTINCT-ID` and `X-POSTHOG-SESSION-ID` to `fetch` and XHR, which covers axios [ph-js-config].
- **CORS.** `@fastify/cors` without `allowedHeaders` reflects the preflight's requested headers, so no change is needed [fastify-cors].
- **distinct_id already matches.** The frontend calls `identify(user.sub)`, and the API's `extractUserInformationFromToken` returns `authId = sub`. Use the **verified JWT `sub`** as the distinct ID. PostHog warns that the tracing headers are client-controlled and must never be treated as identity or authorization [ph-fastify][ph-node]. The session ID header is fine for *linking* only.

### Errors (posthog-node, ≥5.52 for tracing; latest is 5.57.1)

- PostHog's Fastify guide uses an `onRequest` hook with `withContext`, `setErrorHandler` with `captureException` for 5xx, and an `onClose` hook that calls `shutdown()`. It notes that process-level `enableExceptionAutocapture` **doesn't** see errors Fastify handles [ph-fastify].
- **This repo's catch:** route handlers already `try/catch` and call `fastifyErrorHandler(reply, error)`, so Fastify's `setErrorHandler` won't see most errors. The capture point is the **non-`AppError` branch** of `api/src/shared/fastify-error-handler.ts`. It needs the `request` (for `sub` and session ID), so its signature has to change. Keep `setErrorHandler` as well, as a safety net.
- **Auth runs late.** Auth0 runs in a per-route `preHandler` (`api/src/shared/fastify-auth-guard.ts`), not in `onRequest`, so `onRequest` context won't know the user yet. Pass the distinct ID explicitly to `captureException`, as the guide suggests for late auth [ph-fastify].
- **Side findings (verify):**
  - `fastifyErrorHandler` logs with `console.log`, which bypasses pino, so those lines won't reach the OTel Pino instrumentation.
  - Its 500 branch does `return reply.code(500)` with no `.send()`.

### Logs (pino → OTel → PostHog)

- **Packages:** `@opentelemetry/sdk-node`, `exporter-logs-otlp-http`, `sdk-logs`, `resources`, `instrumentation-pino` (Pino v7–v10 supported, and the repo has pino 9.7). The endpoint is `https://us.i.posthog.com/i/v1/logs` with a `Bearer phc_…` token [ph-pino][ph-logs-node].
- **The API is ESM**, so load the SDK with `--import` and register the OTel loader hook (`@opentelemetry/instrumentation/hook.mjs`) [ph-pino][otel-esm]. Combining that with `--experimental-strip-types` is **untested**: add `--import ./src/instrumentation.ts` to the `start` script and check that the patching works.
- **Link logs to a user** by putting `posthogDistinctId` and `sessionId` on log attributes [ph-logs-replay]. For example, use a pino child logger per request after auth.
- **Drop `/health`** from logs and traces, which PostHog's cost guide explicitly recommends [ph-logs-pricing].

### Traces

- **Packages:**
  - `@fastify/otel`. `@opentelemetry/instrumentation-fastify` is **deprecated in favour of it** [otel-fastify-dep].
  - `@opentelemetry/instrumentation-http`, which `@fastify/otel` needs for propagation [otel-fastify].
  - `@opentelemetry/instrumentation-pg`, because Drizzle runs on `pg`.
  - `@opentelemetry/exporter-trace-otlp-proto`, pointed at `/i/v1/traces` [ph-trace-node].
- **Register `@fastify/otel`** with `registerOnInitialization: true` inside the same SDK file [otel-fastify]. One `NodeSDK` serves logs and traces, because they share PostHog's pipeline [ph-trace-basics].
- **Set `posthogDistinctId` and `sessionId` as span attributes yourself.** Only the posthog-node path does it automatically [ph-trace-node].
- **Alternative:** posthog-node `traces: {serviceName}` with `withSpan`. It has no OTel dependency, but it's manual-only and its API is experimental [ph-trace-node][ph-node].

### Metrics

- Skip them for now because they're alpha [ph-metrics]. Traces already give RED-style latency and error data. If you need trends, use log-based metrics [ph-log-metrics].

### Plumbing

- Put the PostHog token in the API env (`api/src/core/envs/env.ts`).
- Call `posthog.shutdown()` in `onClose` and `sdk.shutdown()` on SIGTERM [ph-fastify][ph-pino].

---

## 7. Sources

Reference definitions (rendered as links above):

[ph-logs-install]: https://posthog.com/docs/logs/installation
[ph-logs-node]: https://posthog.com/docs/logs/installation/nodejs
[ph-pino]: https://posthog.com/docs/logs/installation/pino
[ph-logs-search]: https://posthog.com/docs/logs/search
[ph-logql]: https://posthog.com/docs/logs/logql-api
[ph-log-metrics]: https://posthog.com/docs/logs/metrics
[ph-logs-replay]: https://posthog.com/docs/logs/link-session-replay
[ph-log-alerts]: https://posthog.com/docs/logs/alerts
[ph-logs-pricing]: https://posthog.com/docs/logs/pricing
[ph-metrics]: https://posthog.com/docs/metrics
[ph-metrics-explore]: https://posthog.com/docs/metrics/explore
[ph-metrics-docker]: https://posthog.com/docs/metrics/installation/docker
[ph-trace-start]: https://posthog.com/docs/distributed-tracing/start-here
[ph-trace-node]: https://posthog.com/docs/distributed-tracing/installation/nodejs
[ph-trace-basics]: https://posthog.com/docs/distributed-tracing/basics
[ph-node]: https://posthog.com/docs/libraries/node
[ph-fastify]: https://posthog.com/docs/libraries/fastify
[ph-js-config]: https://posthog.com/docs/libraries/js/config#tracing-headers
[ph-alerts]: https://posthog.com/docs/alerts
[ph-err-alerts]: https://posthog.com/docs/error-tracking/alerts
[ph-err-pricing]: https://posthog.com/docs/error-tracking/pricing
[ph-pricing]: https://posthog.com/pricing
[ph-replay-ret]: https://posthog.com/docs/session-replay/data-retention
[ph-selfhost]: https://posthog.com/docs/self-host
[ph-sql]: https://posthog.com/docs/sql
[ph-llms]: https://posthog.com/llms.txt
[g-pricing]: https://grafana.com/pricing/
[g-scrape]: https://grafana.com/docs/alloy/latest/reference/components/prometheus/prometheus.scrape/
[g-dpm]: https://grafana.com/docs/grafana-cloud/platform/cost-management-and-billing/analyze-costs/reduce-costs/metrics-costs/adjust-data-points-per-minute/
[g-alloy-res]: https://grafana.com/docs/alloy/latest/introduction/estimate-resource-usage/
[g-linux]: https://grafana.com/docs/grafana-cloud/monitor-infrastructure/integrations/integration-reference/integration-linux-node/
[g-docker]: https://grafana.com/docs/grafana-cloud/monitor-infrastructure/integrations/integration-reference/integration-docker/
[g-cw]: https://grafana.com/docs/grafana-cloud/monitor-infrastructure/monitor-cloud-provider/aws/cloudwatch-metrics/
[g-sm-checks]: https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/checks/
[g-faro]: https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/
[g-metas]: https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/architecture/metas/
[g-faro-tracing]: https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/instrument/tracing-instrumentation/
[g-fingerprint]: https://grafana.com/docs/grafana-cloud/observe-and-act/monitor-applications/frontend-observability/configure/error-fingerprinting/
[g-replay]: https://grafana.com/docs/grafana-cloud/observe-and-act/monitor-applications/session-replay/
[g-appo11y]: https://grafana.com/docs/grafana-cloud/monitor-applications/application-observability/
[g-contact]: https://grafana.com/docs/grafana/latest/alerting/fundamentals/notifications/contact-points/
[g-postgres]: https://grafana.com/docs/grafana/latest/datasources/postgres/
[g-oss]: https://github.com/grafana/grafana
[aws-ec2-metrics]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/viewing_metrics_with_cloudwatch.html
[aws-agent-metrics]: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/metrics-collected-by-CloudWatch-agent.html
[aws-ec2-health]: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Solution-EC2-Health.html
[aws-agent-dl]: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/download-CloudWatch-Agent-on-EC2-Instance-commandline-first.html
[aws-cw-pricing]: https://aws.amazon.com/cloudwatch/pricing/
[aws-rds-cw]: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/monitoring-cloudwatch.html
[aws-rds-metrics]: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-metrics.html
[aws-t4]: https://aws.amazon.com/ec2/instance-types/t4/
[bs-pricing]: https://betterstack.com/pricing
[bs-uptime]: https://betterstack.com/uptime
[bs-collector]: https://betterstack.com/docs/logs/collector/
[sentry]: https://sentry.io/pricing/
[dd]: https://www.datadoghq.com/pricing/
[nr]: https://newrelic.com/pricing
[axiom]: https://axiom.co/pricing
[otel-fastify]: https://github.com/fastify/otel
[otel-fastify-dep]: https://www.npmjs.com/package/@opentelemetry/instrumentation-fastify
[otel-esm]: https://github.com/open-telemetry/opentelemetry-js/blob/main/doc/esm-support.md
[fastify-cors]: https://github.com/fastify/fastify-cors#options
[prom-config]: https://prometheus.io/docs/prometheus/latest/configuration/configuration/
[sre-monitoring]: https://sre.google/sre-book/monitoring-distributed-systems/
[sre-alerting]: https://sre.google/sre-book/practical-alerting/

**PostHog**

- ph-logs-install: https://posthog.com/docs/logs/installation
- ph-logs-node: https://posthog.com/docs/logs/installation/nodejs
- ph-pino: https://posthog.com/docs/logs/installation/pino
- ph-logs-search: https://posthog.com/docs/logs/search
- ph-logql: https://posthog.com/docs/logs/logql-api
- ph-log-metrics: https://posthog.com/docs/logs/metrics
- ph-logs-replay: https://posthog.com/docs/logs/link-session-replay
- ph-log-alerts: https://posthog.com/docs/logs/alerts
- ph-logs-pricing: https://posthog.com/docs/logs/pricing
- ph-metrics: https://posthog.com/docs/metrics
- ph-metrics-explore: https://posthog.com/docs/metrics/explore
- ph-metrics-docker: https://posthog.com/docs/metrics/installation/docker
- ph-trace-start: https://posthog.com/docs/distributed-tracing/start-here
- ph-trace-node: https://posthog.com/docs/distributed-tracing/installation/nodejs
- ph-trace-basics: https://posthog.com/docs/distributed-tracing/basics
- ph-node: https://posthog.com/docs/libraries/node
- ph-fastify: https://posthog.com/docs/libraries/fastify
- ph-js-config: https://posthog.com/docs/libraries/js/config#tracing-headers
- ph-alerts: https://posthog.com/docs/alerts
- ph-err-alerts: https://posthog.com/docs/error-tracking/alerts
- ph-err-pricing: https://posthog.com/docs/error-tracking/pricing
- ph-pricing: https://posthog.com/pricing
- ph-replay-ret: https://posthog.com/docs/session-replay/data-retention
- ph-selfhost: https://posthog.com/docs/self-host
- ph-sql: https://posthog.com/docs/sql
- ph-llms (docs index): https://posthog.com/llms.txt

**Grafana**

- g-pricing: https://grafana.com/pricing/
- g-scrape: https://grafana.com/docs/alloy/latest/reference/components/prometheus/prometheus.scrape/
- g-dpm: https://grafana.com/docs/grafana-cloud/platform/cost-management-and-billing/analyze-costs/reduce-costs/metrics-costs/adjust-data-points-per-minute/
- g-alloy-res: https://grafana.com/docs/alloy/latest/introduction/estimate-resource-usage/
- g-linux: https://grafana.com/docs/grafana-cloud/monitor-infrastructure/integrations/integration-reference/integration-linux-node/
- g-docker: https://grafana.com/docs/grafana-cloud/monitor-infrastructure/integrations/integration-reference/integration-docker/
- g-cw: https://grafana.com/docs/grafana-cloud/monitor-infrastructure/monitor-cloud-provider/aws/cloudwatch-metrics/
- g-sm-checks: https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/checks/
- g-faro: https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/
- g-metas: https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/architecture/metas/
- g-faro-tracing: https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/instrument/tracing-instrumentation/
- g-fingerprint: https://grafana.com/docs/grafana-cloud/observe-and-act/monitor-applications/frontend-observability/configure/error-fingerprinting/
- g-replay: https://grafana.com/docs/grafana-cloud/observe-and-act/monitor-applications/session-replay/
- g-appo11y: https://grafana.com/docs/grafana-cloud/monitor-applications/application-observability/
- g-contact: https://grafana.com/docs/grafana/latest/alerting/fundamentals/notifications/contact-points/
- g-postgres: https://grafana.com/docs/grafana/latest/datasources/postgres/
- g-oss (license per GitHub API: grafana, loki and tempo are AGPL-3.0; alloy is Apache-2.0): https://github.com/grafana/grafana

**AWS**

- aws-ec2-metrics: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/viewing_metrics_with_cloudwatch.html
- aws-agent-metrics: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/metrics-collected-by-CloudWatch-agent.html
- aws-ec2-health: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Solution-EC2-Health.html
- aws-agent-dl: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/download-CloudWatch-Agent-on-EC2-Instance-commandline-first.html
- aws-cw-pricing: https://aws.amazon.com/cloudwatch/pricing/
- aws-rds-cw: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/monitoring-cloudwatch.html
- aws-rds-metrics: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-metrics.html
- aws-t4: https://aws.amazon.com/ec2/instance-types/t4/

**Others**

- bs-pricing: https://betterstack.com/pricing
- bs-uptime: https://betterstack.com/uptime
- bs-collector: https://betterstack.com/docs/logs/collector/
- sentry: https://sentry.io/pricing/
- dd: https://www.datadoghq.com/pricing/
- nr: https://newrelic.com/pricing
- axiom: https://axiom.co/pricing
- otel-fastify: https://github.com/fastify/otel
- otel-fastify-dep (npm `deprecated` field: "Deprecated in favor of @fastify/otel"): https://www.npmjs.com/package/@opentelemetry/instrumentation-fastify
- otel-esm: https://github.com/open-telemetry/opentelemetry-js/blob/main/doc/esm-support.md
- fastify-cors: https://github.com/fastify/fastify-cors#options
- prom-config: https://prometheus.io/docs/prometheus/latest/configuration/configuration/
- sre-monitoring: https://sre.google/sre-book/monitoring-distributed-systems/
- sre-alerting: https://sre.google/sre-book/practical-alerting/
