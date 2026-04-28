# Hollywood Animal Save Editor — Agent Handover

This document gives a new agent everything they need to pick up work on this project without
reading the full conversation history.

---

## Project overview

A browser-based save file editor for the game **Hollywood Animal** (Weappy, Steam).
Users upload their `.json` save file, edit game state through a module-based UI, and download
the modified file. Everything runs **client-side** — no backend, no server, no file ever leaves
the browser.

**Live repo:** `https://github.com/bandicoutts/hollywoodanimaleditor` · branch `main`

---

## Dev environment

- Dev server: `npm run dev` on **port 3009** (not 3000)
- Test save: `public/examplesave.json` (gitignored). Inject a real save file with:
  ```bash
  python3 -c "
  import json, sys
  with open(sys.argv[1]) as f: data = json.load(f)
  with open('public/examplesave.json', 'w') as f: json.dump(data, f)
  " /path/to/your-save.json
  ```
- Game config files (for reference): `/Users/davidcoutts/Downloads/Configs.rar`
  - `Perks.json` — all research tree nodes and passive perks
  - `Buildings.json` — studio building definitions
  - `Presents.json` — gift/present definitions
  - `Party.json` — party/event definitions
  - `VideoTech.json` — image camera definitions (QPE stats, formats, dates, manufacturers)
  - `AudioTech.json` — audio system definitions (QPE stats, formats, dates, manufacturers)
  - `Milestones.json` — all milestone definitions and dependency chains
  - `Tutorial.json` — tutorial feature-flag unlock sequence
  - `TagCompatibilityData.json` — pairwise compatibility scores (1–5) for all script element tag pairs; used to build `COMPAT_SCORES` in `scriptElements.ts`
  - `GameVariables.json` — global game constants including `pollux_genre_factors`, `pollux_art_status_bonus`, `pollux_com_status_bonus`, `content_tags_in_script_range`, and character slot ranges
  - `GenrePairs.json` — art/com bonuses for two-genre combinations; source for `GENRE_PAIR_MODIFIERS`

---

## Commit hygiene (NON-NEGOTIABLE)

1. **Run `npx tsc --noEmit`** before every commit. Fix all errors first.
2. **No `console.log`** in committed code.
3. **No `Co-Authored-By`** lines in commit messages.
4. **No `// @ts-ignore` or `as any`** without an inline comment explaining why.
5. If the project has a `DECISIONS.md`, log architectural decisions in the same commit as the code change.

---

## Save file format

```json
{
  "currentMeta": { "lastSaveVersion": "0.8.69EA", ... },
  "stateJson": { /* all game data lives here */ },
  ...
}
```

- Files use **UTF-8 with BOM** — handle BOM on read, write it back on download.
- Serialise output as **compact JSON** (no indentation) — the game hangs on pretty-printed output.
- `stateJson` is a plain object (not a nested JSON string).
- Some numeric fields are stored as decimal strings (`"0.810"`) — preserve the original type.

---

## Module map

Each module edits a specific slice of `stateJson`. All modules are in
`src/components/modules/`.

| Module file | What it edits | Save field |
|---|---|---|
| `ResourcesModule.tsx` | Money, cash, reputation, influence, water, electricity | `budget`, `cash`, `reputation`, `influence`, `availableWater`, `availableElectricity` |
| `ResearchModule.tsx` | Research tree unlocks | `stateJson.openedPerks` (string[]) |
| `WritingTagsModule.tsx` | Story elements (genre, setting, protagonist…) | `stateJson.tagPool` (TagPoolEntry[]) |
| `TechnologiesModule.tsx` | Technology unlocks | `stateJson.technologies` |
| `MilestonesModule.tsx` | Milestone achievements | `stateJson.milestones` |
| `CharactersModule.tsx` | Character data | `stateJson.characters` |
| `AIScriptsModule.tsx` | Script Workshop — client-side script idea generator | read-only (no save edits) |
| `CompetitorStudiosModule.tsx` | Competitor studio state | `stateJson.competitorStudios` |
| `ResearchSpeedupModule.tsx` | Research speed modifiers | `overallPerkResearchSpeedup` + process data objects |
| `CheatsModule.tsx` | One-click bulk edits (negotiation, policy, agencies, XP, research speed) | multiple fields — see Module 11 in `technical-spec.md` |

