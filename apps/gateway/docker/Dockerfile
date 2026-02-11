# ─── Stage 1: Build ──────────────────────────────────────────
#
# Builds the Gateway service binary.
#
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy this application's module only (deps are resolved via GitHub registry)
COPY apps/gateway ./apps/gateway/

# Download Go module dependencies
RUN go mod download -C apps/gateway

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-w -s" \
    -o /bin/gateway \
    ./apps/gateway/src/main.go

# ─── Stage 2: Runtime ───────────────────────────────────────
FROM alpine:latest

# Install CA certificates for HTTPS and timezone data
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /

COPY --from=builder /bin/gateway /gateway

EXPOSE 8080

ENTRYPOINT ["/gateway"]
