# Audit: Cheats & Mods Tab

**Date:** 2026-04-28  
**Audited against:** `1.json` (save file, 39 buildings), `Buildings.json` (StreamingAssets/Data/Configs/)

---

## How It Works

The Cheats tab provides 8 one-click bulk operations. Unlike other tabs, it does not expose individual field editors — all operations are atomic and cover multiple fields at once.

### Operations and fields touched

| Operation | Fields written |
|---|---|
| Max All Resources | `budget` → 1B, `cash` → 1B, `reputation` → `"200000.000"`, `influence` → 1M |
| Max Negotiation Bonus | `openedPerks` += `NEGOTIATION_SCALE_50`, `NEGOTIATION_SCALE_75`; all lieutenant `BonusCardMoney` → 4, `BonusCardInfluencePoints` → 4, `bonusCards` → `[4, 4]` |
| Set Studio Policy | `mainPolicyId` → one of: `""`, `"POLICY_TRASH"`, `"POLICY_MAJOR"`, `"POLICY_BOUTIQUE"`, `"POLICY_CONVEYOR"` |
| Unlock Ad Agencies | `openedAdsAgents[]` += known agency IDs |
| Set Research Speedup | `overallPerkResearchSpeedup` → `"1.000"`, `"5.000"`, `"10.000"`, or `"99.000"` |
| Max XP All Characters | `characters[].xp` → 9,999,999 (all characters) |
| Complete All Research | Zeroes duration/remaining/time/progress fields in all 5 process objects |
| Complete All Construction | Buildings with `state === 1`: `state` → 2, `constructionDuration` → 0, `constructionQuality` → `"1.000"` |

---

## What Works Correctly

### Field names and types — ✓
All fields verified against the save file. Types match:
- `state` is a number (2 = built, 1 = under construction)
- `constructionDuration` is a number (integer)
- `constructionQuality` is a 3-decimal string (`"1.000"`)
- `overallPerkResearchSpeedup` is a 3-decimal string (`"0.000"` in test save)

### Building state logic — ✓
`state === 2` confirmed as the "fully built" value across all 39 buildings in the test save. Setting `state = 2`, `constructionDuration = 0`, `constructionQuality = "1.000"` is the correct completion state.

### Construction completion is a no-op when nothing is in progress — ✓
The operation checks `state === 1` before modifying, so applying it to a fully-built studio is safe.

### Research process zeroing — ✓
All five process objects (`tagResearchProcessesData`, `techProcessesData`, `trashTagResearchProcessesData`, `trashRecipeResearchProcessesData`, `partyProcessesData`) exist in the save and are correctly handled.

### Lieutenant bonus card sync — ✓
`BonusCardMoney`, `BonusCardInfluencePoints`, and `bonusCards[]` are all written atomically. Consistent with Characters tab handling.

### Shared code with ResearchSpeedupModule — ✓
Complete Research and Complete Construction logic is identical to the implementation in `ResearchSpeedupModule.tsx`, confirming consistency across modules.

---

## Issues and Discrepancies

### 1. `mainPolicyId` value `"REJECTED"` is not in the editor's option set

The test save contains `mainPolicyId: "REJECTED"` — a game-generated state representing a rejected policy vote. The editor's Set Studio Policy options are:

```
"" (None), "POLICY_TRASH", "POLICY_MAJOR", "POLICY_BOUTIQUE", "POLICY_CONVEYOR"
```

`"REJECTED"` is not in this list. If a player's current policy is `"REJECTED"` and they open the cheats tab, the dropdown will not reflect the current save state (it will show whichever option is selected by default). Setting any policy from the editor will overwrite `"REJECTED"` — this is probably fine functionally, but players won't see that their current state is "rejected".

**Recommendation:** Add `"REJECTED"` as a read-only display option (or show the current value if it doesn't match the known list) so the player can see their actual state before changing it.

### 2. `openedAdsAgents` agency IDs are hardcoded but unverified

"Unlock Ad Agencies" adds a hardcoded list of agency IDs to `openedAdsAgents`. This list was not verified against a game config file during this audit — no `AdsAgents.json` or equivalent was found in the checked config directories. If agency IDs have changed between game versions, the list may be stale.

**Recommendation:** Verify the hardcoded agency IDs against the game's data files.

### 3. Max XP sets `xp = 9,999,999` — may conflict with Characters audit finding

The Characters tab audit found that `xp` can be negative (a valid mid-leveling state). Setting all characters to `xp = 9,999,999` via Cheats will overwrite any character currently in a valid negative-XP state and may trigger rapid uncontrolled leveling for characters who are mid-progression.

This is probably the intended "cheat" behaviour, but worth noting: the effect is not reversible without re-uploading the original save.

### 4. `constructionQuality` set to `"1.000"` — overrides actual build quality

Buildings built during gameplay can have quality values below 1.0 (e.g., `"0.794"` observed). "Complete All Construction" sets quality to `"1.000"` for any building that was in construction state 1, but leaves already-built buildings (state 2) untouched. This is correct scoping.

However, if a player wanted to improve the quality of an already-built but poor-quality building, they cannot do so through the editor. Minor gap.

---

## Summary

| Item | Status |
|---|---|
| All 8 operations verified field-correct | ✓ |
| Building state/duration/quality types | ✓ |
| Construction completion no-op when nothing in progress | ✓ |
| Research process zeroing | ✓ |
| Lieutenant bonus card sync | ✓ |
| `mainPolicyId: "REJECTED"` not shown in policy dropdown | ✗ Current state hidden from player |
| `openedAdsAgents` IDs not verified against config | ✗ Potentially stale list |
| Max XP overwrites valid negative-XP characters | ✗ Expected cheat behaviour but irreversible |