---

## Critical data architecture

### `openedPerks` vs `tagPool` — these are SEPARATE

This is the most important architectural point to understand:

- **`stateJson.openedPerks`** — array of perk/research IDs (strings). Edited by the **Research** module. These are studio upgrades you unlock on the research tree (HR, Marketing, PR, Post-Production, etc.).

- **`stateJson.tagPool`** — array of `{ Item1: string, Item2: string }` where `Item1` is a tag ID and `Item2` is an ISO date string. Edited by the **Writing Tags** module. These are story element tags (genre, setting, protagonist archetype, etc.) used when writing film scripts.

**Script elements (genres, settings, protagonists, antagonists, etc.) belong in `tagPool`, NOT in `openedPerks`.** Do not add them to `PERK_GROUPS` in `perks.ts`.

When adding a tag to tagPool: `{ Item1: id, Item2: "1929-01-01T00:00:00" }` (fallback date).

### `src/data/perks.ts`

Exports used by `ResearchModule.tsx`:

- `PERK_LABELS: Record<string, string>` — ~230 authoritative display names from game localisation strings
- `PERK_GROUPS: PerkGroup[]` — 20 groups matching in-game section names exactly:
  "Legal Department", "Financial Department", "HR Department", "PR Department",
  "Marketing and Outreach", "Producers Offices", "Pre-Production", "Production Department",
  "Post-Production", "Theater Management", "Screenplay Department", "Story Workshop",
  "Maintenance", "Engineering", "Offensive Operations", "Defensive Operations",
  "Services", "Illegal gifts", "Special Events", "Buildings"
- `HIDDEN_PERK_IDS: Set<string>` — 49 `behaviour=4` perks (passive/auto-triggered). These appear in save files but are NOT research tree nodes. They are excluded from the UI but preserved in the save.
- `ALL_KNOWN_PERKS: Set<string>` — all IDs across all groups + hidden

### `src/data/tags.ts`

Exports used by `WritingTagsModule.tsx`:

- `TAG_LABELS: Record<string, string>` — ~40 human-readable overrides for non-obvious tag IDs
- `TAG_GROUPS: TagGroup[]` — 8 categories with ~253 tag IDs total:
  Genre (12), Setting (29), Protagonist (42), Supporting Character (23),
  Antagonist (34), Theme (43), Events (40), Finale (30)
- `ALL_KNOWN_TAGS: Set<string>` — all IDs across all groups

### `src/data/competitors.ts`

Exports used by `CompetitorStudiosModule.tsx`:

- `COMPETITOR_META: Record<string, CompetitorMeta>` — display metadata for the 5 known studios.
  Keys: `GB` (Gerstein Brothers), `EM` (Evergreen Movies), `SU` (Supreme), `HE` (Hephaestus), `MA` (Marginese).
  Each entry: `name`, `tier` (focus label e.g. "Art House"), `qualityRange`, `releases`.
- This is **UI-only** — derived from `CompetitorStudios.json`, never written to the save.
- **No attack tier field**: there is no "Nuclear" / "Very Aggressive" classification in the game config. Those labels were previously fabricated and have been removed. The game config only has an `ATTACK` budget percentage per studio (5% GB, 3% EM/SU, 2% HE, 0% MA). Live raid behaviour is driven by the `aggression` save field, which starts at `0.000` and ramps during play.

