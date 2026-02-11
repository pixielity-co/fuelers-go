# 🚀 Application Scaffolding: `make:app`

The `make:app` script is the primary tool for creating new microservices within the Fuelers monorepo. It ensures that every new service follows our strict architectural standards (Service Identity, Clean Root, and Docker-Ready).

## 📂 Generated Structure

When you run `pnpm make:app <name>`, the following structure is created in `apps/<name>`:

```text
apps/<name>/
├── src/                # Go source code
│   └── main.go         # Service entry point
├── env/                # Environment configuration
│   └── .env.example    # Template for secrets (auto-copied to .env)
├── docker/             # Docker orchestration
│   ├── Dockerfile      # Production build specification
│   ├── compose.local.yaml        # Local infrastructure (DBs, etc.)
│   ├── compose.dev.yaml          # Hot-reload app + infra
│   └── compose.production.yaml   # Hardened production spec
├── .air.toml           # Hot-reload configuration (Air)
├── go.mod              # Go module definition
└── package.json        # TurboRepo task contract
```

## 🛠️ Usage

```bash
# Basic usage
pnpm make:app gateway

# With dependencies on shared packages
pnpm make:app gateway --deps logger,config,auth
```

## 🔄 Automation Features

1.  **Environment Setup**: Automatically creates the `env/` folder and runs `pnpm setup` to initialize the local `.env`.
2.  **Go Workspace Sync**: Immediately triggers `scripts/go-workspace-sync.ts` to register the new module in the root `go.work`.
3.  **Turbo Awareness**: Injects workspace dependencies into `package.json` so Turbo knows the build order.
4.  **Premium Docblocks**: Adds standard, professional headers to all generated files.

## 📝 Best Practices

- **Naming**: Use `kebab-case` for app names (e.g., `billing-service`).
- **Dependencies**: Only list packages that reside in the `packages/` directory.
- **Clean Root**: Never place code outside the `src/` directory. Configuration and metadata belong in the service root.
