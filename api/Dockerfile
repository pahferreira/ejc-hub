# Build context must be the REPO ROOT (not api/): the api imports shared code
# from ../common via relative paths, so the image needs both packages laid out
# exactly like the repo (/app/api + /app/common).
FROM node:24-alpine AS base

# -------------

FROM base AS deps
WORKDIR /app/api

COPY api/package*.json ./

RUN npm install --omit=dev

# -------------

FROM base AS runner
WORKDIR /app/api

ENV NODE_ENV=production

# RDS serves certificates signed by Amazon's RDS CA, which is not in Node's
# default trust store — without this, sslmode=require fails chain verification
# (SELF_SIGNED_CERT_IN_CHAIN). NODE_EXTRA_CA_CERTS appends it process-wide.
ADD --chmod=444 https://truststore.pki.rds.amazonaws.com/us-east-1/us-east-1-bundle.pem /etc/ssl/certs/rds-us-east-1-bundle.pem
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/rds-us-east-1-bundle.pem

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api

COPY --chown=api:nodejs api/ /app/api/
COPY --chown=api:nodejs common/ /app/common/
COPY --from=deps --chown=api:nodejs /app/api/node_modules ./node_modules

USER api

EXPOSE 3333

ENV PORT=3333
ENV HOSTNAME="0.0.0.0"

# CMD (not ENTRYPOINT) so one-off commands can replace it, e.g.
# `docker compose run --rm api npm run db:migrate`.
CMD ["npm", "run", "start"]
