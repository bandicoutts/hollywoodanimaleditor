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

### 1. Tab is blank when `competitorStudios` is empty — and this is common

The module renders using `Object.entries(competitorStudios)`. If the object is `{}`, the tab shows nothing to edit.

In the test save (`1.json`), `competitorStudios` is an **empty object** despite being a late-game save with 1,199 characters and 345 competitor movies. This suggests `competitorStudios` entries are only created when the player has directly interacted with a studio (e.g., performed a raid, triggered an event that sets aggression). Studios the player has never touched do not appear.

A player who has never raided a competitor — or who is in early game — will see a completely empty Competitors tab with no way to interact with any studio. The editor provides no mechanism to **create** entries for studios not yet in the map.

**Recommendation:** When `competitorStudios` is empty or a studio ID is absent, offer to create a default entry with sensible starting values (`lastBudget: 0`, `aggression: "0.000"`, `isUnderRaid: false`, `isDead: false`). Alternatively, display all five known studios and create the save entry only on first edit.

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
| Tab is empty when `competitorStudios: {}` (common) | ✗ No way to create entries for untouched studios |
| `competitorMovies` not exposed | ✗ Minor gap |
| `specialCompetitorsProposals` cooldowns not exposed | ✗ Minor gap |
