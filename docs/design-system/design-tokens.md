# Design tokens

**Single source of truth:** `src/app/globals.css`. Raw values are CSS variables on `:root`
(light) and `.dark` (dark); `@theme inline` maps them to Tailwind utilities. Components use the
utilities only — never hex values or Tailwind palette colours (`bg-blue-500`).

Direction: modern education SaaS, premium minimalism — calm surfaces, one brand accent,
generous reading typography, borders over shadows.

## Colour

### Brand and neutral

| Token (utility)                          | Light     | Dark      | Use                                    |
| ---------------------------------------- | --------- | --------- | -------------------------------------- |
| `primary` (`bg-primary`, `text-primary`) | `#635BDB` | `#8A84F0` | Primary actions, active indicators     |
| `primary-hover`                          | `#4942B7` | `#A29DF5` | Hover state of primary actions         |
| `primary-subtle`                         | `#EEF0FF` | `#25234D` | Selected/active backgrounds            |
| `primary-subtle-foreground`              | `#4942B7` | `#C4C1FF` | Text/icons on `primary-subtle`         |
| `primary-foreground`                     | `#FFFFFF` | `#0F1020` | Text on `primary`                      |
| `background`                             | `#FFFFFF` | `#121325` | Cards, sidebar, header, popovers       |
| `surface`                                | `#F8F9FC` | `#0D0E1C` | Page canvas behind content             |
| `foreground`                             | `#17172B` | `#ECEDF5` | Primary text                           |
| `muted-foreground`                       | `#626B7A` | `#9AA1B2` | Secondary text                         |
| `border`                                 | `#DDE1E9` | `#272A40` | Dividers, card borders                 |
| `input`                                  | `#B4BBC8` | `#3B3F5A` | Form control borders                   |
| `accent`                                 | `#F1F3F8` | `#1D1F36` | Hover background for menus/ghost items |
| `ring`                                   | = primary | = primary | Focus rings                            |

### Semantic status

Each status has three tokens: **base** (icons, fills, borders), **subtle** (tinted backgrounds)
and **emphasis** (text — meets WCAG AA on `background` and on `subtle`).

| Status  | Base (L / D)          | Subtle (L / D)        | Emphasis (L / D)      |
| ------- | --------------------- | --------------------- | --------------------- |
| success | `#16A36A` / `#3CCB8E` | `#E8F7F0` / `#0F2A20` | `#0B7A4E` / `#5FD9A4` |
| warning | `#E6A23C` / `#F0B95E` | `#FDF5E7` / `#2E2410` | `#8A5608` / `#F5C97F` |
| error   | `#DC5252` / `#F07878` | `#FCEDED` / `#33171A` | `#B53434` / `#F59595` |
| info    | `#3987D5` / `#6AAAF0` | `#EAF3FC` / `#13243A` | `#1E64AE` / `#8CBFF5` |

shadcn/ui's `destructive` maps to `error-emphasis` so form error text stays readable.

### Contrast (measured, WCAG 2.x)

| Pair                                                | Ratio                                    |
| --------------------------------------------------- | ---------------------------------------- |
| foreground on background (light)                    | 17.6:1                                   |
| muted-foreground on background (light)              | 5.4:1                                    |
| muted-foreground on surface (light)                 | 5.1:1                                    |
| white on primary                                    | 5.2:1                                    |
| primary-subtle-foreground on subtle                 | 6.8:1                                    |
| success / warning / error / info base on white      | 3.2 / 2.2 / 3.9 / 3.8 — **not for text** |
| success / warning / error / info emphasis on subtle | 4.9 / 5.7 / 5.3 / 5.4                    |
| foreground on background (dark)                     | 16.1:1                                   |
| muted-foreground on background (dark)               | 7.3:1                                    |
| primary-foreground on primary (dark)                | 6.0:1                                    |

Known gap: `input` borders (1.9:1 light) are below the 3:1 non-text guideline; controls are
always labelled and gain a 3px focus ring, but revisit if usability testing shows issues.

## Typography

Font: **Inter** (`next/font`, subsets latin, latin-ext, vietnamese). Each utility sets size,
line height, weight and tracking.

