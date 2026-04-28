# Audit: Research Tab

**Date:** 2026-04-28  
**Audited against:** `1.json` (save file, 216 opened perks), `Perks.json` (StreamingAssets/Data/Configs/)

---

## How It Works

The Research tab is split across two modules:

### ResearchModule — perk tree editor
Reads and writes `stateJson.openedPerks` (a flat array of perk ID strings). Displays all known perks grouped into 20 categories with toggle checkboxes. "Unlock All" adds every ID in the hardcoded `ALL_KNOWN_PERKS` set.

### ResearchSpeedupModule — active research completer
Reads `stateJson.overallPerkResearchSpeedup` (a decimal string) and five process-data objects. Provides two bulk actions:

- **Complete Research** — zeroes all duration/remaining/time/progress fields across `tagResearchProcessesData`, `techProcessesData`, `trashTagResearchProcessesData`, `trashRecipeResearchProcessesData`, and `partyProcessesData`
- **Complete Construction** — sets `buildings[].state = 2`, `constructionDuration = 0`, `constructionQuality = "1.000"` on all buildings

### Save-file fields accessed

| Field | Type | Read | Write |
|---|---|---|---|
| `openedPerks` | `string[]` | ✓ | ✓ |
| `overallPerkResearchSpeedup` | `string` (3-decimal) | ✓ | ✓ |
| `tagResearchProcessesData` | `Record<string, unknown>` | ✓ | ✓ (zeroed) |
| `techProcessesData` | `Record<string, unknown>` | ✓ | ✓ (zeroed) |
| `trashTagResearchProcessesData` | `Record<string, unknown>` | ✓ | ✓ (zeroed) |
| `trashRecipeResearchProcessesData` | `Record<string, unknown>` | ✓ | ✓ (zeroed) |
| `partyProcessesData` | `Record<string, unknown>` | ✓ | ✓ (zeroed) |

---

## What Works Correctly

### Field names and types — ✓
All seven field names confirmed present as top-level keys. Types match:
- `openedPerks` is a flat `string[]` (216 entries in test save, no nesting)
- `overallPerkResearchSpeedup` is `"0.000"` — decimal string, 3 places, as expected
- All five process objects were empty `{}` in the test save (no active research in progress)

### All perks in test save are known — ✓
Zero unknown perk IDs were found in the save. All 216 entries in `openedPerks` are accounted for in the editor's hardcoded list. The "Other (unknown)" overflow group would catch any that weren't.

### `HIDDEN_PERK_IDS` count matches game config — ✓
The editor maintains a separate hardcoded set of 49 hidden perk IDs (behaviour=4 in game config). The game config confirms exactly 49 perks with behaviour=4, matching this set.

### Process object zeroing approach — ✓
"Complete Research" zeroes numeric subfields inside the process objects rather than deleting them, which is safe — the game re-populates them when new research starts.

---

## Issues and Discrepancies

### 1. 19 perk IDs in the editor are explicitly unverified (flagged in technical-spec.md)

`docs/technical-spec.md` already flags 19 perk IDs as unconfirmed against the game config. These fall into four groups:

**Offensive Operations (6):**
`BM_UNLOCK`, `BM_DROWNING`, `BM_DRUNKARD`, `BM_FIGHT`, `BM_CRIMINAL`, `BM_HOUSE_BURN`
— May be event-acquired flags rather than `openedPerks`-gated research entries. Adding them via "Unlock All" may have no effect, or could corrupt event state.

**Building upgrade tiers (6):**
`BLDG_POWERPLANT_II`, `BLDG_POWERPLANT_III`, `BLDG_RND_II`, `BLDG_RND_III`, `BLDG_WATER_TOWER_II`, `BLDG_WATER_TOWER_III`
— Base `_I` variants are confirmed. Upgrade tier variants were absent from the late-game test save even though the player presumably has them. They may be tracked elsewhere (e.g., `buildings[].tier`) rather than in `openedPerks`.

**Finance/misc (4):**
`BLDG_COPYRIGHT`, `BLDG_FOCUS`, `BROADCAST_MEDIA`, `CHEAP_ILLEGALS`
— Present in editor list but not found in `Perks.json`. Source unclear.

**Hidden/bank (3):**
`BANK_LOAN_COOLDOWN_REDUCTION`, `BANK_LOAN_MICROLOAN`, `BANK_LOAN_REFINANCING`
— In the editor's `HIDDEN_PERK_IDS` set but absent from `Perks.json`. May be unused or from a future update.

**Recommendation:** Test each of the 19 in-game to confirm whether adding them to `openedPerks` has the expected effect. Until confirmed, they should remain behind a visible warning in the UI rather than being silently included in "Unlock All".

### 2. Editor count vs. game config mismatch (~216 editor IDs vs. 157 in Perks.json)

The editor's combined visible + hidden perk list totals approximately 216 IDs; `Perks.json` defines 157 (108 behaviour=0 + 49 behaviour=4). The 19 unverified IDs above account for part of this gap. The remainder may come from perks defined in other config files not yet identified.

**Recommendation:** Locate and audit all perk-defining config files, not just `Perks.json`.

### 3. Hardcoded `HIDDEN_PERK_IDS` is a manual sync point

The editor's hidden perk set is a static constant in `src/data/perks.ts`. If the game adds or reclassifies perks (changing their `behaviour` field), the editor won't update automatically. This is a low-risk maintenance issue but worth noting for future game updates.

### 4. `overallPerkResearchSpeedup` range not validated against game mechanics

The editor allows setting `overallPerkResearchSpeedup` to any 3-decimal value. The test save shows `"0.000"`. There is no confirmed upper bound, and no game config field defining a maximum speedup multiplier was found. Setting an extreme value (e.g., `"9999.000"`) is untested.

---

## Summary

| Item | Status |
|---|---|
| `openedPerks` field name and type | ✓ |
| `overallPerkResearchSpeedup` field name and type | ✓ |
| All 5 process object field names | ✓ |
| All perks in test save are known | ✓ |
| `HIDDEN_PERK_IDS` count matches game config (49) | ✓ |
| Process zeroing approach | ✓ |
| 19 unverified perk IDs | ✗ Flagged in spec but still in "Unlock All" |
| Editor count vs. Perks.json count (~216 vs. 157) | ✗ Gap not fully explained |
| `HIDDEN_PERK_IDS` requires manual sync with game updates | ✗ Low-risk maintenance issue |
| `overallPerkResearchSpeedup` upper bound unknown | ✗ No confirmed max value |
