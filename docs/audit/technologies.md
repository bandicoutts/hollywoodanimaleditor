# Audit: Technologies Tab

**Date:** 2026-04-28  
**Audited against:** `1.json` (save file, 12 technologies), `VideoTech.json`, `AudioTech.json` (StreamingAssets/Data/Configs/)

---

## How It Works

The Technologies tab displays the player's technology inventory (cameras and sound equipment) and allows toggling each item as `owned`. Technologies are split into two types by `type` field (0 = Camera, 1 = Sound) and grouped by manufacturer.

### Save-file fields accessed

| Field | Type | Read | Write | Notes |
|---|---|---|---|---|
| `technologies` | `Technology[]` | ✓ | ✓ | Top-level array |
| `technologies[].id` | number | ✓ | — | Unique identifier |
| `technologies[].configId` | string | ✓ | — | Game config key; empty string for player-created tech |
| `technologies[].type` | number | ✓ | — | 0 = Camera, 1 = Sound |
| `technologies[].format` | string | ✓ | — | e.g. `"35-mm"`, `"Mono On-Film"` |
| `technologies[].owned` | boolean | ✓ | ✓ | Only editable field |
| `technologies[].created` | boolean | ✓ | — | True for player-invented tech |
| `technologies[].releaseYear` | number | ✓ | — | Displayed for context |
| `technologies[].isOutDated` | boolean | ✓ | — | Badge display only |
| `nextTechId` | number | ✓ | — | Next ID to assign; not modified by editor |

Display names, QPE (Quality/Practicality/Economy) stats, and manufacturer groupings are sourced from a hardcoded `TECH_INFO` lookup keyed by `configId` — not from the save file.

Technologies with an empty `configId` are displayed read-only under a "Custom" section.

---

## What Works Correctly

### `owned` toggle — ✓
The single editable field, `owned`, is correctly read and written as a boolean. The editor only writes this field and passes everything else through untouched via the `[key: string]: unknown` escape hatch in the type definition.

### Round-trip safety — ✓
The `Technology` interface uses `[key: string]: unknown` which means all 17 fields present in the actual save are preserved on round-trip even though only 8 are explicitly typed.

### `configId` empty-string detection for custom tech — ✓
Player-invented technologies have `configId: ""`. The editor correctly detects this and displays them read-only, avoiding any attempt to look them up in `TECH_INFO`.

### `type` enum (0/1) — ✓
Confirmed in save: camera techs have `type: 0`, sound techs have `type: 1`. Grouping logic is correct.

---

## Issues and Discrepancies

### 1. `DOMINUS` is missing from the editor's `TECH_INFO` lookup

`AudioTech.json` defines 11 audio technologies. The editor's `TECH_INFO` hardcodes 29 entries — all except `DOMINUS` (Sonatone Dominus). If a save contains a technology entry with `configId: "DOMINUS"`, the editor will not find it in `TECH_INFO` and will display it as "Custom Tech" in the read-only section, despite it being a standard purchasable technology. The `owned` toggle will not be available for it.

**Recommendation:** Add `DOMINUS` to `TECH_INFO` in `TechnologiesModule.tsx`.

### 2. Type definition is missing 9 fields present in actual saves

The `Technology` interface explicitly types only 8 fields. The actual save object has 17:

| Field | In type? | Notes |
|---|---|---|
| `id` | ✓ | |
| `configId` | ✓ | |
| `type` | ✓ | |
| `format` | ✓ | |
| `owned` | ✓ | |
| `created` | ✓ | |
| `releaseYear` | ✓ | |
| `isOutDated` | ✓ | |
| `name` | — | null for standard tech; populated string for player-created tech |
| `isColored` | — | boolean; black-and-white vs. colour film |
| `currentPointsQPE` | — | `number[]`; actual in-game QPE values (editor uses static `TECH_INFO` instead) |
| `improvedFromId` | — | integer; upgrade chain predecessor (-1 if none) |
| `improvedToId` | — | integer; upgrade chain successor (-1 if none) |
| `lastSellInterestRoll` | — | ISO datetime string |
| `sellData` | — | array of sale transaction objects |
| `isMarkedToBeOutDated` | — | boolean; obsolescence pending |
| `outDate` | — | ISO datetime or null; when obsolescence occurs |

The `[key: string]: unknown` catch-all ensures these fields survive round-trips, but the editor is entirely blind to them. This is low risk for current functionality but means the type is misleading documentation.

### 3. Obsolescence data not exposed

The editor shows `isOutDated` as a badge but does not expose:
- `isMarkedToBeOutDated` — a tech can be "pending obsolescence" before it's officially outdated
- `outDate` — the exact date it will become obsolete

A player cannot see or adjust when a technology ages out.

### 4. `currentPointsQPE` vs. `TECH_INFO` displayPointsQPE

The save stores `currentPointsQPE` (e.g., `[15, 15, 15]` for player-upgraded tech, `[1, 1, 2]` for a basic camera). The editor ignores this and displays QPE stats from the hardcoded `TECH_INFO`, which uses `displayPointsQPE` from the config (i.e., the base/starting values). For player-upgraded technologies this means the editor shows incorrect (lower) QPE stats.

This is display-only — the editor doesn't write QPE values — but it's misleading.

### 5. Upgrade chain fields not exposed

`improvedFromId` and `improvedToId` track technology upgrade chains (e.g., a standard camera upgraded to a quest variant). These are not visible or editable. A player who wants to understand or modify their tech progression chain cannot do so.

---

## Complete Technology List from Game Config

**Camera technologies (19) — VideoTech.json:**
```
DUPLER
HESPRO_STANDART
HESPRO_QUEST
BLUE_TERM_IRIS_STANDART
BLUE_TERM_IRIS_QUEST
DUPLER_COMPACT_STANDART
DUPLER_COMPACT_QUEST
BLUE_TERM_VIVID
FLUMEN_STANDART
HESPRO_70_STANDART
HESPRO_70_EXTRA_QUEST
BLUE_TERM_LUCID_STANDART
BLUE_TERM_LUCID_DELUXE_QUEST
DUPLER_COMPACT_CF_STANDART
DUPLER_COMPACT_CFS_QUEST
HESPRO_70_RAD_STANDART
HESPRO_70_RAD_EXTRA_QUEST
FLUMEN_CELERE_STANDART
FLUMEN_CELERE_PRO_QUEST
```

**Audio technologies (11) — AudioTech.json:**
```
SONATONE
DOMINUS
FRAMETONE_STANDART
FRAMETONE_QUEST
FILMSOUND_STANDART
FRAMETONE_CLEAR_STANDART
FRAMETONE_CRYSTAL_CLEAR_QUEST
FILMSOUND_ORGANUM_STANDART
FILMSOUND_NOVUM_ORGANUM_QUEST
FRAMETONE_ALTUM_STANDART
FRAMETONE_PRAEALTUM_QUEST
```

---

## Summary

| Item | Status |
|---|---|
| `owned` toggle read/write | ✓ |
| Round-trip safety for unlisted fields | ✓ |
| Custom tech (`configId: ""`) detection | ✓ |
| `type` enum (0/1) | ✓ |
| `DOMINUS` missing from `TECH_INFO` | ✗ Displays as "Custom Tech", no owned toggle |
| Type definition incomplete (9 fields missing) | ✗ Low risk — escape hatch preserves them |
| `currentPointsQPE` ignored — wrong QPE shown for upgraded tech | ✗ Display bug |
| Obsolescence dates not exposed | ✗ Minor gap |
| Upgrade chain fields not exposed | ✗ Minor gap |
