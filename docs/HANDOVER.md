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

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js (check `node_modules/next/dist/docs/` — this version has breaking API changes) |
| Styling | **Inline `style={{}}` with CSS custom properties** in module files. No Tailwind inside module files. Tailwind is used only in global/layout-level files. |
| Deploy | Vercel |
| Runtime | All client-side; no API routes, no DB |

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
| `ResourcesModule.tsx` | Money, cash, reputation, fans, awards | `budget`, `cash`, `reputation`, etc. |
| `ResearchModule.tsx` | Research tree unlocks | `stateJson.openedPerks` (string[]) |
| `WritingTagsModule.tsx` | Story elements (genre, setting, protagonist…) | `stateJson.tagPool` (TagPoolEntry[]) |
| `TechnologiesModule.tsx` | Technology unlocks | `stateJson.technologies` |
| `MilestonesModule.tsx` | Milestone achievements | `stateJson.milestones` |
| `CharactersModule.tsx` | Character data | `stateJson.characters` |
| `AIScriptsModule.tsx` | Script Workshop — client-side script idea generator | read-only (no save edits) |
| `CompetitorStudiosModule.tsx` | Competitor studio state | `stateJson.competitorStudios` |
| `ResearchSpeedupModule.tsx` | Research speed modifiers | `stateJson.researchSpeedup` |

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
  Each entry: `name`, `tier`, `attackTier` (`"Nuclear" | "Very Aggressive" | "None"`), `qualityRange`, `releases`, `defenceless`.
- This is **UI-only** — derived from game config files, never written to the save.
- Source: `CompetitorStudios.json` + `CompetitorStrategies.json` (same Configs.rar archive as Perks/Buildings).

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

---

## Auto-push setup

A hook in `.claude/settings.local.json` automatically runs `git push` after any bash command
containing `git commit`. This is local-only (gitignored).

---

## Current state (as of 2026-04-27, updated same day)

All major data work is complete:

- **Research module**: All ~230 perks labelled with authoritative game localisation strings,
  grouped into 20 sections matching the in-game research tree, 49 hidden behaviour=4 perks
  excluded from UI but preserved in saves.
- **Writing Tags module**: All 253 script element tags across 8 categories, with human-readable
  labels for non-obvious IDs. Inactive tags show date/recipe lock hints; active tags never show
  a hint. Three elements (Toxic Revenger, Killer Toaster, Wizard War) have `availalbeFromStartTag:
  true` in `TagData.json` and use `">=1929"` unlock conditions despite having an associated recipe.
- **Competitor Studios module**: Each studio card shows the full studio name, two-letter ID badge,
  and a read-only reference row (tier, attack capability, quality range, releases/yr, defenceless
  flag). Metadata lives in `src/data/competitors.ts`.
- **Technologies module**: Each technology card shows its proper display name (resolved from a
  static `TECH_INFO` lookup keyed on `configId`), grouped by manufacturer (Dupler / Hespro /
  Blue Term / Flumen for cameras; Sonatone / Frametone / FilmSound for audio). Cards show format,
  release year, Quest badge, Color badge (color cameras only), Outdated badge, and Quality /
  Practicality / Economy stats as dot rows with numeric values. Custom technologies (no `configId`)
  appear in a read-only "Custom" section at the bottom of each column. The `TECH_INFO` lookup
  and manufacturer ordering are hardcoded in `TechnologiesModule.tsx` — source data is
  `VideoTech.json` and `AudioTech.json` from the game configs.
- **Milestones & Game Flags module**: Milestones are now grouped under Studio Policies and Technology Quests super-section headers, with per-policy/quest sub-group headers (Trash King, Behemoth, Boutique, Factory, All-Rounder; quest groups for all 18 known tech quests). Each milestone row shows a human-readable label and a description subtitle sourced from `MILESTONE_META` in `MilestonesModule.tsx`. Game feature flags are grouped into UI / Management / Events & Competition with human-readable labels from `FUNC_META`. All toggles (Locked/Finished on milestones; toggle pill on features) are unchanged.
- **Script Workshop module** (`AIScriptsModule.tsx`): Two modes, toggled by tab at the top of the module.
  - **Generate Ideas**: Generates up to 6 scored suggestions entirely client-side. Pool filtering uses **`tagPool` membership** — only elements already in the player's `tagPool` (or `tagRecipesPool`) appear as options; date conditions in `scriptElements.ts` are for Writing Tags lock hints only, not for Workshop filtering. Controls: genre filter pills, Art / Balanced / Commercial / Pollux bias toggle, themes/events stepper (3–5). All 3 character types mandatory. Logic in `src/lib/script-suggestions.ts`; element data (art/com, unlock conditions, `COMPAT_SCORES` 5,662 entries, `POLLUX_GENRE_FACTORS`) in `src/data/scriptElements.ts`. Pollux formula: `genre_factor × (art × 2 + com)` from `GameVariables.json`.
  - **Build Your Script**: Guided accordion-based builder. Selecting any element instantly re-ranks all other category lists by `COMPAT_SCORES` compatibility score (green dot ≥1.0, gold dot >0, no dot = 0). Categories auto-advance on selection. Running Art/Com/Compat score bar appears once ≥2 elements are selected. Optional second genre picker sorted by `GENRE_PAIR_MODIFIERS` benefit. "Auto-complete Script" fills any empty slots using the existing generator and merges with player selections; "Complete Script" appears when everything is manually filled. Final result rendered as a `ScriptCard`. Two new exported helpers in `script-suggestions.ts`: `scoreElementCompatibility` (scores a candidate against a selected set) and `scorePartialBuild` (partial Art/Com/Synergy for the running score bar).
- **Characters module** (`CharactersModule.tsx`): Character `birthDate` field (format `"DD-MM-YYYY"`) is now read and displayed as the character's current in-game age in the detail panel header (e.g. "Age 39"). Click-to-edit: entering a new age back-calculates a new `birthDate` keeping the original day and month, writing only the year. Age is derived from `parseGameDate(stateJson)` (game date from `stateJson.timePassed`). Characters without a `birthDate` field show nothing. `birthDate?: string` added to the `Character` interface in `save-file.ts`.
- **Technical spec** (`docs/technical-spec.md`): Up to date with all the above.

No outstanding tasks at this handover point (updated 2026-04-27).

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
