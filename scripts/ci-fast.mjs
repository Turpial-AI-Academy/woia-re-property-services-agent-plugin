import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT } from "./lib/plugin.mjs";

const commands = [
  ["scripts/validate-plugin.mjs"],
  ["scripts/validate-source.mjs"],
];
if (existsSync(path.join(ROOT, "CHECKSUMS.sha256"))) commands.push(["scripts/check-checksums.mjs"]);
for (const args of commands) {
  const result = spawnSync(process.execPath, args, { cwd: ROOT, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
