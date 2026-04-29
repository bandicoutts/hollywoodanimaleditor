# Audit: Competitors Tab

**Date:** 2026-04-28  
**Audited against:** `1.json` (save file), `CompetitorStudios.json` (StreamingAssets/Data/Configs/)

---

## How It Works

The Competitors tab iterates `stateJson.competitorStudios`, an object keyed by studio ID (e.g. `"GB"`, `"EM"`). For each entry it renders a card with four editable fields.

### Save-file fields accessed

| Field | Type | Read | Write |
|---|---|---|---|
| `competitorStudios` | `Record<string, CompetitorStudio>` | ✓ | ✓ |
| `[studioId].lastBudget` | number | ✓ | ✓ |
| `[studioId].aggression` | string (`"N.NNN"`) | ✓ | ✓ |
| `[studioId].isUnderRaid` | boolean | ✓ | ✓ |
| `[studioId].isDead` | boolean | ✓ | ✓ |

Display metadata (name, tier, quality range, releases/year) is sourced from a hardcoded `COMPETITOR_META` lookup, not from the save.

### Known studio IDs
`GB` (Gerstein Brothers), `EM` (Evergreen Movies), `SU` (Supreme), `HE` (Hephaestus), `MA` (Marginese)

---

## What Works Correctly

### Field names and types — ✓
All four editable fields confirmed correct. `aggression` is stored as a 3-decimal string and written back via `formatDecimalString()`. `lastBudget` is a plain integer. Booleans are booleans.

### Studio IDs — ✓
The five hardcoded IDs in `COMPETITOR_META` match `CompetitorStudios.json` exactly. No missing or extra studios.

### Round-trip safety — ✓
Unhandled fields (`competitorMovies`, `specialCompetitorsProposals`, `nextGenCompetitorCharacterTimers`, etc.) are preserved via `[key: string]: unknown`.

---

## Issues and Discrepancies

### 1. Tab is blank when `competitorStudios` is empty — and this is common (✅ Fixed)

The module previously rendered using `Object.entries(competitorStudios)`. If the object was `{}`, the tab showed nothing to edit.

**Full runtime structure confirmed from real saves (Autosave 01 07 1936.json and later).** All 5 studios are initialized simultaneously at a mid-game trigger (between April and July of game-year 1936 in a typical playthrough). The complete 19-field entry structure per studio is:

```json
{
  "id": null,
  "isUnderRaid": false,
  "lastBudget": 27250673,
  "incomeThisMonth": -651083,
  "ip": 2075,
  "avgAttitude": "1.000",
  "aggression": "0.000",
  "generalSpending": 337500,
  "attackedThisMonth": 0,
  "abortedMoviesThisYear": 0,
  "targetBaselineMultiplier": "1.120",
  "targetBudgetMultiplier": "1.120",
  "cinemasDiffLastMonth": 1,
  "isDead": false,
  "attackCooldown": 0,
  "budgetCheatsRemaining": 2,
  "wallets": {},
  "scheduledMovies": [472, 476, 484],
  "debugStats": [],
  "budgetOnStartOfYear": 0
}
```

**Fix implemented:** The tab now always displays all 5 known studios. Studios absent from the save file show a "Not yet encountered" placeholder with a "Create Entry" button. Clicking it inserts a full 19-field default entry with `aggression: "0.000"`, `isDead: false`, `isUnderRaid: false`, and a tier-appropriate `lastBudget` (GB: 29M, EM/SU: 6M, HE: 4M, MA: 2M). All other fields default to 0/false/empty.

### 2. `competitorMovies` not exposed

The save contains a `competitorMovies` array (345 entries in the test save) alongside `competitorStudios`. Each entry includes the studio ID, release dates, and quality metrics. This is read-only game data and not an editing priority, but players have no way to inspect competitor filmographies.

### 3. `specialCompetitorsProposals` cooldowns not exposed

```json
{
  "PROPOSAL_ILLEGAL_LIMIT": { "globalCooldownDays": 1460, "conditionCooldownDays": 0 },
  "PROPOSAL_LIMIT_RELEASE_SLOTS_FOR_MOVIE": { "globalCooldownDays": 1369, ... },
  ...
}
```

These cooldowns gate certain negotiation proposals. A player wanting to reset proposal cooldowns cannot do so through the editor. Minor gap.

---

## Summary

| Item | Status |
|---|---|
| `lastBudget` field name and type | ✓ |
| `aggression` field name and decimal string format | ✓ |
| `isUnderRaid` boolean | ✓ |
| `isDead` boolean | ✓ |
| Studio IDs (all 5 match config) | ✓ |
| Round-trip safety | ✓ |
| Tab is empty when `competitorStudios: {}` (common) | ✅ Fixed — all 5 studios shown with Create Entry for missing ones |
| `competitorMovies` not exposed | ✗ Minor gap |
| `specialCompetitorsProposals` cooldowns not exposed | ✗ Minor gap |