**Special tag IDs** that require quoted keys in TAG_LABELS (contain hyphens or Cyrillic):
- `"FREE_STATES_IN_SLAVERY-ERA"`, `"SLAVE_STATES_IN_SLAVERY-ERA"` — hyphen in ID
- `"PROTAGONIST_СORNLIMBED_ROMANTIC"` — uses **Cyrillic С** (not Latin C)
- `"PROTAGONIST_VAMPIRE_SHIT-SUCKER"` — hyphen in ID

**Naming inconsistency in game data:** one tag uses singular prefix `EVENT_CURSED_DEAL`
instead of `EVENTS_` — this is correct, do not "fix" it.

**Unobtainable tag:** `FINALE_PROTAGONIST_GETS_PUNISHED_FOR_A_CRIME` — exists in game data
with a date set to year 3000, so it's never obtainable in normal play. It is included in
`TAG_GROUPS` for completeness but will never appear in a real save.

---

## Styling conventions

Inside module files (`src/components/modules/*.tsx`):

```tsx
// CORRECT — inline styles with CSS custom properties
<div style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-ui)" }}>

// WRONG — no Tailwind classes in module files
<div className="text-gray-500 font-mono">
```

Common CSS vars: `--color-text-muted`, `--color-text-secondary`, `--color-border`,
`--color-border-subtle`, `--color-gold`, `--color-gold-mid`, `--font-ui`.

**Shared style constants** (`src/lib/styles.ts`): import these instead of repeating the literals.

| Export | Description |
|---|---|
| `LABEL_STYLE` | Muted uppercase section label (10px, font-ui, 0.08em tracking) |
| `SECTION_HEADER` | Bold uppercase column header (11px, font-ui, secondary colour) |
| `GHOST_BTN` | Small ghost button for section-level actions (3px/8px padding) |
| `ACTION_BTN` | Larger ghost button for ModuleShell header actions (5px/14px padding) |
| `goldHover(e, active)` | Standard gold hover handler for ghost/action buttons |

Usage:
```tsx
import { GHOST_BTN, goldHover } from "@/lib/styles";
<button style={GHOST_BTN} onMouseEnter={(e) => goldHover(e, true)} onMouseLeave={(e) => goldHover(e, false)}>
  Label
</button>
```

---

## Auto-push setup

A hook in `.claude/settings.local.json` automatically runs `git push` after any bash command
containing `git commit`. This is local-only (gitignored).

---

## Component architecture

The `src/components/modules/` directory follows a flat sibling-file pattern — sub-components extracted from god files live next to their parent module, not in a shared hierarchy.

| File | Role |
|---|---|
| `CharactersModule.tsx` | List panel, filter bar, bulk actions, `CharRow`, `BulkBtn` |
| `CharacterDetailPanel.tsx` | Full detail panel and all its sub-components (`AgeEditor`, `XpEditor`, `BonusEditor`, `UpgradeBonusSection`, `AppealColumn`, `AppealSection`, `LabelsEditor`). Exports `moodColor` and `displayName` for use by `CharactersModule`. |
| `CharacterStatBar.tsx` | Reusable `StatBar` — labelled slider with click-to-edit value and cap marker |
| `CharacterProfBadge.tsx` | Reusable `ProfBadge` — coloured profession badge |
| `AIScriptsModule.tsx` | Script Workshop shell — mode tabs, generate controls, pool stats, result grid |
| `ScriptBuilder.tsx` | Build Your Script mode — full accordion builder |
| `ScriptCard.tsx` | Scored combination card (used by both modes) |
| `ScoreBadge.tsx` | Art/Com/Compat/Pollux score badge chip |
| `PillButton.tsx` | Active/inactive pill toggle button |

---

## Key implementation notes

### UX safety features (`src/context/SaveFileContext.tsx`)

- **Auto-save to localStorage** on every `updateStateJson` call (debounced 500ms). Key: `hae_draft`. Silently skips files >5MB. On page load, if a draft exists, the upload screen shows a "Resume editing [filename]?" banner with timestamp.
- **`beforeunload` warning** fires when `unsavedCount > 0` — prevents accidental tab close.
- **Change log:** `updateStateJson` accepts an optional `description?: string` second argument. Described edits appear in a clickable "N unsaved changes" popover in the TopBar. After download, both are reset and the draft is cleared.
- **`ChangeEntry` interface** exported from `SaveFileContext`: `{ description: string; timestamp: number }`.

