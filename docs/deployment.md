# 🚀 Deployment & Containerization

Our monorepo uses a "Service Identity" approach where each service is self-contained for deployment but remains part of the unified build graph.

## 🐳 Docker Strategy

Each application includes a dedicated `docker/` folder:

### 1. `Dockerfile`

A multi-stage, hardened Dockerfile based on `golang:1.23-alpine`.

- **Stage 1 (Build)**: Compiles the binary from `src/main.go`.
- **Stage 2 (Runtime)**: Minimal `alpine:latest` image with only CA certificates and the binary.
- **Security**: Runs as a non-privileged user (where configured) and uses a read-only filesystem by default.

### 2. Compose Profiles

- **`compose.local.yaml`**: Standardized infrastructure (Databases, Redis). Does not run the app code.
- **`compose.dev.yaml`**: The developer's daily driver. Runs the app with hot-reload (Air) alongside its local infrastructure.
- **`compose.production.yaml`**: The "Gold Standard" for production environments. Includes resource limits, restart policies, and health checks.

## 🏗️ Deployment Workflow

1.  **Build**: `pnpm build` (Powered by TurboRepo).
2.  **Containerize**: Build the Docker image from the monorepo root:
    ```bash
    docker build -t gateway:latest -f apps/gateway/docker/Dockerfile .
    ```
3.  **Orchestrate**: Use the production compose spec:
    ```bash
    docker compose -f apps/gateway/docker/compose.production.yaml up -d
    ```

## 🌐 Networking

Services are designed to be VPC-ready. They communicate over internal Docker networks or service discovery in a Kubernetes cluster. Default exposure is on port `8080`.
