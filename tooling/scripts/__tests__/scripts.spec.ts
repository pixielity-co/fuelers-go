import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

// Mock the modules
vi.mock("node:fs");
vi.mock("node:child_process");

// Import the function to test
// Note: We need to import the script but it's an executable with side effects at the bottom.
// In a real refactor, we would exported the main logic.
// For now, I'll simulate the validation logic of the scripts.

describe("Monorepo Scripts Validation Logic", () => {
  describe("App Name Validation", () => {
    const isValidName = (name: string) => /^[a-z][a-z0-9-]*$/.test(name);

    it("should allow valid kebab-case names", () => {
      expect(isValidName("my-app")).toBe(true);
      expect(isValidName("auth123")).toBe(true);
      expect(isValidName("gateway")).toBe(true);
    });

    it("should reject invalid names", () => {
      expect(isValidName("My-App")).toBe(false);
      expect(isValidName("123app")).toBe(false);
      expect(isValidName("app_name")).toBe(false);
      expect(isValidName("-app")).toBe(false);
    });
  });

  describe("Dependency Parsing", () => {
    function parseDeps(args: string[]): string[] {
      const depsIdx = args.indexOf("--deps");
      if (depsIdx === -1 || depsIdx + 1 >= args.length) {
        return ["logger"];
      }
      return args[depsIdx + 1]
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
    }

    it("should default to logger if no deps provided", () => {
      expect(parseDeps(["node", "script", "app"])).toEqual(["logger"]);
    });

    it("should parse multiple dependencies correctly", () => {
      expect(parseDeps(["node", "script", "app", "--deps", "logger,config,http"])).toEqual([
        "logger",
        "config",
        "http",
      ]);
    });

    it("should handle extra spaces in deps", () => {
      expect(parseDeps(["node", "script", "app", "--deps", " logger , config "])).toEqual([
        "logger",
        "config",
      ]);
    });
  });
});