### Shared components

- **`ConfirmDialog.tsx`** — shared confirmation modal. Used by Characters bulk actions ("Max All Characters", "Remove Caps") and Competitor Studios "Eliminate".

### Characters module UX decisions

- Sort options: hire order / name A–Z / top skill ↓ / mood ↑ (triage)
- Filter toggle label: "All (incl. fired)"
- **Global bulk actions** (normal mode): "Max All Stats" (all skills + cap + mood + attitude + appeal + cinematographer filming skills) and "Uncap All Skills" (sets `limit`/`Limit` to `"1.000"`). Both show a confirmation dialog.
- **Selection mode**: toggled by a "Select" button in the bulk actions header. In selection mode clicking a row selects/deselects it (no detail panel opens); shift-click range-selects. "Select all visible" checkbox appears above the list. Seven granular bulk action buttons replace the global ones — Max All, Max Skills, Max Cap, Max Happiness, Max Loyalty, Max Appeal, **Max Filming Skills** — applying only to selected characters, no confirmation required. Max Filming Skills applies only to selected Cinematographer characters. "Done" exits selection mode. Selection clears automatically on any filter change.
- Detail panel header: "Max This Character" button sits in the header alongside name/badge/age/happiness. Per-stat "Max" buttons appear on individual stat bars, hidden once the value reaches 1.000.
- **Cinematographer filming skills** (Cinematographers only): Indoor (Soundstage) and Outdoor (Location) shown in a "Filming Skills" section. Each uses a 4-segment tier control (`1 / 2 / 3 / Max (4)`) capped at `0.400` (confirmed from `GameVariables.json: cinematographer_skill_bonus_range: "0_0.4"`). Values above `0.400` may exist in saves from in-game levelling but the editor clamps writes to `0.400`. Entry created on first write using the same default sentinel structure as appeal.
- Appeal tier selector: 4-segment joined control (not flex-wrap buttons). Each segment = one tier. Active tier highlighted with gold fill; inactive segments are ghost.
- List panel width: `clamp(360px, 35%, 500px)`

### Layout decisions

- Sidebar width: `--sidebar-width: 190px`. Label spans have no overflow/ellipsis — the aside clips naturally.
- `AppShell.tsx` `<main>` has `overflowX: hidden` and `minWidth: 0`.
- All `ModuleShell` usages have no `maxWidth` — modules fill the full available content area.
- Script card grid uses `minmax(min(380px, 100%), 1fr)` to prevent overflow on narrow viewports.

### Script Workshop

Fully implemented. See `docs/technical-spec.md` Module 10 for the complete specification.

### Remaining known gaps

- **Character list virtualisation**: With 200+ characters the list renders all DOM nodes at once. `react-window` or `react-virtual` would be needed for saves with 500+ characters.
- No undo/redo beyond the localStorage draft recovery.

---

## Files to read at session start

For most tasks, read these first:

1. `src/data/perks.ts` — if working on the Research module
2. `src/data/tags.ts` — if working on the Writing Tags module
3. `src/data/competitors.ts` — if working on the Competitor Studios module
4. `src/data/scriptElements.ts` + `src/lib/script-suggestions.ts` — if working on the Script Workshop module
5. `docs/technical-spec.md` — for save file format and field reference
6. The specific module file you're editing

For game data questions (what IDs exist, what they do):
- Extract `/Users/davidcoutts/Downloads/Configs.rar` to `/tmp/ha-configs/` with:
  `bsdtar -xf /Users/davidcoutts/Downloads/Configs.rar -C /tmp/ha-configs`
- Then read `/tmp/ha-configs/Perks.json` (research tree), `Buildings.json`, etc.
