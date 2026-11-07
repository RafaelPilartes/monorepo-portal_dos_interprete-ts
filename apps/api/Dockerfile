# API image, explicit for the monorepo (architecture.md §6, FP-04).
# Build from the repository root:  docker build -f apps/api/Dockerfile .
# Behind a TLS-intercepting proxy, pass its CA as a build secret:
#   docker build --secret id=ca,src=<ca.crt> --network host \
#     --build-arg HTTPS_PROXY=$HTTPS_PROXY -f apps/api/Dockerfile .
FROM node:22-alpine AS build
WORKDIR /repo
ARG HTTPS_PROXY
ARG GIT_COMMIT=unknown
RUN --mount=type=secret,id=ca,required=false \
    if [ -f /run/secrets/ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/ca; fi; \
    npm install -g pnpm@10.28.0
COPY . .
RUN --mount=type=secret,id=ca,required=false \
    if [ -f /run/secrets/ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/ca; fi; \
    pnpm install --frozen-lockfile --filter @portal-dos-interpretes/api... \
    && pnpm --filter @portal-dos-interpretes/api build \
    && pnpm --filter @portal-dos-interpretes/api deploy --prod --legacy /out/api

FROM node:22-alpine AS runtime
ARG GIT_COMMIT=unknown
ENV NODE_ENV=production \
    GIT_COMMIT=${GIT_COMMIT} \
    PORT=3000
WORKDIR /app
COPY --from=build /out/api ./
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
