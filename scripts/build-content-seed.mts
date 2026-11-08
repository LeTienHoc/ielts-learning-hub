#!/usr/bin/env node
// pnpm content:seed — validates content/practice-sets/*.json and writes supabase/seed.sql.
// Run `pnpm db:reset` afterwards to load it into the local database.

import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  practiceSetSourceSchema,
  type PracticeSetSource,
} from "../src/lib/content/practice-set-schema.ts"
import { buildSeedSql } from "./content-seed.mts"

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const contentDir = path.join(projectRoot, "content", "practice-sets")
const target = path.join(projectRoot, "supabase", "seed.sql")

const files = readdirSync(contentDir)
  .filter((name) => name.endsWith(".json"))
  .sort()

const sets: PracticeSetSource[] = []
let hasErrors = false

for (const file of files) {
  const raw: unknown = JSON.parse(readFileSync(path.join(contentDir, file), "utf8"))
  const result = practiceSetSourceSchema.safeParse(raw)
  if (!result.success) {
    hasErrors = true
    console.error(`${file}:`)
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".") || "(set)"}: ${issue.message}`)
    }
    continue
  }
  sets.push(result.data)
}

if (hasErrors) process.exit(1)

writeFileSync(target, buildSeedSql(sets), "utf8")
console.log(
  `Wrote supabase/seed.sql with ${sets.length} practice set(s) from ${files.length} file(s).`,
)
