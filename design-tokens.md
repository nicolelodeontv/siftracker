# Design tokens

SIF Tracker uses a single accent color (blue, `#378ADD`) over a neutral base scale. Tokens are plain CSS custom properties defined directly in `app/globals.css` — there is no separate `tokens.css` file and no `tailwind.config.ts`; this project uses Tailwind v4, which reads its theme straight from CSS.

## Files

- `app/globals.css` — the only source of truth. Contains: 
  - `@theme inline { ... }` — maps `--color-*` / `--font-*` / `--radius-*` utility names to the raw variables below, which is what makes `bg-background`, `text-muted-foreground`, `rounded-lg`, etc. work as Tailwind classes.
  - `:root { ... }` — light mode values.
  - `.dark { ... }` — dark mode values (applied via the `dark` class on `<html>`, toggled by `components/theme-toggle.tsx`).

## Token groups

### Surfaces

| Variable Light Dark Used for  |           |           |                                                         |
| ----------------------------- | --------- | --------- | ------------------------------------------------------- |
| `--background`                | `#FAFAF9` | `#0A0A0B` | Page background                                         |
| `--card`                      | `#FFFFFF` | `#151517` | Cards, stat tiles, workload rows                        |
| `--popover`                   | `#FFFFFF` | `#18181A` | Popovers, dialogs                                       |
| `--secondary`                 | `#F4F4F5` | `#1B1B1E` | Secondary surfaces/buttons                              |
| `--sidebar`                   | `#FFFFFF` | `#111113` | Reserved sidebar surface (not currently used in the UI) |

### Borders

| Variable Light Dark  |           |           |
| -------------------- | --------- | --------- |
| `--border`           | `#E4E4E7` | `#26262A` |
| `--input`            | `#D4D4D8` | `#35353A` |
| `--ring`             | `#378ADD` | `#378ADD` |
| `--grid-dot`         | `#E7E7EA` | `#26262A` |

### Text

| Variable Light Dark Used for                                            |           |           |                                              |
| ----------------------------------------------------------------------- | --------- | --------- | -------------------------------------------- |
| `--foreground`                                                          | `#18181B` | `#F5F5F4` | Primary text                                 |
| `--muted-foreground`                                                    | `#71717A` | `#9B9B96` | Secondary/label text, placeholders           |
| `--card-foreground` / `--popover-foreground` / `--secondary-foreground` | —         | —         | Text-on-surface variants, same neutral scale |

### Accent

The one hue in the system (`#378ADD`), reused across every accent-related token — there's currently no separate hover/tint shade, unlike a typical accent scale.

| Variable Light Dark Used for  |                        |                        |                                               |
| ----------------------------- | ---------------------- | ---------------------- | --------------------------------------------- |
| `--primary`                   | `#378ADD`              | `#378ADD`              | Primary buttons, active/selected states       |
| `--primary-foreground`        | `#FFFFFF`              | `#FFFFFF`              | Text/icon on a solid primary fill             |
| `--accent`                    | `rgba(55,138,221,.08)` | `rgba(55,138,221,.10)` | Faint accent background (hover states, tints) |
| `--accent-foreground`         | `#1F5F9D`              | `#8DBFF0`              | Text/icon on top of `--accent`                |
| `--ring`                      | `#378ADD`              | `#378ADD`              | Focus rings                                   |

### Status colors

`--sif-yellow`, `--sif-red`, `--sif-green`, `--sif-blue`, `--sif-violet`, `--sif-orange` currently all resolve to the same accent blue (`#378ADD`) in both themes — they exist as named hooks for future status differentiation (e.g. error/warning/success states) but are not yet visually distinct. `--sif-white` maps to the foreground color instead of a fixed white, so it stays readable in both themes.

### Charts / sidebar

`--chart-1` through `--chart-5` and the `--sidebar-*` variables are also defined (all currently reusing the accent/neutral values above) but aren't used anywhere in the current UI — they're part of the shadcn base theme this project started from and are kept for forward compatibility rather than active use.

### Radius

`--radius: .75rem` is the base value; `--radius-sm` / `-md` / `-lg` / `-xl` / `-2xl` / `-3xl` / `-4xl` are derived from it via `calc()` in the `@theme inline` block (e.g. `--radius-sm: calc(var(--radius) * .6)`).

## Usage

Use the mapped Tailwind utility classes rather than raw `var(--...)` references, so components stay theme-aware automatically:

```html
<button class="bg-primary text-primary-foreground hover:opacity-90 rounded-lg">
  Clock in
</button>

<div class="bg-card border border-border rounded-xl">
  <p class="text-muted-foreground text-xs">Progress</p>
  <p class="text-foreground text-lg font-semibold">42%</p>
</div>

```

## Changing the accent

Edit `--primary` (and `--ring`, which currently matches it) in both `:root` and `.dark` in `app/globals.css`:

```css
:root { --primary: #378ADD; --ring: #378ADD; }
.dark { --primary: #378ADD; --ring: #378ADD; }

```

If you want the accent to differ between light and dark mode (the way surfaces and text already do), give `--accent` and `--accent-foreground` distinct light/dark values — they already are distinct today, just tuned for a subtle tint rather than a strong hover color.
