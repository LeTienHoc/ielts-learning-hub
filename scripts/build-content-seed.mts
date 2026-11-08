#!/usr/bin/env node
// pnpm content:seed — validates content/{practice-sets,vocabulary-sets,grammar-topics}/*.json
// and writes supabase/seed.sql. Run `pnpm db:reset` afterwards to load it locally.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import type { z } from "zod"

import { grammarTopicSourceSchema } from "../src/lib/content/grammar-schema.ts"
import { practiceSetSourceSchema } from "../src/lib/content/practice-set-schema.ts"
import { vocabularySetSourceSchema } from "../src/lib/content/vocabulary-schema.ts"
import { buildSeedSql } from "./content-seed.mts"

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const target = path.join(projectRoot, "supabase", "seed.sql")
let hasErrors = false

/** Parses every JSON file in content/<folder>; reports invalid fields per file. */
function load<TSchema extends z.ZodType>(folder: string, schema: TSchema): z.output<TSchema>[] {
  const dir = path.join(projectRoot, "content", folder)
  if (!existsSync(dir)) return []
  const items: z.output<TSchema>[] = []
  for (const file of readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()) {
    const raw: unknown = JSON.parse(readFileSync(path.join(dir, file), "utf8"))
    const result = schema.safeParse(raw)
    if (!result.success) {
      hasErrors = true
      console.error(`${folder}/${file}:`)
      for (const issue of result.error.issues) {
        console.error(`  - ${issue.path.join(".") || "(file)"}: ${issue.message}`)
      }
      continue
    }
    items.push(result.data)
  }
  return items
}

const practiceSets = load("practice-sets", practiceSetSourceSchema)
const vocabularySets = load("vocabulary-sets", vocabularySetSourceSchema)
const grammarTopics = load("grammar-topics", grammarTopicSourceSchema)

if (hasErrors) process.exit(1)

writeFileSync(target, buildSeedSql({ practiceSets, vocabularySets, grammarTopics }), "utf8")
console.log(
  `Wrote supabase/seed.sql with ${practiceSets.length} practice set(s), ${vocabularySets.length} vocabulary set(s), ${grammarTopics.length} grammar topic(s).`,
)
