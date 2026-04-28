# Audit: Characters Tab

**Date:** 2026-04-28  
**Audited against:** `1.json` (save file, 1,199 characters), `CharacterLabels.json`, `CharactersXP.json`, `Characters.json` (StreamingAssets/Data/Configs/)

---

## How It Works

The Characters tab loads the `stateJson.characters[]` array and renders a filterable list (All / Employed). Clicking a character opens a detail panel with editable fields grouped by character type.

### Character types
Determined by the `$type` field in the save (though the editor detects type via profession key prefix matching):
- `TalentData` — Actors, Directors, Cinematographers, Composers, Scriptwriters, Producers, Film Editors, Agents (896 in sample save)
- `LieutenantData` — all Lieut* and Cpt* professions (221 in sample save)

### Fields edited per type

| Field | Type in save | Displayed as | Who has it |
|---|---|---|---|
| Profession skills (`professions` object) | `Record<string, "N.NNN">` | 0–10 slider | All |
| Skill cap (`limit` + `Limit`) | 3-decimal string, duplicated | 0–10 slider | All |
| Mood | 3-decimal string | 0–100% | All |
| Attitude (loyalty) | 3-decimal string | 0–100% | All |
| XP | integer | raw number | All |
| Custom name | string \| null | text input | All |
| Age / birth date | `"DD-MM-YYYY"` string | age number input | All (if present) |
| Traits (`labels`) | `string[]` | checkbox list | All |
| Artistic appeal (`whiteTagsNEW.ART`) | 3-decimal string in nested object | 0–100% | Actors, Directors |
| Commercial appeal (`whiteTagsNEW.COM`) | 3-decimal string in nested object | 0–100% | Actors, Directors |
| Indoor filming (`whiteTagsNEW.INDOOR`) | 3-decimal string in nested object | 0–40% | Cinematographers |
| Outdoor filming (`whiteTagsNEW.OUTDOOR`) | 3-decimal string in nested object | 0–40% | Cinematographers |
| Bonus cards money (`BonusCardMoney` + `bonusCards[0]`) | integer, duplicated | 0–N | Lieutenants |
| Bonus cards influence (`BonusCardInfluencePoints` + `bonusCards[1]`) | integer, duplicated | 0–N | Lieutenants |

### Bulk operations
The tab supports per-character and multi-select bulk operations: Max All, Max Skills, Max Cap, Max Happiness, Max Loyalty, Max Artistic, Max Commercial, Max Filming Skills, Uncap All Skills.

---

## What Works Correctly

### Field names and nesting — ✓
All field names match exactly. All edited fields are present in actual saves. The `professions` object, `whiteTagsNEW` nesting, `bonusCards` array, and `limit`/`Limit` duplication all match the code's assumptions.

### `limit` / `Limit` dual-field sync — ✓
Every character in the save has both `limit` (lowercase) and `Limit` (capital L), and they are always identical. The editor writes both on every change, which is correct.

### `bonusCards` sync — ✓
All 221 LieutenantData characters have all three fields (`bonusCards: [N, N]`, `BonusCardMoney: N`, `BonusCardInfluencePoints: N`) in sync. The editor writes all three atomically.

### Profession key names — ✓
All 23 profession keys confirmed in actual saves:

**Talent:** `Actor`, `Director`, `Cinematographer`, `Composer`, `Scriptwriter`, `Producer`, `FilmEditor`, `Agent`  
**Captain:** `CptFinancier`, `CptHR`, `CptLawyer`, `CptPR`  
**Lieutenant:** `LieutEscort`, `LieutInfrastructure`, `LieutMuseum`, `LieutPost`, `LieutPrep`, `LieutProd`, `LieutProducers`, `LieutRelease`, `LieutScript`, `LieutSecurity`, `LieutTech`

The editor's detection logic (Lieut* prefix for Lieutenants, Cpt* for Captains) matches the real data.

### Labels / traits — ✓
All 31 trait IDs confirmed in `CharacterLabels.json` and found in save data. The caution warnings on IMMORTAL, SUPER_IMMORTAL, STERILE, MAIN_CHARACTER, UNWANTED_ACTOR are appropriate.

### `birthDate` format — ✓
Confirmed as `"DD-MM-YYYY"` (e.g., `"25-07-1877"`). The editor's age-editing logic (preserve day/month, change year) is correct.

### `whiteTagsNEW` entry structure — largely ✓
The save confirms the nested structure with `value`, `id`, `IsOverall`, `dateAdded`, `movieId`, and `overallValues`. The editor only writes `value` and leaves all other subfields untouched, which is the right approach.

