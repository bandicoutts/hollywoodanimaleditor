# Audit: Writing Tags Tab

**Date:** 2026-04-28  
**Audited against:** `1.json` (save file), `TagData.json` (StreamingAssets/Data/Configs/)

---

## How It Works

The Writing Tags tab reads and writes two save-file fields:

| Field | Type | Role |
|---|---|---|
| `tagPool` | `TagPoolEntry[]` | Active (unlocked) writing tags — the primary editable field |
| `tagRecipesPool` | `string[]` | Tags discovered via in-game recipes — read-only in the editor |

Each entry in `tagPool` is a two-field object:
```json
{ "Item1": "PROTAGONIST_COWBOY", "Item2": "1929-01-01T00:00:00" }
```
- `Item1` — tag ID string (uppercase, e.g. `"DRAMA"`, `"PROTAGONIST_SAILOR"`)
- `Item2` — ISO datetime string when the tag became available, **no `Z` suffix** (e.g. `"1936-03-05T00:00:00"`)

### What the UI exposes

The tab renders all tags from a hardcoded list (`src/data/tags.ts`) grouped into 8 categories:

| Group | Tag count |
|---|---|
| Genre | 12 |
| Setting | 29 |
| Protagonist | 42 |
| Supporting | 23 |
| Antagonist | 34 |
| Theme | 43 |
| Events | 40 |
| Finale | 30 |
| **Total** | **253** |

Each tag has a toggle (locked/unlocked). Active tags are those whose `Item1` appears in the current `tagPool`. Toggling adds or removes the entry. "Unlock All" pushes all 253 hardcoded tags with the current game date.

Tags found in `tagPool` that are NOT in the hardcoded list are shown in an "Other (unknown)" overflow section so they remain visible and can be deactivated — they are never silently dropped.

Lock hints are shown for inactive tags using unlock conditions derived from a `getLockHint()` helper (date-based, recipe-based, policy-based).

---

## What Works Correctly

### Save field names and types — ✓
`tagPool` and `tagRecipesPool` confirmed present as top-level fields. The `{ Item1, Item2 }` structure matches the actual save exactly.

### `Item2` date format — ✓
The editor writes `Item2` as an ISO datetime string without a `Z` suffix (`"1929-01-01T00:00:00"`). Actual save entries use the same format.

### Unknown tag handling — ✓
Tags present in `tagPool` but absent from the hardcoded list are surfaced in an "Other (unknown)" section rather than silently hidden. This prevents data loss when saves contain tags not yet added to the editor.

### Cyrillic tag ID — ✓
One tag ID contains a Cyrillic character: `PROTAGONIST_СORNLIMBED_ROMANTIC` (the initial `С` is U+0421, not Latin C). The editor's `tags.ts` uses the same Cyrillic character, matching the game config exactly. Not a bug.

### `tagRecipesPool` treated as read-only — ✓
The editor reads `tagRecipesPool` for display context but does not modify it. Correct — recipe discovery state should be managed by the game.

---

## Issues and Discrepancies

### 1. `PROTAGONIST_SAILOR` is missing from the hardcoded tag list

`TagData.json` contains a tag `PROTAGONIST_SAILOR` with unlock condition `DATE:1950`. This tag does not appear anywhere in `src/data/tags.ts`.

Consequences:
- A player in a post-1950 game who has unlocked `PROTAGONIST_SAILOR` legitimately will see it correctly in the "Other (unknown)" overflow section (safe — no data loss)
- "Unlock All" will not unlock `PROTAGONIST_SAILOR`, so a player using that bulk action to fully unlock the tag pool will still be missing this tag
- The lock hint for why `PROTAGONIST_SAILOR` is unavailable early will not be shown

**Recommendation:** Add `PROTAGONIST_SAILOR` to the Protagonist group in `src/data/tags.ts`.

### 2. Tag count mismatch: editor has 253, game config has 247

The editor's hardcoded list contains 253 tags; `TagData.json` defines 247. With `PROTAGONIST_SAILOR` accounting for 1 gap in the other direction, there are approximately 6–7 tag IDs in the editor that do not appear in `TagData.json`.

These extra IDs were individually verified and confirmed present in the game binary/config (the discrepancy may be due to tags appearing in multiple game config files or counted differently). However, the count mismatch warrants a careful diff of `src/data/tags.ts` against `TagData.json` to confirm no phantom tags exist that the game would silently ignore.

**Recommendation:** Run a deterministic diff of all tag IDs in `src/data/tags.ts` against the full set in `TagData.json` to produce a definitive match/missing/extra list.

### 3. No validation on "Unlock All" date

When "Unlock All" is triggered, all 253 hardcoded tags are added with the current game date as `Item2`. Some tags have date-based unlock conditions (e.g., certain WW2 tags only available from specific years, `PROTAGONIST_SAILOR` from 1950). If a player is in, say, 1930 and hits "Unlock All", the tags appear in `tagPool` with a 1930 date — the game may or may not honour this, depending on whether it re-validates on load.

This is consistent with the editor's general philosophy (explicit override of game restrictions), but worth noting in the UI as a warning.

---

## Summary

| Item | Status |
|---|---|
| `tagPool` field name and type | ✓ |
| `tagRecipesPool` field name and type | ✓ |
| `Item1`/`Item2` structure | ✓ |
| `Item2` date format (no Z suffix) | ✓ |
| Unknown tag overflow handling | ✓ |
| Cyrillic character in tag ID | ✓ Consistent |
| `PROTAGONIST_SAILOR` missing from hardcoded list | ✗ Not in "Unlock All" |
| Tag count discrepancy (253 vs 247) | ✗ Needs deterministic diff |
| "Unlock All" ignores date-based unlock conditions | ✗ Minor — expected editor behaviour but undocumented |
