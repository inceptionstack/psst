/**
 * Integration tests for `psst init --backend aws` — exercises the CLI
 * through a subprocess so we cover the argv parsing, config file writing,
 * and findVaultPath lookup in one shot.
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLI = new URL("../main.ts", import.meta.url).pathname;

describe("psst init --backend aws (integration)", () => {
  let cwd: string;

  beforeEach(() => {
    cwd = join(
      tmpdir(),
      `psst-init-aws-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(cwd, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(cwd, { recursive: true, force: true });
    } catch {}
  });

  function run(args: string[]) {
    return spawnSync(
      process.execPath.includes("bun") ? process.execPath : "bun",
      ["run", CLI, ...args],
      {
        cwd,
        env: { ...process.env },
        encoding: "utf-8",
      },
    );
  }

  it("writes config.json with the expected shape", () => {
    const res = run([
      "init",
      "--backend",
      "aws",
      "--aws-region",
      "us-east-1",
      "--aws-prefix",
      "myprefix/",
      "--json",
    ]);
    expect(res.status).toBe(0);

    const cfgPath = join(cwd, ".psst", "envs", "default", "config.json");
    expect(existsSync(cfgPath)).toBe(true);

    const cfg = JSON.parse(readFileSync(cfgPath, "utf-8"));
    expect(cfg).toEqual({
      backend: "aws",
      aws: { region: "us-east-1", prefix: "myprefix/" },
    });
  });

  it("omits undefined aws options from config.json", () => {
    const res = run([
      "init",
      "--backend",
      "aws",
      "--aws-region",
      "eu-west-1",
      "--json",
    ]);
    expect(res.status).toBe(0);

    const cfg = JSON.parse(
      readFileSync(
        join(cwd, ".psst", "envs", "default", "config.json"),
        "utf-8",
      ),
    );
    expect(cfg).toEqual({
      backend: "aws",
      aws: { region: "eu-west-1" },
    });
    // Should NOT include undefined prefix/profile keys
    expect(Object.keys(cfg.aws)).toEqual(["region"]);
  });

  it("rejects unknown --backend values with a clear error", () => {
    const res = run(["init", "--backend", "gcp"]);
    expect(res.status).not.toBe(0);
    expect(res.stderr + res.stdout).toMatch(/Unknown .*backend.*gcp/i);
  });

  it("rejects --backend without a value", () => {
    const res = run(["init", "--backend"]);
    expect(res.status).not.toBe(0);
  });

  it("init --backend sqlite is equivalent to default (no config.json written)", () => {
    // Provide PSST_PASSWORD so sqlite init succeeds in environments without a
    // keychain (CI, containers).
    const res = spawnSync(
      process.execPath.includes("bun") ? process.execPath : "bun",
      ["run", CLI, "init", "--backend", "sqlite", "--json"],
      {
        cwd,
        env: { ...process.env, PSST_PASSWORD: "ci-password" },
        encoding: "utf-8",
      },
    );
    expect(res.status).toBe(0);

    // Sqlite path should create vault.db but skip config.json to keep
    // zero-config on the common case.
    const vaultDir = join(cwd, ".psst", "envs", "default");
    expect(existsSync(join(vaultDir, "vault.db"))).toBe(true);
    expect(existsSync(join(vaultDir, "config.json"))).toBe(false);
  });

  it("detects existing aws vault (by config.json) and refuses to re-init", () => {
    // First init succeeds
    const first = run([
      "init",
      "--backend",
      "aws",
      "--aws-region",
      "us-east-1",
    ]);
    expect(first.status).toBe(0);

    // Second init should detect the config.json and refuse
    const second = run([
      "init",
      "--backend",
      "aws",
      "--aws-region",
      "us-east-1",
    ]);
    expect(second.status).not.toBe(0);
    expect(second.stdout + second.stderr).toMatch(/already exists/i);
  });

  it("aws backend requires a region (config or env)", () => {
    const res = spawnSync(
      process.execPath.includes("bun") ? process.execPath : "bun",
      ["run", CLI, "init", "--backend", "aws"],
      {
        cwd,
        env: {
          ...Object.fromEntries(
            Object.entries(process.env).filter(
              ([k]) => k !== "AWS_REGION" && k !== "AWS_DEFAULT_REGION",
            ),
          ),
        },
        encoding: "utf-8",
      },
    );
    expect(res.status).not.toBe(0);
    expect(res.stdout + res.stderr).toMatch(/region/i);
  });

  it("falls back to AWS_REGION env var when --aws-region is omitted", () => {
    const res = spawnSync(
      process.execPath.includes("bun") ? process.execPath : "bun",
      ["run", CLI, "init", "--backend", "aws"],
      {
        cwd,
        env: { ...process.env, AWS_REGION: "eu-central-1" },
        encoding: "utf-8",
      },
    );
    expect(res.status).toBe(0);

    const cfg = JSON.parse(
      readFileSync(
        join(cwd, ".psst", "envs", "default", "config.json"),
        "utf-8",
      ),
    );
    // region not persisted when coming from env; loadConfig will re-resolve
    // from AWS_REGION at use-time. The config file stays clean.
    expect(cfg).toEqual({ backend: "aws", aws: {} });
  });
});
