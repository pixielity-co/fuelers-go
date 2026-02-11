#!/usr/bin/env npx tsx

/**
 * scripts/deploy-service.ts
 *
 * Logic-heavy deployment orchestrator that selects the correct
 * Docker Compose file based on environment and availability.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function main() {
  const serviceName = process.argv[2];
  // Parse --env from arguments
  const envArgIdx = process.argv.indexOf("--env");
  const deployEnv = envArgIdx !== -1 ? process.argv[envArgIdx + 1] : process.env.DEPLOY_ENV;

  if (!serviceName) {
    console.error("❌ Error: Service name is required.");
    process.exit(1);
  }

  const serviceDir = path.join(ROOT, "apps", serviceName);
  if (!fs.existsSync(serviceDir)) {
    console.error(`❌ Error: Service directory not found: apps/${serviceName}`);
    process.exit(1);
  }

  const dockerDir = path.join(serviceDir, "docker");
  const candidates: string[] = [];

  // 1. Try environment-specific files
  if (deployEnv) {
    candidates.push(`compose.${deployEnv}.yaml`, `compose.${deployEnv}.yml`);
  }

  // 2. Fallback to default files
  candidates.push("compose.yaml", "compose.yml");

  let selectedFile: string | null = null;
  for (const file of candidates) {
    const fullPath = path.join(dockerDir, file);
    if (fs.existsSync(fullPath)) {
      selectedFile = fullPath;
      break;
    }
  }

  if (!selectedFile) {
    console.error(
      `❌ Error: No valid Docker Compose file found for service "${serviceName}" in apps/${serviceName}/docker/`,
    );
    console.error(`Checked: ${candidates.join(", ")}`);
    process.exit(1);
  }

  const envLabel = deployEnv ? `[${deployEnv.toUpperCase()}]` : "[DEFAULT]";
  console.log(`\n🚀 Orchestrating deployment for ${envLabel} ${serviceName}...`);
  console.log(`📄 Using config: ${path.relative(ROOT, selectedFile)}\n`);

  try {
    // Run docker-compose up -d
    // We use -f for the selected file and set the project name for isolation
    execSync(`docker compose -f ${selectedFile} up -d --build`, {
      stdio: "inherit",
      env: { ...process.env, DEPLOY_ENV: deployEnv || "local" },
    });
    console.log(`\n✅ Service ${serviceName} deployed successfully.`);
  } catch (error) {
    console.error(`\n❌ Deployment failed for ${serviceName}. Check Docker logs.`);
    process.exit(1);
  }
}

main();