| Utility        | Size / line height | Weight | Tracking | Use                              |
| -------------- | ------------------ | ------ | -------- | -------------------------------- |
| `text-display` | 48 / 56 px         | 700    | −0.02em  | Marketing hero                   |
| `text-h1`      | 36 / 44 px         | 700    | −0.02em  | Large page titles                |
| `text-h2`      | 30 / 38 px         | 600    | −0.015em | Page titles (desktop)            |
| `text-h3`      | 24 / 32 px         | 600    | −0.01em  | Page titles (mobile), sections   |
| `text-h4`      | 20 / 28 px         | 600    | —        | Card and panel titles            |
| `text-body-lg` | 18 / 30 px         | 400    | —        | Long-form lesson content         |
| `text-body`    | 16 / 26 px         | 400    | —        | Default body text                |
| `text-body-sm` | 14 / 22 px         | 400    | —        | Secondary text, navigation       |
| `text-caption` | 12 / 16 px         | 400    | —        | Meta information, section labels |
| `text-label`   | 14 / 20 px         | 500    | —        | Form labels, emphasised UI text  |

These names are registered in `src/lib/utils/cn.ts` so class merging treats them as font sizes.
Register any new typography, shadow or radius token there too.

## Spacing

Tailwind's 4px scale (`--spacing: 0.25rem`): `1` = 4px, `2` = 8px, `3` = 12px, `4` = 16px,
`6` = 24px, `8` = 32px, `12` = 48px, `16` = 64px.

| Convention                | Value                                         |
| ------------------------- | --------------------------------------------- |
| Page padding              | `px-4` mobile, `md:px-6`, `lg:px-8`           |
| Page vertical padding     | `py-6`, `lg:py-8`                             |
| Gap between page sections | `gap-6`, `lg:gap-8`                           |
| Card padding              | 16px (`--card-spacing`), 12px for `size="sm"` |
| Control height            | `h-9` default, `h-8` small, `h-10` large      |

No arbitrary spacing (`p-[13px]`) without a commented reason.

## Radius

| Utility         | Value | Use                         |
| --------------- | ----- | --------------------------- |
| `rounded-sm`    | 6px   | Small elements, kbd         |
| `rounded-md`    | 8px   | Menu items                  |
| `rounded-lg`    | 10px  | Buttons, inputs             |
| `rounded-xl`    | 12px  | Larger controls             |
| `rounded-2xl`   | 16px  |                             |
| `rounded-card`  | 12px  | Cards, panels, empty states |
| `rounded-modal` | 16px  | Dialogs                     |

## Elevation

| Utility           | Use                            |
| ----------------- | ------------------------------ |
| `shadow-subtle`   | Cards (together with a border) |
| `shadow-elevated` | Dialogs, floating panels       |

Dark mode uses deeper, darker shadows via the same tokens. Prefer borders; avoid stacking shadows.

## Layout

| Token                              | Value  | Utility / use     |
| ---------------------------------- | ------ | ----------------- |
| `--layout-sidebar-width`           | 248px  | Expanded sidebar  |
| `--layout-sidebar-width-collapsed` | 72px   | Icon-only sidebar |
| `--layout-header-height`           | 64px   | `h-header`        |
| `--layout-content-max-width`       | 1440px | `max-w-content`   |

## Motion

Play feedback in vocabulary games. Use these with `motion-safe:`. The global
`prefers-reduced-motion` rule also shortens every animation.

| Token                | Keyframes       | Utility / use                                                                 |
| -------------------- | --------------- | ----------------------------------------------------------------------------- |
| `--animate-shake`    | `shake`         | `motion-safe:animate-shake`: wrong pair in Match pairs                        |
| `--animate-confetti` | `confetti-fall` | `animate-confetti`: celebration pieces (rendered only without reduced motion) |

## Responsive breakpoints

Tailwind defaults, mobile-first:

| Prefix | Min width | Behaviour                                              |
| ------ | --------- | ------------------------------------------------------ |
| —      | 0         | Mobile: sidebar is a drawer, single column             |
| `sm`   | 640px     |                                                        |
| `md`   | 768px     | Tablet: persistent sidebar (collapsible), search field |
| `lg`   | 1024px    | Desktop spacing                                        |
| `xl`   | 1280px    |                                                        |
| `2xl`  | 1536px    | Content capped at 1440px                               |

## Theming

`.dark` on `<html>` switches every token. Light, dark and system modes are supported; the choice
is stored in `localStorage` (`ilh-theme`). To customise a theme, change the variables in
`:root` / `.dark` only — components need no edits.
