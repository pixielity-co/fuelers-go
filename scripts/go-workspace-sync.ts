#!/usr/bin/env npx tsx

/**
 * scripts/go-workspace-sync.ts
 *
 * Auto-discovers Go modules by reading the workspace configuration
 * (pnpm-workspace.yaml or package.json workspaces) and regenerates
 * the root go.work file.
 *
 * This prevents go.work drift — the #1 cause of broken builds in
 * Go monorepos when teams forget to register new modules.
 *
 * Usage:
 *   npx tsx scripts/go-workspace-sync.ts
 *   pnpm workspace:sync
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ─── Constants ────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const GO_WORK_PATH = path.join(ROOT, "go.work");
const GO_VERSION = "1.23";

// ─── Types ────────────────────────────────────────────────

interface RootPackageJson {
  packageManager?: string;
  workspaces?: string[] | { packages: string[] };
}

interface PnpmWorkspace {
  packages: string[];
}

// ─── Workspace Detection ──────────────────────────────────

/**
 * Detects the package manager from root package.json.
 * Returns "pnpm", "yarn", "npm", or "unknown".
 */
function detectPackageManager(): string {
  const pkgJsonPath = path.join(ROOT, "package.json");

  if (!fs.existsSync(pkgJsonPath)) {
    return "unknown";
  }

  const pkgJson: RootPackageJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));

  if (pkgJson.packageManager) {
    const name = pkgJson.packageManager.split("@")[0];
    return name || "unknown";
  }

  // Fallback: check for lockfiles
  if (fs.existsSync(path.join(ROOT, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(ROOT, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(ROOT, "package-lock.json"))) return "npm";

  return "unknown";
}

/**
 * Parses pnpm-workspace.yaml manually (no external YAML dependency).
 * Expected format:
 *   packages:
 *     - "apps/*"
 *     - "packages/*"
 */
function parsePnpmWorkspace(): string[] {
  const filePath = path.join(ROOT, "pnpm-workspace.yaml");

  if (!fs.existsSync(filePath)) {
    console.warn("⚠️  pnpm-workspace.yaml not found");
    return [];
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const globs: string[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    // Match lines like: - "apps/*"  or  - 'apps/*'  or  - apps/*
    const match = trimmed.match(/^-\s+["']?([^"']+)["']?\s*$/);
    if (match) {
      globs.push(match[1]);
    }
  }

  return globs;
}

/**
 * Reads workspace globs from package.json "workspaces" field.
 * Handles both array format and object format ({ packages: [...] }).
 */
function readPackageJsonWorkspaces(): string[] {
  const pkgJsonPath = path.join(ROOT, "package.json");

  if (!fs.existsSync(pkgJsonPath)) {
    return [];
  }

  const pkgJson: RootPackageJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));

  if (!pkgJson.workspaces) return [];

  if (Array.isArray(pkgJson.workspaces)) {
    return pkgJson.workspaces;
  }

  return pkgJson.workspaces.packages || [];
}

/**
 * Resolves workspace globs into the actual workspace root directories.
 * For example, "apps/*" → ["apps"]
 */
function resolveWorkspaceGlobs(globs: string[]): string[] {
  const dirs: string[] = [];

  for (const glob of globs) {
    // Strip trailing glob patterns like /* or /**
    const baseDir = glob.replace(/\/\*\*?$/, "").replace(/\/\*$/, "");
    if (baseDir && !dirs.includes(baseDir)) {
      dirs.push(baseDir);
    }
  }

  return dirs.sort();
}

/**
 * Determines workspace scan directories by reading the appropriate
 * workspace configuration file based on the detected package manager.
 */
function getWorkspaceDirs(): string[] {
  const pm = detectPackageManager();
  console.log(`📦 Detected package manager: ${pm}`);

  let globs: string[];

  if (pm === "pnpm") {
    console.log("📄 Reading workspace config from: pnpm-workspace.yaml");
    globs = parsePnpmWorkspace();
  } else {
    console.log("📄 Reading workspace config from: package.json workspaces");
    globs = readPackageJsonWorkspaces();
  }

  if (globs.length === 0) {
    console.error("❌ No workspace globs found. Check your workspace config.");
    process.exit(1);
  }

  const dirs = resolveWorkspaceGlobs(globs);
  console.log(`🔎 Workspace directories: ${dirs.join(", ")}\n`);

  return dirs;
}

// ─── Module Discovery ─────────────────────────────────────

/**
 * Discovers directories containing a go.mod file
 * within the given base directory (one level deep).
 */
function discoverModules(baseDir: string): string[] {
  const modules: string[] = [];
  const fullBase = path.join(ROOT, baseDir);

  if (!fs.existsSync(fullBase)) {
    console.warn(`⚠️  Directory not found: ${baseDir}/`);
    return modules;
  }

  const entries = fs.readdirSync(fullBase, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const modPath = path.join(fullBase, entry.name, "go.mod");
    if (fs.existsSync(modPath)) {
      modules.push(`./${baseDir}/${entry.name}`);
    }
  }

  return modules.sort();
}

// ─── go.work Generation ───────────────────────────────────

/**
 * Generates the go.work file content with grouped sections
 * and documentation comments.
 */
function generateGoWork(modulesByDir: Record<string, string[]>): string {
  const lines: string[] = [
    "// Auto-generated by scripts/go-workspace-sync.ts",
    "// Do NOT edit manually — run: pnpm workspace:sync",
    "//",
    "// This file allows Go to recognize multiple modules within the repository",
    "// without needing manual 'replace' directives in each go.mod file.",
    `go ${GO_VERSION}`,
    "",
    "use (",
  ];

  const dirEntries = Object.entries(modulesByDir);

  for (let i = 0; i < dirEntries.length; i++) {
    const [dir, modules] = dirEntries[i];
    if (modules.length === 0) continue;

    // Capitalize the section header (e.g. "apps" → "Apps")
    const label = dir.charAt(0).toUpperCase() + dir.slice(1);
    lines.push(`\t// ${label}`);

    for (const mod of modules) {
      lines.push(`\t${mod}`);
    }

    // Add blank line between sections, but not after the last one
    if (i < dirEntries.length - 1) {
      lines.push("");
    }
  }

  lines.push(")");
  lines.push("");

  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────

function main(): void {
  console.log("🔍 Scanning for Go modules...\n");

  const scanDirs = getWorkspaceDirs();

  const modulesByDir: Record<string, string[]> = {};
  let totalModules = 0;

  for (const dir of scanDirs) {
    const modules = discoverModules(dir);
    modulesByDir[dir] = modules;
    totalModules += modules.length;

    if (modules.length > 0) {
      console.log(`  📦 ${dir}/`);
      for (const mod of modules) {
        console.log(`     └─ ${mod}`);
      }
    }
  }

  if (totalModules === 0) {
    console.error("❌ No Go modules found. Nothing to sync.");
    process.exit(1);
  }

  const content = generateGoWork(modulesByDir);

  // Check if go.work already exists and compare
  if (fs.existsSync(GO_WORK_PATH)) {
    const existing = fs.readFileSync(GO_WORK_PATH, "utf-8");
    if (existing === content) {
      console.log("\n✅ go.work is already up to date.");
      return;
    }
  }

  fs.writeFileSync(GO_WORK_PATH, content, "utf-8");
  console.log(`\n✅ go.work synced — ${totalModules} modules registered.`);
}

main();
