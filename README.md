<div align="center">
  <img src=".github/assets/banner.svg" alt="Fuelers Go Banner" width="100%" />

# 🚀 Fuelers Go Monorepo

**High-Performance Microservices Engineering System**

[![Monorepo Foundation CI](https://github.com/akouta/fuelers-go/actions/workflows/ci.yml/badge.svg)](https://github.com/akouta/fuelers-go/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.23-00ADD8.svg?style=flat&logo=go)](https://golang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-F69220.svg?style=flat&logo=pnpm)](https://pnpm.io/)

</div>

---

## 📖 Introduction

**Fuelers Go** is a production-grade monorepo starter designed for high-performing engineering teams. It harmonizes the speed of **pnpm/Turborepo** with the native power of **Go Workspaces**, providing an unparalleled developer experience for building distributed systems.

## 🗺️ Table of Contents

- [🚀 Quick Start](#-quick-start)
- [🏗️ Project Structure](#-project-structure)
- [🛠️ Core Commands](#️-core-commands)
- [📦 Scaffolding & Automation](#-scaffolding--automation)
- [🐳 Deployment & Docker](#-deployment--docker)
- [🧪 Quality Control](#-quality-control)
- [🤝 Credits & Contribution](#-credits--contribution)

---

## 🚀 Quick Start

### Prerequisites

- [Go 1.23+](https://go.dev/doc/install)
- [Node.js 18+](https://nodejs.org/)
- [pnpm 9+](https://pnpm.io/installation)
- [Docker & Compose](https://docs.docker.com/get-docker/)

### Setting up the Workspace

```bash
# Clone and install
git clone https://github.com/akouta/fuelers-go.git
cd fuelers-go
pnpm install

# Initialize local environments
pnpm setup
```

---

## 🏗️ Project Structure

This monorepo follows the **"Clean Root"** and **"src/ Entry"** architectural patterns.

```text
.
├── apps/                # Binary-producing microservices (@apps/*)
│   └── gateway/         # Example API Gateway
├── packages/            # Shared Go libraries (@packages/*)
│   └── logger/          # Shared logging system
├── scripts/             # Internal tooling & scaffolding
├── docs/                # Deep-dive documentation
├── go.work              # Native Go Workspace registration (AUTO-GENERATED)
├── package.json         # Workspace root configuration
└── turbo.json           # Task graph & orchestration
```

---

## 🛠️ Core Commands

We use **TurboRepo** to orchestrate all tasks across the monorepo.

| Command       | Action     | Description                                    |
| :------------ | :--------- | :--------------------------------------------- |
| `pnpm build`  | **Build**  | Compiles all apps and verifies packages.       |
| `pnpm test`   | **Test**   | Runs the full workspace test suite.            |
| `pnpm format` | **Format** | Enforces Prettier and Go standards.            |
| `pnpm setup`  | **Setup**  | Initializes local `.env` files from templates. |
| `pnpm dev`    | **Dev**    | Runs services with hot-reloading (via Air).    |

---

## 📦 Scaffolding & Automation

Accelerate your workflow with our built-in generators.

- [**`make:app` Guide**](./docs/make-app.md): Create a new API or worker service.
- [**`make:package` Guide**](./docs/make-package.md): Create a shared library.

```bash
# Example: Create an app with a logger dependency
pnpm make:app billing --deps logger
```

---

## 🐳 Deployment & Docker

Every service is production-ready out of the box.

- [**Deployment Documentation**](./docs/deployment.md)

| File                             | Purpose                                 |
| :------------------------------- | :-------------------------------------- |
| `docker/Dockerfile`              | Hardened, multi-stage production build. |
| `docker/compose.dev.yaml`        | Daily development (Hot-reload + Infra). |
| `docker/compose.production.yaml` | Production-hardened orchestration spec. |

---

## 🧪 Quality Control

1.  **Strict Linting**: Powered by `golangci-lint` (where configured).
2.  **Formatting**: Prettier for configuration files; `go fmt` for logic.
3.  **Workspace Integrity**: `go.work` is automatically synchronized on every package creation.

---

## 🤝 Credits & Contribution

Made with ❤️ by the **Fuelers Engineering Team**.

### Authors

- **Antigravity** (Architectural Lead)
- **fuelers-team** (Maintenance)

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
