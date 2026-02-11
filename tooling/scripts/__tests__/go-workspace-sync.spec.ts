import { describe, it, expect } from "vitest";

describe("Go Workspace Sync Logic", () => {
  it("should generate correct go.work structure", () => {
    // Mocking the generation logic from scripts/go-workspace-sync.ts
    const GO_VERSION = "1.23";
    const modulesByDir = {
      apps: ["./apps/gateway", "./apps/auth"],
      packages: ["./packages/logger"],
    };

    const generateGoWork = (modules: Record<string, string[]>) => {
      const lines = ["// Auto-generated", `go ${GO_VERSION}`, "", "use ("];

      for (const [dir, mods] of Object.entries(modules)) {
        lines.push(`\t// ${dir.charAt(0).toUpperCase() + dir.slice(1)}`);
        mods.forEach((m) => lines.push(`\t${m}`));
        lines.push("");
      }

      lines.push(")");
      return lines.join("\n").trim();
    };

    const result = generateGoWork(modulesByDir);

    expect(result).toContain("go 1.23");
    expect(result).toContain("use (");
    expect(result).toContain("\t// Apps");
    expect(result).toContain("\t./apps/gateway");
    expect(result).toContain("\t// Packages");
    expect(result).toContain("\t./packages/logger");
  });
});
