# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Vendor the ORT wasm and the pinned model same-origin, then build the SPA.
RUN node scripts/copy-ort.mjs \
  && node scripts/fetch-model.mjs \
  && npm run build

FROM nginx:1.27-alpine
COPY nginx/isolation.conf /etc/nginx/snippets/isolation.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY docker/40-write-env.sh /docker-entrypoint.d/40-write-env.sh
RUN chmod +x /docker-entrypoint.d/40-write-env.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# The base image entrypoint runs /docker-entrypoint.d/*.sh then starts nginx.