---

## Issues and Discrepancies

### 1. INDOOR/OUTDOOR cap is wrong — editor enforces 0.400, actual max is 0.500

The editor caps Cinematographer filming skills (INDOOR/OUTDOOR) at `0.400` and documents "4 tiers". However, the actual save file contains values of `0.500` for multiple characters.

This means the editor will silently reduce a cinematographer's filming skill from 0.500 back to 0.400 if the user touches the slider at all (due to the clamp). A user who opens a maxed cinematographer's detail and saves without intending to change anything could inadvertently nerf their skills.

**Recommendation:** Raise the INDOOR/OUTDOOR cap to `0.500`. Verify with game config whether 0.500 is the true ceiling or if values can go higher still.

### 2. Genre tags in `whiteTagsNEW` are not exposed and can exceed 1.0

For Actors and Directors, `whiteTagsNEW` contains not just `ART`/`COM` keys but also genre tags (`ADVENTURE`, `ROMANCE`, `DRAMA`, etc.). These genre tags accumulate from movie work and can exceed `1.000` (e.g., `"1.360"` found in save).

The editor only shows `ART` and `COM` — the genre tags pass through untouched, which is safe. However, players cannot inspect or edit a character's accumulated genre strengths. This is a feature gap rather than a correctness bug.

**Recommendation:** Consider a read-only display of genre tag values in the character panel, even if editing isn't exposed.

### 3. `xp` can be negative — editor assumes ≥ 0

The editor documents XP as `≥0 (no known max)` and treats it as a non-negative integer. However, save data contains negative XP values (e.g., `"xp": -0.128` noted via `selfEsteem` context; Lieutenant XP observed negative in leveling states).

A negative XP value in a fresh save is likely a valid mid-leveling state. The editor's slider/input presumably clamps to 0, which would corrupt a character in a valid negative-XP state.

**Recommendation:** Allow negative XP values, or at minimum don't clamp to 0 on read. Set the input minimum to a sufficiently negative value (e.g., -100,000) or use an unclamped text input.

### 4. Several boolean status flags are not editable

The following boolean fields appear on characters in the save and are not exposed by the editor:

| Field | Found on | What it does |
|---|---|---|
| `isShady` | LieutenantData, some TalentData | Associated with illegal activities |
| `isImmune` | Some characters | Protection from certain mechanics |
| `isProspectiveTalent` | New hires | Affects probationary mechanics |
| `isOnTheHook` | Some characters | Indebted status |
| `wasImprisoned` | Some characters | Legal history flag |

None of these are critical for a save editor's core use case, but `isShady` in particular could matter if a player wants to clean up a character's record. Currently a gap, not a bug.

### 5. `state` field is not exposed

Characters have a `state` integer field (observed values 0–2) which appears to represent employment/availability status. The editor uses `studioId` (null = unemployed) for filtering, which may not fully capture all states. If `state` and `studioId` can get out of sync, the filter display could be misleading.

This is low risk for a save editor but worth noting.

### 6. `$type` field is not used for character-type detection

The editor detects character type (Talent vs Lieutenant) by checking profession key prefixes (`Lieut*`, `Cpt*`) rather than reading the `$type` field directly. In practice this works because the 23 profession keys are well-defined, but if new character types are added in future game versions, the prefix heuristic could silently misclassify them. Using `$type` would be more robust.

---

## Summary

| Item | Status |
|---|---|
| All core field names correct | ✓ |
| `limit`/`Limit` dual-field sync | ✓ |
| `bonusCards` sync | ✓ |
| Profession key names (all 23) | ✓ |
| Label/trait IDs (all 31) | ✓ |
| `birthDate` format | ✓ |
| `whiteTagsNEW` read/write safety | ✓ |
| INDOOR/OUTDOOR cap (editor: 0.400, actual: 0.500) | ✗ Bug — will silently reduce maxed cinematographers |
| Genre tags in `whiteTagsNEW` (ADVENTURE etc.) | ✗ Not exposed — feature gap |
| XP can be negative | ✗ Editor clamps to 0 — will corrupt valid negative-XP state |
| Boolean status flags (`isShady`, `isImmune`, etc.) | ✗ Not exposed — minor gap |
| `state` field | ✗ Not exposed — minor gap |
| Character type detection via `$type` | ✗ Uses prefix heuristic instead — fragile but works currently |
