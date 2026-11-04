---
paths:
  - "src/**"
  - "tests/**"
---

# Architecture rules

IELTS Learning Hub is **one Next.js application** organised as a **modular monolith** with
**feature-based** modules. Do not introduce a monorepo (Turborepo/Nx), microservices,
separate backend services or extra deployables.

## Layers and responsibilities

| Layer         | Location                                       | Responsibility                                                                                                                    |
| ------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Routing       | `src/app/**`                                   | Route segments, layouts, metadata, route handlers. **Thin**: compose components, call feature/server services, no business logic. |
| Features      | `src/features/<feature>/`                      | Feature-owned UI, hooks, services, Zod schemas, types, utils.                                                                     |
| Shared UI     | `src/components/{ui,layout,shared,feedback}`   | Generic, business-agnostic components. `ui/` = shadcn/ui primitives + design-system components.                                   |
| Server        | `src/server/{ai,speech,database,storage,auth}` | Server-only infrastructure and external provider adapters. Every module starts with `import "server-only"`.                       |
| Library       | `src/lib/**`                                   | Pure framework-agnostic helpers (`cn`, constants, validators, helpers).                                                           |
| Config        | `src/config/**`                                | App configuration: navigation, site, theme, environment validation.                                                               |
| Cross-cutting | `src/hooks`, `src/stores`, `src/types`         | Shared hooks, Zustand stores (only when shared client state is truly needed), shared types.                                       |

## Dependency direction (allowed imports)

```
app  ──► features ──► components ──► lib / config / types
  │          │              ▲
  └──────────┴──► server ───┘  (server code may use lib/config/types)
```

- `components/**` must not import from `features/**`, `app/**` or `server/**`.
- `lib/**` must not import from React components, `features/**` or `server/**`.
- `server/**` must not import client components or anything marked `"use client"`.
- A feature may import another feature **only through its public entry** (`@/features/<name>`
  index file), never `@/features/<name>/components/...` internals. Prefer moving genuinely
  shared code down into `components/`, `lib/` or `server/` instead.
- No circular dependencies. If two modules need each other, extract the shared part.

## Server / client boundary

- Server Components are the default. Add `"use client"` only at the leaf that needs state,
  effects, browser APIs or event handlers.
- Code that touches secrets, databases, AI or speech providers lives in `src/server/**` and
  imports `server-only` so an accidental client import fails the build.
- Never pass secrets, raw provider responses or full user records as props to Client Components.

## External providers

- Supabase, Anthropic (Claude), speech-to-text and text-to-speech are accessed **only** through a
  service interface in `src/server/<area>/` (e.g. `server/ai/tutor-service.ts` exposing a typed
  function), never by calling the SDK from routes or components.
- Validate provider responses with Zod at the adapter boundary.
- Dependency injection only where it buys something concrete (e.g. swapping a provider in tests).

## Feature module shape

Create only the folders a feature actually needs:

```
src/features/<feature>/
  components/   hooks/   services/   schemas/   types/   utils/
  index.ts      # public API of the feature
```

## Avoid

- Empty placeholder files/folders "for later".
- Generic abstractions (repositories, factories, base classes) without a second real use case.
- Business logic in `app/**` pages or in `components/ui/**`.
- Duplicating logic that already exists in another module — reuse or extract.

Changing these rules requires an ADR in `docs/decisions/`.
