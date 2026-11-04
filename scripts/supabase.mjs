#!/usr/bin/env node
// Runs the Supabase CLI with the given arguments from the project root.
//
// On Linux/macOS the `supabase` binary on PATH is used directly.
// On Windows, Docker for this project may live inside WSL, so the Linux CLI is run there:
//   - distro: $SUPABASE_WSL_DISTRO, otherwise the default WSL distro
//   - binary: `supabase` on the WSL PATH, otherwise ~/.local/bin/supabase
// Set SUPABASE_NATIVE=1 on Windows to use a Windows `supabase` binary (e.g. with Docker Desktop).
// See docs/development/setup.md.

import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const args = process.argv.slice(2)
const useWsl = process.platform === "win32" && process.env.SUPABASE_NATIVE !== "1"

const result = useWsl
  ? spawnSync(
      "wsl.exe",
      [
        ...(process.env.SUPABASE_WSL_DISTRO ? ["-d", process.env.SUPABASE_WSL_DISTRO] : []),
        "--cd",
        projectRoot,
        "--exec",
        "bash",
        "-c",
        'bin="$(command -v supabase || echo "$HOME/.local/bin/supabase")"; exec "$bin" "$@"',
        "supabase",
        ...args,
      ],
      { stdio: "inherit" },
    )
  : spawnSync("supabase", args, { cwd: projectRoot, stdio: "inherit", shell: false })

if (result.error) {
  console.error(`Could not run the Supabase CLI: ${result.error.message}`)
  process.exit(1)
}
process.exit(result.status ?? 1)
