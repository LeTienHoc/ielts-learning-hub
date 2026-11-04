# Components

The component foundation is [shadcn/ui](https://ui.shadcn.com) (Radix base, `radix-nova`
style; see `components.json`). Components are source files in `src/components/ui` that we own and
adapt to the tokens. Business-specific (IELTS/learning) components never go in `ui/`.

## Inventory

| Category   | Components (`@/components/ui/*` unless noted)                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Actions    | `Button`, `IconButton`, `DropdownMenu`                                                                                               |
| Forms      | `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Label`, `Field*`, `FormField` (`@/components/shared/form-field`) |
| Navigation | `Sidebar*`, `Breadcrumb`, `Tabs`, `NavigationMenu`, `Pagination`; app shell in `@/components/layout`                                 |
| Feedback   | `Alert`, `Toaster` (sonner), `Tooltip`, `Progress`, `Skeleton`, `EmptyState` / `ErrorState` (`@/components/feedback`)                |
| Overlays   | `Dialog`, `Sheet`, `Drawer`, `Popover`                                                                                               |
| Data       | `Card`, `Badge`, `Avatar`, `Table`, `Separator`, `Empty`                                                                             |
| Theme      | `ThemeProvider`, `useTheme`, `ThemeScript`, `ThemeSwitcher` (`@/components/shared`)                                                  |

## Variants and sizes

**Button** — `variant`: `default` (primary), `outline`, `secondary`, `ghost`, `destructive`,
`link`. `size`: `xs` (28px), `sm` (32px), `default` (36px), `lg` (40px), `icon-xs`, `icon-sm`,
`icon`, `icon-lg`. Supports `asChild` to render a link.

**IconButton** — icon-only button with a **required** `label` (accessible name). `size`: `sm`,
`default`, `lg`; `variant` as Button (default `ghost`); `showTooltip` shows the label on hover/focus.

```tsx
import { Search } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"

;<IconButton icon={Search} label="Search" showTooltip />
```

**Badge** — `default`, `secondary`, `outline`, `ghost`, `link`, `destructive`, and status
variants `success`, `warning`, `info` (subtle background + emphasis text).

**Alert** — `default`, `destructive`, `success`, `warning`, `info`.

**Card** — `size`: `default` (16px padding) or `sm` (12px). Uses `rounded-card`, a border and
`shadow-subtle`. Parts: `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`,
`CardContent`, `CardFooter`.

**Form controls** — 36px default height (`h-9`) for `Input` and `SelectTrigger` (`size="sm"` 32px)
so they align with `Button`.

## Usage conventions

### Forms

Use React Hook Form with a Zod schema and `FormField`, which wires label, description, error
message and `aria-invalid` / `aria-describedby`. Add `noValidate` to the form so Zod, not the
browser, reports errors.

```tsx
const schema = z.object({ email: z.email("Enter a valid email address") })
const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "" } })

<form noValidate onSubmit={form.handleSubmit(onSubmit)}>
  <FormField
    control={form.control}
    name="email"
    label="Email"
    render={({ field, controlProps }) => <Input type="email" {...field} {...controlProps} />}
  />
</form>
```

### Pages

Route pages use `RoutePage` (title and description from `src/config/navigation.ts`) and show an
`EmptyState` until real content exists. Never show fake statistics or scores.

```tsx
export const metadata = routeMetadata("/reading")

export default function ReadingPage() {
  return (
    <RoutePage href="/reading">
      <EmptyState icon={BookOpenText} title="No reading practice yet" description="…" />
    </RoutePage>
  )
}
```

### Styling

- Merge classes with `cn` from `@/lib/utils`.
- Use tokens (`bg-surface`, `text-muted-foreground`, `text-h4`, `rounded-card`, `shadow-subtle`).
- Decorative icons get `aria-hidden="true"`; icon-only controls use `IconButton`.
- Every component must work in light and dark and at 360px width.

### Adding a shadcn/ui component

1. `pnpm dlx shadcn@<version in package.json> add <component>`
2. Replace `import { cn } from "cn"` with `import { cn } from "@/lib/utils"` (ESLint enforces it).
3. Map colours, radius and shadows to tokens; align sizes with the scale above.
4. Add it to this inventory.
