# 📦 Package Scaffolding: `make:package`

The `make:package` script creates shared Go libraries in the `packages/` directory. These are intended to be high-quality, reusable components used by multiple applications.

## 📂 Generated Structure

```text
packages/<name>/
├── src/                # Library source code
│   └── <name>.go       # Package logic
├── .air.toml           # Test-watcher configuration
├── go.mod              # Go module definition
└── package.json        # TurboRepo task contract
```

## 🛠️ Usage

```bash
pnpm make:package logger
```

## 📜 Principles

1.  **Library-Centric**: Packages do not produce binaries. Their `build` task merely verifies that the code compiles.
2.  **Test-First**: The `.air.toml` for packages is configured to run `go test ./...` on every save, encouraging a test-driven development workflow.
3.  **No Environment**: Packages should be stateless or configuration-driven. They do not have `env/` folders or Dockerfiles.
4.  **Turbo Integration**: Registered as `@packages/<name>` in the workspace.

## 🔗 Consuming a Package

Once created, you can add the package to an application:

1.  **Automated**: Use the `--deps` flag when creating the app.
2.  **Manual**: Add `"@packages/<name>": "workspace:*"` to the app's `package.json` and run `pnpm install`.
