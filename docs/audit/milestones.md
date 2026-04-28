# Audit: Milestones Tab

**Date:** 2026-04-28  
**Audited against:** `1.json` (save file, 29 milestones, 33 functionalities), `Milestones.json` (StreamingAssets/Data/Configs/)

---

## How It Works

The Milestones tab covers two distinct game systems displayed side by side:

### Milestones (left column)
Reads and writes `stateJson.milestones`, an object keyed by milestone ID. Each entry has toggles for `finished` and `locked`, and an editable `progress` value. "Unlock All" sets every milestone to finished.

### Game Features / Functionalities (right column)
Reads and writes `stateJson.functionalities`, a flat `Record<string, boolean>`. Each key is a feature flag toggled on/off.

### Save-file fields accessed

| Field | Type | Read | Write |
|---|---|---|---|
| `milestones` | `Record<string, Milestone>` | ✓ | ✓ |
| `[milestoneId].finished` | boolean | ✓ | ✓ |
| `[milestoneId].locked` | boolean | ✓ | ✓ |
| `[milestoneId].progress` | string (`"N.NNN"`) | ✓ | ✓ |
| `[milestoneId].group` | string | ✓ | — |
| `[milestoneId].chains` | array | ✓ | — |
| `functionalities` | `Record<string, boolean>` | ✓ | ✓ |
| `functionalities[key]` | boolean | ✓ | ✓ |

### Write logic
- **Toggle finished:** sets `finished = !finished`; if finishing, also sets `progress = "1.000"` and `locked = false`
- **Toggle locked:** sets `locked = !locked` only
- **Unlock All:** sets every milestone to `finished = true`, `locked = false`, `progress = "1.000"`

---

## What Works Correctly

### Milestone field names and types — ✓
All fields confirmed correct in actual saves. `progress` is always a 3-decimal string, can exceed `"1.000"` (e.g. `"8.000"`, `"54.000"`) for milestones with larger goals.

### Functionalities — ✓
All 33 functionality keys in the test save match the module's hardcoded `FUNC_META` exactly. No unknown flags detected.

Observed values in save:
```
Enabled (30): AttackByCompetitors, BirdView, Building, Captains, Cash,
  CharacterEvents, Fire, FreezeBuilding, FullTimeControls, HRSelection,
  Influence, InfoButton, MapNavigation, PerksEnabled, Policy,
  ProductionEvents, QualitySelection, Scandals, Secrets,
  ShowBottomBarButtons, ShowBottomBarProgress, ShowBottomConstructorButton,
  ShowBottomStartProjectButton, ShowTopBarElements, Staff, StaffRaises,
  StaffRequests, TimeFlow, UnblockUI, Upgrades

Disabled (3): Lieutenants, PoliceDefence, PoliceRaidDefense
```

### Unknown milestone display — ✓
Milestone IDs not in `MILESTONE_META` fall back to an auto-formatted display (e.g., `"POLICY_AVERAGE_0"` → "Policy Average 0"). No crash or data loss.

### Round-trip safety — ✓
`chains` (always `[]`) and any unknown fields pass through via `[key: string]: unknown`.

---

## Issues and Discrepancies

### 1. "Unlock All" sets `progress = "1.000"` but some milestones have goals > 1

When "Unlock All" fires, every milestone gets `progress = "1.000"`. However, several milestones have goals that exceed 1.0:

- `POLICY_MAJOR_1` — requires 8 skilled actors; actual finished value in save is `"8.000"`
- `POLICY_MAJOR_3` — requires 365 days; in-progress value in save is `"54.000"`
- Quest milestones (e.g. `HESPRO_QUEST_2`) have goals like `"6.000"` (sequel chains)

Setting these to `"1.000"` while `finished = true` creates an inconsistent state — the milestone is marked done but the progress value doesn't match what the game would have written. Whether the game re-validates this on load is unknown, but it could cause display glitches or event-chain issues.

**Recommendation:** When unlocking a milestone, read the `goal` field from game config (or maintain a local `MILESTONE_GOALS` map) and set `progress` to the goal value rather than always `"1.000"`.

### 2. `POLICY_AVERAGE_0–3` are in the editor and save but not in `Milestones.json`

Four milestone IDs appear in both the save file and the editor's hardcoded `MILESTONE_META`:
- `POLICY_AVERAGE_0`, `POLICY_AVERAGE_1`, `POLICY_AVERAGE_2`, `POLICY_AVERAGE_3`

These do not exist in `Milestones.json`. They are likely deprecated entries from an earlier game version that remain in older saves. The editor handles them gracefully (displays them, allows toggling) but their current game effect is unknown — they may do nothing.

### 3. Milestone goal values not shown in the UI

`Milestones.json` includes a `goal` field (e.g. `"1.000"`, `"365.000"`, `"1500000.000"`) for each milestone. The editor displays `progress` but not the target goal, so a player cannot easily tell how far along a milestone is without knowing the goal from the game itself.

This is a display gap rather than a correctness bug.

### 4. Dependency chains not shown

`Milestones.json` includes `dependencies` arrays. The editor shows `locked`/`finished` state but doesn't indicate which milestones are prerequisites for which. Manually unlocking a locked milestone without its prerequisites may create an inconsistent state.

---

## Summary

| Item | Status |
|---|---|
| Milestone field names and types | ✓ |
| Functionalities field names and types | ✓ |
| All 33 functionality keys match | ✓ |
| Round-trip safety | ✓ |
| "Unlock All" sets `progress = "1.000"` even when goal > 1 | ✗ Inconsistent state for count/chain milestones |
| `POLICY_AVERAGE_0–3` not in game config | ✗ Legacy entries — unknown current effect |
| Goal values not displayed in UI | ✗ Minor display gap |
| Dependency chains not visualised | ✗ Minor gap |
