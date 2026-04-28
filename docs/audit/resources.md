# Audit: Resources Tab

**Date:** 2026-04-28  
**Audited against:** `Save 23 Feb 1939.json` (14MB), `GameVariables.json` (StreamingAssets/Data/Configs/)

---

## How It Works

The Resources tab exposes six top-level fields from the save file's `stateJson` object, split into two visual groups:

### Primary Resources (4 fields)

Each field gets a labelled slider (0 → max), a click-to-edit value display, four preset buttons (25% / 50% / 75% / 100% of max), and a "Max All Resources" button that sets all four simultaneously.

| Field | Save key | Type | Editor max | Description |
|---|---|---|---|---|
| Budget | `budget` | integer | 1,000,000,000 | Studio operating budget |
| Cash | `cash` | integer | 1,000,000,000 | Liquid cash on hand |
| Influence | `influence` | integer | 1,000,000 | Influence points |
| Reputation | `reputation` | string (`"NNN.NNN"`) | 200,000 | Studio reputation score |

### Utilities (2 fields)

Same slider UI. Displayed as integers, stored as 3-decimal strings.

| Field | Save key | Type | Editor max | Description |
|---|---|---|---|---|
| Water Supply | `availableWater` | string (`"NNN.NNN"`) | 999,999 | Available water units |
| Electricity Supply | `availableElectricity` | string (`"NNN.NNN"`) | 999,999 | Available electricity units |

### Type handling

- `budget`, `cash`, `influence` — read and written as plain integers (`Math.round(value)`)
- `reputation`, `availableWater`, `availableElectricity` — read via `parseFloat()`, written back as `value.toFixed(3)` (i.e. `"200000.000"`)

### Persistence

Changes flow through `SaveFileContext.updateStateJson`, which debounce-saves a draft to `localStorage` (key `"hae_draft"`) every 500ms. A `beforeunload` warning fires if there are unsaved changes.

---

## What Works Correctly

All six fields were verified against the actual save file and game config:

### Field names and nesting — ✓
All six keys (`budget`, `cash`, `reputation`, `influence`, `availableWater`, `availableElectricity`) are present as direct top-level properties of `stateJson`. None are nested. The editor accesses them correctly.

### Data types — ✓
The actual save file confirms the mixed-type pattern the editor expects:
- `budget`, `cash`, `influence` → plain integers (e.g. `1000000000`)
- `reputation`, `availableWater`, `availableElectricity` → quoted decimal strings (e.g. `"200000.000"`, `"999999.000"`)

The editor's read (`parseFloat`) / write (`.toFixed(3)`) round-trip correctly preserves the format.

### Consumption rate descriptions — ✓
The UI describes water as "4 per staff/tick" and electricity as "5 per staff/tick". These match `GameVariables.json` exactly:
- `water_usage_per_staff: 4`
- `electricity_usage_per_staff: 5`

### Max values (water/electricity) — ✓
The editor caps both utility fields at 999,999. The save file shows `"999999.000"` for both, confirming these are achievable/valid values.

### Max values (budget/cash) — ✓
Editor cap of 1,000,000,000 is confirmed by the save showing `1000000000` for both fields — the game accepts this value without issue.

---

## Issues and Discrepancies

### 1. `max_reputation` in GameVariables appears unrelated to the stored value cap

`GameVariables.json` contains a field `max_reputation: 100`. At first glance this suggests the editor's cap of 200,000 is wrong by a factor of 2,000. However:

- `starting_reputation: 300.00` in the same file already exceeds 100, which would be impossible if 100 were the stored value cap
- The actual save file contains `"200000.000"` — the game accepts and runs with this value
- The `max_reputation: 100` value most likely refers to a per-negotiation reputation modifier cap or a UI display scale, not the cap on the raw stored value

**Conclusion:** The editor's 200,000 cap appears empirically correct, but the exact in-game ceiling is unconfirmed from config alone. No change recommended without further game testing.

### 2. `otherCountableResources` is not exposed

The save file contains a top-level `otherCountableResources` dictionary alongside the six edited fields. It holds item counts for luxury goods and scandal/contraband items:

```
WATCH, SIGARS, ALCOHOL, WARDROBE_COUTURE, EUROPEAN_SPORTCAR,
HEROIN, COCAINE, ANIMAL_MURDER, PORNO_TAPE, MONKEY_BRAINS,
ILLEGAL_SAFARI, CANNIBAL_DINNER, EVENING_WITH_UNDERAGED, METH
```

These are consumable resources used in negotiation and party mechanics. They are not editable in the current Resources tab and there is no other tab covering them. This is a gap — a player wanting to stock up on negotiation items has no way to do so through the editor.

A companion `requestedCountableResources` field tracks pending requests for the same items.

**Recommendation:** Add an "Items / Inventory" section — either within the Resources tab or as a new tab — to expose `otherCountableResources`. The `requestedCountableResources` field is bookkeeping and should be left read-only or reset to zero when items are added.

### 3. `boughtWaterThisMonth` / `boughtElectricityThisMonth` are not exposed

The save file contains two monthly purchase-tracking fields:
- `boughtWaterThisMonth: "3658.100"`
- `boughtElectricityThisMonth: "6876.199"`

These track how much utility capacity was purchased in the current in-game month. They feed into cost calculations — if you zero out `availableWater` but leave `boughtWaterThisMonth` high, the monthly billing may behave unexpectedly.

**Recommendation:** When the editor sets `availableWater` or `availableElectricity`, it should also reset the corresponding `boughtXThisMonth` field to `"0.000"` to keep the game state consistent. This is a silent side-effect bug rather than a missing feature.

---

## Summary

| Item | Status |
|---|---|
| All 6 field names correct | ✓ |
| Type handling (int vs decimal string) | ✓ |
| Water/electricity consumption rate descriptions | ✓ |
| Utility max values (999,999) | ✓ |
| Budget/cash max values (1B) | ✓ |
| Reputation max (200,000) | Likely correct — `max_reputation: 100` in config is a different concept |
| `otherCountableResources` (negotiation items) | ✗ Not covered — gap |
| `boughtWaterThisMonth` / `boughtElectricityThisMonth` | ✗ Not reset when utilities are edited — potential consistency issue |
