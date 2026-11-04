import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import prettier from "eslint-config-prettier/flat"

/** Architecture boundaries (see docs/architecture/overview.md). */
const restrictedImports = {
  paths: [
    {
      name: "cn",
      importNames: ["cn"],
      message: "Import cn from '@/lib/utils' — it knows the design-system tokens.",
    },
  ],
  patterns: [
    {
      group: ["@/features/*/*"],
      message: "Import other features only through their public index ('@/features/<name>').",
    },
  ],
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-imports": ["error", restrictedImports],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "import/no-cycle": "error",
    },
  },
  {
    // The token-aware cn wrapper is the one place allowed to use the raw package.
    files: ["src/lib/utils/cn.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // Shared layers must not depend on features, routes or server-only code.
    files: ["src/components/**", "src/lib/**", "src/hooks/**", "src/config/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          ...restrictedImports,
          patterns: [
            ...restrictedImports.patterns,
            {
              group: ["@/features/*", "@/app/*", "@/server/*"],
              message: "Shared layers must not import features, routes or server-only modules.",
            },
          ],
        },
      ],
    },
  },
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
])

export default eslintConfig
