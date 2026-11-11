# The minicloud appliance. One image, no build step, no runtime npm install.
FROM oven/bun:1.4-alpine

# qrencode renders the shareable link as a scannable SVG.
RUN apk add --no-cache libqrencode-tools

WORKDIR /app

# No dependencies to install — the platform uses only Bun built-ins.
COPY package.json ./
COPY server/ ./server/
COPY generator/ ./generator/
COPY connectors/ ./connectors/
COPY gateway/ ./gateway/
COPY scripts/ ./scripts/

# Apps and the audit log persist here.
ENV DB_PATH=/data/minicloud.db
VOLUME /data

ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["bun", "server/index.ts"]
