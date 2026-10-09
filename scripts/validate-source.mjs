import { execFileSync, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ROOT, assert } from "./lib/plugin.mjs";

const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: ROOT }).toString().split("\0").filter(Boolean);
let checked = 0;
for (const file of files) {
  if (file.endsWith(".json")) { JSON.parse(await readFile(path.join(ROOT, file), "utf8")); checked++; }
  if (/\.(?:mjs|cjs|js)$/.test(file)) {
    const result = spawnSync(process.execPath, ["--check", path.join(ROOT, file)], { encoding: "utf8" });
    assert(result.status === 0, `Source syntax failed: ${file}: ${result.stderr || result.error || result.status}`);
    checked++;
  }
}
assert(checked > 0, "Source validation requires actual JSON or JavaScript files");
console.log(`validate:source: ${checked} JSON/JavaScript source files OK`);
