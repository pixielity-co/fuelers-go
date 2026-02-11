#!/usr/bin/env npx tsx

/**
 * scripts/make-package.ts
 *
 * Scaffolds a new shared library package in packages/ using EJS
 * templates from scripts/.stubs/package/.
 *
 * What it creates:
 *   - <name>.go         (package source file)
 *   - go.mod            (Go module definition)
 *   - package.json      (Turbo script contract — no dev/deploy)
 *
 * After scaffolding, it automatically re-syncs go.work to register
 * the new module in the Go workspace.
 *
 * Usage:
 *   npx tsx scripts/make-package.ts <name>
 *   pnpm make:package <name>
 *
 * Example:
 *   pnpm make:package middleware
 *   pnpm make:package validation
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
const PACKAGES_DIR = path.join(ROOT, "packages");
const STUBS_DIR = path.join(__dirname, ".stubs", "package");

// ─── Types ────────────────────────────────────────────────

/** Template variables passed to every EJS stub */
interface StubContext {
  /** Lowercase package name (e.g. "logger") */
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────

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
 * @param stubPath  - Relative path to the stub within STUBS_DIR
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

// ─── Main ─────────────────────────────────────────────────

function main(): void {
  const name = process.argv[2];

  // Validate: name is required
  if (!name || name.startsWith("--")) {
    console.error("❌ Usage: pnpm make:package <name>");
    console.error("   Example: pnpm make:package middleware");
    process.exit(1);
  }

  // Validate: name must be lowercase alphanumeric with hyphens
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error(
      "❌ Package name must start with a letter and contain only lowercase alphanumeric characters or hyphens.",
    );
    process.exit(1);
  }

  // Validate: package must not already exist
  const pkgDir = path.join(PACKAGES_DIR, name);
  if (fs.existsSync(pkgDir)) {
    console.error(`❌ Package already exists: packages/${name}/`);
    process.exit(1);
  }

  // Build template context
  const context: StubContext = { name };

  console.log(`\n📦 Creating package: ${name}\n`);

  // ── Create directory ──────────────────────────────────
  ensureDir(path.join(pkgDir, "src"));

  // ── Render and write stubs ────────────────────────────
  const files: Record<string, string> = {
    [`src/${name}.go`]: renderStub("__name__.go.ejs", context),
    "go.mod": renderStub("go.mod.ejs", context),
    "package.json": renderStub("package.json.ejs", context),
    ".air.toml": renderStub("air.toml", context),
  };

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(pkgDir, filePath);
    fs.writeFileSync(fullPath, content, "utf-8");
    console.log(`  ✅ ${filePath}`);
  }

  // ── Auto-sync go.work ─────────────────────────────────
  console.log("\n🔄 Syncing go.work and setting up package...");
  try {
    execSync("npx tsx tooling/scripts/go-workspace-sync.ts", {
      cwd: ROOT,
      stdio: "inherit",
    });
    execSync(`pnpm run --filter=@packages/${name} setup`, {
      cwd: ROOT,
      stdio: "inherit",
    });
    execSync("go mod tidy", {
      cwd: pkgDir,
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
  console.log(`\n🎉 Package "${name}" created successfully!`);
  console.log(`\n📝 Next steps:`);
  console.log(
    `   1. Add as dependency in consuming apps' package.json: "@packages/${name}": "workspace:*"`,
  );
  console.log(`   2. Import in Go: import "fuelers-go/packages/${name}"`);
  console.log(`   3. Run: pnpm test --filter=@packages/${name}`);
}

main();
