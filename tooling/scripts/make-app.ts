#!/usr/bin/env npx tsx

/**
 * scripts/make-app.ts
 *
 * Scaffolds a new application service in apps/ using EJS templates
 * from scripts/.stubs/app/.
 *
 * What it creates:
 *   - cmd/main.go          (entrypoint)
 *   - internal/.gitkeep    (private package directory)
 *   - go.mod               (Go module definition)
 *   - package.json         (Turbo script contract + dependency graph)
 *   - .air.toml            (hot-reload configuration)
 *   - Dockerfile           (multi-stage production build)
 *
 * After scaffolding, it automatically re-syncs go.work to register
 * the new module in the Go workspace.
 *
 * Usage:
 *   npx tsx scripts/make-app.ts <name> [--deps logger,http,config]
 *   pnpm make:app <name>
 *   pnpm make:app notifications --deps logger,http
 *
 * Example:
 *   pnpm make:app notifications
 *   pnpm make:app payments --deps logger,config
 */

import ejs from "ejs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

// ─── Paths ────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APPS_DIR = path.join(ROOT, "apps");
const STUBS_DIR = path.join(__dirname, ".stubs", "app");

// ─── Types ────────────────────────────────────────────────

/** Template variables passed to every EJS stub */
interface StubContext {
  /** Lowercase service name (e.g. "auth") */
  name: string;
  /** Capitalized service name (e.g. "Auth") */
  nameTitle: string;
  /** Shared packages this app depends on (e.g. ["logger", "http"]) */
  deps: string[];
}

// ─── Helpers ──────────────────────────────────────────────

/**
 * Capitalizes the first letter of a string.
 *
 * @param str - The string to capitalize
 * @returns The string with the first character uppercased
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Creates a directory recursively if it doesn't exist.
 *
 * @param dir - Absolute path to the directory
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Renders an EJS template file with the given context variables.
 *
 * @param stubPath  - Relative path to the stub within STUBS_DIR (e.g. "cmd/main.go.ejs")
 * @param context   - Template variables to inject
 * @returns The rendered string content
 * @throws If the stub file doesn't exist
 */
function renderStub(stubPath: string, context: StubContext): string {
  const fullPath = path.join(STUBS_DIR, stubPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Stub not found: ${stubPath} (looked in ${fullPath})`);
  }

  const template = fs.readFileSync(fullPath, "utf-8");
  return ejs.render(template, context);
}

/**
 * Parses the --deps flag from command line arguments.
 * Expected format: --deps logger,http,config
 *
 * @param args - process.argv array
 * @returns Array of dependency names
 */
function parseDeps(args: string[]): string[] {
  const depsIdx = args.indexOf("--deps");

  if (depsIdx === -1 || depsIdx + 1 >= args.length) {
    // Default: depend on logger
    return ["logger"];
  }

  return args[depsIdx + 1]
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

// ─── Main ─────────────────────────────────────────────────

function main(): void {
  const name = process.argv[2];

  // Validate: name is required
  if (!name || name.startsWith("--")) {
    console.error("❌ Usage: pnpm make:app <name> [--deps logger,http]");
    console.error("   Example: pnpm make:app notifications");
    console.error("   Example: pnpm make:app payments --deps logger,config");
    process.exit(1);
  }

  // Validate: name must be lowercase alphanumeric with hyphens
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error(
      "❌ App name must start with a letter and contain only lowercase alphanumeric characters or hyphens.",
    );
    process.exit(1);
  }

  // Validate: app must not already exist
  const appDir = path.join(APPS_DIR, name);
  if (fs.existsSync(appDir)) {
    console.error(`❌ App already exists: apps/${name}/`);
    process.exit(1);
  }

  // Parse dependencies from --deps flag
  const deps = parseDeps(process.argv);

  // Build template context
  const context: StubContext = {
    name,
    nameTitle: capitalize(name),
    deps,
  };

  console.log(`\n🚀 Creating app: ${name}`);
  console.log(`   Dependencies: ${deps.length > 0 ? deps.join(", ") : "(none)"}\n`);

  // ── Create directories ────────────────────────────────
  ensureDir(path.join(appDir, "src"));
  ensureDir(path.join(appDir, "docker"));
  ensureDir(path.join(appDir, "env"));

  // ── Render and write stubs ────────────────────────────
  const files: Record<string, string> = {
    "src/main.go": renderStub("src/main.go.ejs", context),
    "go.mod": renderStub("go.mod.ejs", context),
    "package.json": renderStub("package.json.ejs", context),
    ".air.toml": renderStub(".air.toml.ejs", context),
    "env/.env.example": renderStub(".env.example.ejs", context),
    "docker/Dockerfile": renderStub("Dockerfile.ejs", context),
    "docker/compose.local.yaml": renderStub("docker/compose.local.yaml.ejs", context),
    "docker/compose.dev.yaml": renderStub("docker/compose.dev.yaml.ejs", context),
    "docker/compose.production.yaml": renderStub("docker/compose.production.yaml.ejs", context),
  };

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(appDir, filePath);
    fs.writeFileSync(fullPath, content, "utf-8");
    console.log(`  ✅ ${filePath}`);
  }

  // ── Auto-sync go.work ─────────────────────────────────
  console.log("\n🔄 Syncing go.work and setting up environment...");
  try {
    execSync("npx tsx tooling/scripts/go-workspace-sync.ts", {
      cwd: ROOT,
      stdio: "inherit",
    });
    execSync(`pnpm run --filter=@apps/${name} setup`, {
      cwd: ROOT,
      stdio: "inherit",
    });
    execSync("go mod tidy", {
      cwd: appDir,
      stdio: "inherit",
    });
    console.log("\n📦 Resolving workspace dependencies...");
    execSync("pnpm install", {
      cwd: ROOT,
      stdio: "inherit",
    });
  } catch {
    console.warn(
      "\n⚠️  Sync, setup, or dependency resolution failed — run manually: pnpm setup && pnpm install",
    );
  }

  // ── Success message ───────────────────────────────────
  console.log(`\n🎉 App "${name}" created successfully!`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Review Turbo dependencies in apps/${name}/package.json`);
  console.log(`   2. Add Go dependencies: cd apps/${name} && go get ...`);
  console.log(`   3. Update Dockerfile COPY lines if you add more shared packages`);
  console.log(`   4. Run: pnpm dev --filter=@apps/${name}`);
}

main();
