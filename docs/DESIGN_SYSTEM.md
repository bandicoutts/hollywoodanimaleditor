# Hollywood Animal Save Editor — Design System

> **Art Deco Hollywood** · Warm charcoal · Gold accents · Serif + Sans type pairing  
> Version 1.0 — April 2026 · Derived from interactive prototype

---

## Table of Contents

1. [Design Language](#1-design-language)
2. [Colour Tokens](#2-colour-tokens)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Components](#5-components)
6. [Module Patterns](#6-module-patterns)
7. [Interaction States](#7-interaction-states)
8. [Iconography](#8-iconography)
9. [Motion](#9-motion)
10. [Responsive Behaviour](#10-responsive-behaviour)

---

## 1. Design Language

The editor is styled as **a studio executive's filing cabinet** — functional, authoritative, and quietly cinematic. Every surface references the Golden Age of Hollywood (1920s–1950s) without being a costume piece.

### Principles

| Principle | Expression |
|-----------|------------|
| **Warmth over cold utility** | Charcoal backgrounds with warm undertones, not pure grey or navy |
| **Gold as signal, not decoration** | Gold (`#c9a44a`) marks active states, values, and actions — never used for mere decoration |
| **Serif for content, sans for chrome** | Names, numbers, titles → Playfair Display. Labels, buttons, metadata → DM Sans |
| **Restraint** | No gradients on interactive elements; no rounded corners beyond `border-radius: 1–2px`; no emoji |
| **Art Deco geometry** | Decorative elements use hexagons, diamonds, thin-stroke polygons, and right-angle corner ticks |

---

## 2. Colour Tokens

### Core Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg-app` | `#1d1a15` | Application background |
| `--color-bg-panel` | `#111009` | Header, sidebar, card backgrounds |
| `--color-bg-raised` | `#2a2720` | Hover states, track backgrounds |
| `--color-border` | `#3e3a2e` | Default borders |
| `--color-border-subtle` | `#2a2720` | Dividers, secondary borders |
| `--color-text-primary` | `#e2d9c8` | Body text, names, values |
| `--color-text-secondary` | `#9a9280` | Descriptions, subtitles |
| `--color-text-muted` | `#5c5448` | Labels, metadata, disabled |
| `--color-text-faint` | `#3e3a2e` | Placeholder text, decorative |

### Accent

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-gold` | `#c9a44a` | Primary accent: active nav, key values, primary CTAs, borders on focus |
| `--color-gold-dim` | `#c9a44a18` | Gold tinted backgrounds |
| `--color-gold-mid` | `#c9a44a55` | Hover borders |

### Profession Colours

Used exclusively to colour-code talent by profession. Applied to: list-item left borders, badge backgrounds, stat bars, and detail panel accents.

| Profession | Hex |
|------------|-----|
| Actor | `#c9a44a` |
| Director | `#4ec9a0` |
| Scriptwriter | `#a9a4e8` |
| Cinematographer | `#7ab0e0` |
| Composer | `#e09090` |
| FilmEditor | `#8fbc55` |

### Semantic

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | `#8fbc55` | High mood, positive state |
| `--color-warning` | `#c9a44a` | Mid mood, attention |
| `--color-danger` | `#e08080` | Low mood, destructive action borders/text |

### Colour Usage Rules

- **Backgrounds**: never use an accent at full opacity as a background. Use `{hex}12`–`{hex}22` for tinted surfaces.
- **Borders**: active = `{hex}55`–`{hex}88`; hover = `{hex}55`; rest = `#3e3a2e`.
- **Text on dark**: minimum contrast ratio 4.5:1. `#9a9280` on `#1d1a15` passes AA for 12px+.

---

## 3. Typography

### Font Stack

```css
--font-serif: 'Playfair Display', Georgia, serif;
--font-ui:    'DM Sans', Helvetica, sans-serif;
```

Load from Google Fonts:
```
Playfair Display: 400, 400i, 600, 600i, 700, 700i
DM Sans: 300, 400, 500, 600
```

### Type Scale

| Role | Font | Size | Weight | Color | Notes |
|------|------|------|--------|-------|-------|
| Module title | Serif | 22px | 600 | `--text-primary` | |
| Character name (detail) | Serif italic | 26px | 600 | `--text-primary` | |
| Character name (list row) | Serif | 13px | 400 | `#c8bfae` | |
| Section heading | Serif | 14–15px | 400–600 | `--text-primary` | |
| Upload headline | Serif | 36px | 600 | `--text-primary` | |
| Upload subhead | Serif | 11px | 400 | `--color-gold` | letter-spacing: 0.45em; uppercase |
| Stat value (large) | Serif | 20px | 600 | Accent colour | In resource fields |
| Stat value (bar) | Serif | 13px | 600 | `--text-primary` | |
| Button label | UI | 11–12px | 400–600 | varies | letter-spacing: 0.06–0.12em; uppercase |
| Label / metadata | UI | 9–11px | 400 | `--text-muted` | letter-spacing: 0.06–0.1em; uppercase |
| Body / description | UI | 11–13px | 400 | `--text-secondary` | line-height: 1.5–1.6 |
| Badge | UI | 10–11px | 600 | Profession colour | uppercase; letter-spacing: 0.08em |

### Rules

- **Numbers and proper names always use `--font-serif`**
- **Chrome (buttons, labels, nav, metadata) always uses `--font-ui`**
- Serif italic is reserved for character names, film titles, quoted text, and the sidebar logotype
- Minimum font size: 10px (labels only); body minimum 12px

---

## 4. Spacing & Layout

### Base Unit

`4px` grid. All padding/margin values are multiples of 4.

### Common Values

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight internal gaps |
| `--space-2` | 8px | Gap between related elements |
| `--space-3` | 12px | Card internal padding (small) |
| `--space-4` | 16px | Standard padding |
| `--space-5` | 20px | Section gaps |
| `--space-6` | 24px | Module section padding |
| `--space-8` | 32px | Module outer padding |
| `--space-9` | 36px | Large module padding |

### Application Layout

```
┌─────────────────────────────────────────────────┐
│  Top bar (44px)                                  │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │  Module content area                 │
│ 148px    │  flex: 1, overflow-y: auto           │
│ (56px    │                                       │
│  compact)│                                       │
└──────────┴──────────────────────────────────────┘
```

- **Sidebar**: `148px` default; `56px` icon-only (compact tweak)
- **Top bar**: `44px` height; `border-bottom: 1px solid #2a2720`
- **Module max-widths**: Resources/Writing Tags `620–720px`; Technologies/Research `800px`; Characters full-width; AI Scripts `820px`
- **Module padding**: `32px 36px` standard outer; Characters has no outer padding (full-height split)

### Characters Module Layout

```
┌─────────────────────────────────────────────────┐
│ Character List (280px) │ Detail Panel (flex: 1) │
│ border-right           │ overflow-y: auto       │
│ overflow-y: auto       │ padding: 28px 32px     │
└─────────────────────────────────────────────────┘
```

### Border Radius

All elements use `border-radius: 1px` or `0`. The design language is angular — avoid rounded corners except for:
- Mood indicator dots: `border-radius: 50%`
- Scrollbar thumb: `border-radius: 3px`
- Track bars: `border-radius: 1px`

---

## 5. Components

### Sidebar Nav Item

```
State       | Border-left | BG                | Text colour
----------- | ----------- | ----------------- | -----------
Rest        | transparent | transparent       | #5c5448
Hover       | transparent | transparent       | #9a9280
Active      | 2px #c9a44a | #c9a44a08         | #c9a44a (label)
```

### Profession Badge

Inline span. Background `{profColor}18`, border `{profColor}40`, text `{profColor}`.  
Sizes: default `11px 2px/10px`; small `10px 1px/7px`.

### Stat Bar

- Track: `6px` height, `background: #2a2720`
- Fill: colour from profession or stat-specific palette (see §2)
- Transition: `width 0.3s ease`
- Overlaid `<input type="range" opacity: 0>` for interaction

### Confirmation Dialog

- Backdrop: `rgba(17,16,9,0.85)` + `backdrop-filter: blur(4px)`
- Panel: `380px` wide, `border-top: 2px solid {accentColour}`, shadow `0 24px 64px rgba(0,0,0,0.6)`
- Two variants: **default** (gold top border) and **danger** (`#e08080` top border + confirm button)

### Bulk Action Button

Rest state: border `#3e3a2e`, text `#9a9280`, background transparent.  
Hover: border and text shift to gold (default) or `#e08080` (danger variant).  
Font: 11px UI, uppercase, `letter-spacing: 0.07em`.  
Always `white-space: nowrap`.

### Tech Card (toggle)

- Rest unlocked: border `{color}55`, background `{color}0e`
- Rest locked: border `#2a2720`, background transparent
- Checkbox: 16×16, `border-radius: 1px`; filled with colour when checked; SVG checkmark in `#111009`

### Perk Row

Full-width click target, `padding: 8px 16px`. Checkbox 14×14. Hover: `background: #1d1a1560`.

### Gold Divider

`height: 1px`, `background: linear-gradient(90deg, transparent, #c9a44a55, transparent)`.

### Empty State

Centred column, `padding: 60px 24px`. Icon at 36px, 0.25 opacity + grayscale. Title in serif 16px `#5c5448`.

---

## 6. Module Patterns

### Module Header

Every module top section:
```
[Title — serif 22px] .............. [Bulk action buttons]
[Subtitle — UI 12px #5c5448]
────── Gold divider ──────
```

### Resources Module

- Each resource: label + description left, current value right (serif 20px in accent colour, click-to-edit)
- Track with overlaid range input
- Quick preset buttons: 25% / 50% / 75% / 100%

### Characters Module

**List row anatomy:**
```
● [Mood dot] [Name — serif 13px] ............. [Top stat value — profColor]
             [Profession — 10px profColor] · [Age — 10px muted]
```
Active row: `border-left: 2px solid {profColor}`, background `#c9a44a0d`.

**Detail panel anatomy:**
```
[Portrait placeholder 80×100] [Name italic serif 26px] [ProfBadge]
                               [Age] [Salary] [Mood] [Avg]
──── Gold divider ────
Ratings header ............................ [Max All Stats]
[Stat bars in 2-column grid]
──── Gold divider ────
Traits & Specialisations
[Tag pills] [+ Add trait dashed]
──── Gold divider ────
Morale
[Mood stat bar]
```

**Portrait placeholder**: `80×100px`, gradient from `{profColor}18` → `#1d1a15`, border `{profColor}40`. Contains faint person SVG icon + "PORTRAIT" label.

### Writing Tags Module

Groups rendered as sections with a `3px wide × 14px tall` colour accent bar + group name. Tags are pill buttons: active = `{catColor}` border + `{catColor}18` background; inactive = `#2a2720` border + transparent.

### Research Module

2-column card grid. Each card: `border-top: 2px solid {groupColor}`, group header with count + "All" toggle button. Perk rows are full-width click targets with 14×14 checkbox.

Progress bar above the grid: `height: 4px`, gradient fill `#c9a44a → #8fbc55`.

### Technologies Module

2-column grid (Camera / Sound). Tech cards are full-click-target rows with checkbox + name + year + description.

### AI Scripts Module

1. Genre selector (pill buttons, one per genre)  
2. Active tags summary bar (`#111009` background)  
3. Generate button (gold bordered, uppercase, spinner on load)  
4. **Script Card** result:
   - Header: gradient tint from genre palette, title in serif italic 28px, logline in serif 15px italic quoted
   - Body: 2-column grid — Story Pillars tags / Estimated Budget / Cast Suggestions / Director's Vision
   - Decorative diamond SVG in top-right corner at 0.2 opacity

---

## 7. Interaction States

| Element | Rest | Hover | Active/Selected | Disabled |
|---------|------|-------|-----------------|----------|
| Sidebar item | text `#5c5448` | text `#9a9280` | text `#c9a44a`, left border, tinted BG | — |
| Button (gold) | border `#3e3a2e`, text `#9a9280` | border `#c9a44a66`, text `#c9a44a` | — | border `#2a2720`, text `#3e3a2e` |
| Tag pill | border `#2a2720`, text `#5c5448` | — | border + tint `{catColor}` | — |
| Tech card | border `#2a2720` | BG `#1d1a15` | border `{color}55`, BG `{color}0e` | — |
| Stat chip (editable) | dashed underline `#3e3a2e` | cursor: text | input with gold border | — |
| Character row | transparent | BG `#1d1a1580` | left border, BG `#c9a44a0d` | — |

### Focus

`outline: 1px solid #c9a44a66; outline-offset: 2px` on all keyboard-focusable elements.

### Click-to-edit pattern (StatChip, ResourceField)

- Rest: value displayed as text with `border-bottom: 1px dashed #3e3a2e`; `cursor: text`
- Edit: replaced with `<input>` with `border: 1px solid #c9a44a`; commits on blur or Enter

---

## 8. Iconography

All icons are inline SVG, drawn with `stroke` not `fill` (except small filled dots/circles). Default size: `16×16`. Stroke width: `1.2–1.5px`. No icon library — all custom drawn.

### Sidebar module icons (16×16)

| Module | Description |
|--------|-------------|
| Resources | Three vertical bars of increasing height |
| Characters | Person silhouette with second fainter silhouette |
| Writing Tags | Document with horizontal lines |
| Research | Magnifying glass with crosshair |
| Technologies | Vintage camera rectangle + lens circle |
| AI Scripts | Hexagon outline with spoke lines + centre dot |

Active state: stroke colour changes to `#c9a44a`.

### Decorative SVG Motifs

- **Studio mark**: hexagon polygon + inner ring + filled centre circle (used in sidebar header + upload screen)
- **Corner ornaments**: right-angle L-shapes with tick lines and filled dots at vertices
- **Film strip**: repeating rectangular holes on `#0d0c09` strip
- **Drop zone ticks**: 12×12 corner brackets, `1.5px` lines

---

## 9. Motion

| Property | Value | Usage |
|----------|-------|-------|
| Default transition | `all 0.15s ease` | Colour, border, background changes |
| Stat bar fill | `width 0.3s ease` | Progress bars filling on change |
| Sidebar width | `width 0.25s ease` | Compact ↔ full toggle |
| Script card entry | none (instant) | AI result appears immediately |
| Spinner | `rotate 1s linear infinite` | Loading state on AI button |
| Backdrop | `backdrop-filter: blur(4px)` | Confirmation dialog overlay |

No entrance/exit animations. The UI does not animate on mount — content appears immediately.

---

## 10. Responsive Behaviour

The prototype is designed for **full-width desktop browser** (1280px+).

### Breakpoints

| Width | Behaviour |
|-------|-----------|
| ≥ 1280px | Full layout — sidebar 148px + labels |
| 900–1279px | Sidebar collapses to 56px icon-only |
| < 900px | Not currently designed (Next.js app — consider drawer nav) |

### Characters module

At widths < 960px, consider stacking list above detail panel (full-width each) with a back button. At 280px + flex-1 the detail panel needs ~500px to render comfortably.

### Top bar quick stats

Use `flex-shrink: 0` and `white-space: nowrap` on all stat chips. On narrow viewports, hide the stats and show only the Download button.

---

## Appendix: CSS Custom Properties Reference

```css
:root {
  /* Backgrounds */
  --color-bg-app:     #1d1a15;
  --color-bg-panel:   #111009;
  --color-bg-raised:  #2a2720;

  /* Borders */
  --color-border:        #3e3a2e;
  --color-border-subtle: #2a2720;

  /* Text */
  --color-text-primary:   #e2d9c8;
  --color-text-secondary: #9a9280;
  --color-text-muted:     #5c5448;
  --color-text-faint:     #3e3a2e;

  /* Accent */
  --color-gold:     #c9a44a;
  --color-success:  #8fbc55;
  --color-warning:  #c9a44a;
  --color-danger:   #e08080;

  /* Professions */
  --color-prof-actor:           #c9a44a;
  --color-prof-director:        #4ec9a0;
  --color-prof-scriptwriter:    #a9a4e8;
  --color-prof-cinematographer: #7ab0e0;
  --color-prof-composer:        #e09090;
  --color-prof-film-editor:     #8fbc55;

  /* Typography */
  --font-serif: 'Playfair Display', Georgia, serif;
  --font-ui:    'DM Sans', Helvetica, sans-serif;

  /* Sizing */
  --sidebar-width:         148px;
  --sidebar-width-compact:  56px;
  --topbar-height:          44px;
}
```

---

*Design system extracted from the Hollywood Animal Save Editor prototype · Claude Design · April 2026*
