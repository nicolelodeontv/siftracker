# Design tokens

SIF Tracker uses a two-color system: one neutral scale for structure, one accent color for anything interactive or active. No other hues.

## Files
- `tokens.css` — CSS custom properties, split between `:root` (light) and `.dark` (dark mode)
- `tailwind.config.ts` — maps those variables to Tailwind utility classes

## Token groups

### `surface-*`
Background levels, from page background up to raised cards.
- `surface-0` — page background
- `surface-1` — cards, metric tiles, workload rows
- `surface-2` — raised cards (e.g. the live shift card)

### `border` / `border-strong`
Hairline dividers and card outlines. `border-strong` is for secondary button outlines and hover emphasis.

### `ink` / `ink-secondary` / `ink-muted`
Text hierarchy.
- `ink` — primary text, headings, values
- `ink-secondary` — labels, supporting text
- `ink-muted` — placeholders, timestamps, disabled text

### `accent-*`
The one color in the system. Reserve it for the single primary action on screen and for active/selected states — not for decoration.
- `accent` — solid fill (primary button, active icon)
- `accent-hover` — hover state for the solid fill
- `accent-fg` — text/icon color on top of a solid accent fill
- `accent-tint` — faint accent background (icon chips, badges)
- `accent-tint-fg` — text/icon color on top of `accent-tint`

## Usage

```html
<button class="btn-primary">
  <i class="ti ti-player-play"></i> Clock in
</button>

<button class="btn-secondary">
  <i class="ti ti-player-stop"></i> Clock out
</button>

<div class="icon-chip">
  <i class="ti ti-users"></i>
</div>
```

## Rule of thumb
Only one filled `accent` button visible per view. Everything else — icons at rest, secondary buttons, badges — stays neutral (`ink` / `surface` / `border`). Status is communicated through accent intensity (solid vs. tint vs. neutral), not through additional hues.

## Changing the accent
Edit two values in `tokens.css`:

```css
:root { --accent: #2563EB; }
.dark { --accent: #3B82F6; }
```

Everything else — buttons, chips, badges, hover states — is derived from these two.
