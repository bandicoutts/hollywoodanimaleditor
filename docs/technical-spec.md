# Hollywood Animal Save Editor — Technical Specification

## Overview

A browser-based save file editor for the game **Hollywood Animal** (Weappy, Steam). Players upload their JSON save file, edit game state through a UI, and download the modified file. Everything runs client-side — no backend, no server, no file ever leaves the browser.

**Stack:** Next.js · React · Tailwind · Vercel

---

## Core constraint: lossless round-trip

Parse → modify only touched fields → re-serialise. Any field the editor does not explicitly handle must survive the round-trip exactly as-is. This is non-negotiable. Future game updates will add fields the editor doesn't know about — they must not be destroyed.

---

## Save file format

Files use **UTF-8 with BOM** (`utf-8-sig`). Handle the BOM on read; write it back on download. Serialise output as **compact JSON** (no indentation, no extra whitespace) — the game's parser is sensitive to file size and hangs indefinitely on pretty-printed output.

**Save slot structure:** each slot in the game's save directory consists of three files — a `.json` (game state), a `.png` (thumbnail), and a `.map` file. The editor produces only the JSON. Users must overwrite the JSON of an existing slot; creating a new slot from a JSON alone will fail to load because the companion files are absent.

Top-level structure:

```json
{
  "currentMeta": {
    "firstSaveVersion": "0.8.69EA",
    "lastSaveVersion": "0.8.69EA",
    "timestamp": "2026-04-26T15:51:41.75+01:00"
  },
  "stateJson": { },
  "isDemoEndSave": false,
  "isDemoTransition": false,
  "isEmptyData": false,
  "path": ""
}
```

All game data lives in `stateJson` as a plain object (not a nested JSON string). Read the save version from `currentMeta.lastSaveVersion` and display it in the UI header. Warn the user if the version is newer than `0.8.69EA` — the schema beyond that point is unverified.

---

## Type preservation

Some numeric values are stored as decimal strings (`"0.810"`), others as plain numbers (`100`). Read the original type and write back in the same form. When writing decimal strings, use 3 decimal places: `"0.810"`, `"1.000"`.

---

## Fields reference

### Resources

Top-level fields in `stateJson`:

| Field | Type | Notes |
|---|---|---|
| `budget` | number | Company money |
| `cash` | number | Cash on hand |
| `reputation` | string | Float as string e.g. `"300.000"` |
| `influence` | number | Influence points |

---

### Characters

`stateJson.characters` — array of character objects. Scale: ~300 in early game, ~1400 in late game.

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | number | Unique identifier |
| `studioId` | any \| null | `null` = uncontracted; non-null = employed |
| `professions` | object | e.g. `{ "Actor": "0.810" }` — skill as decimal string 0.000–1.000, displayed ×10 (0–10) |
| `limit` | string | Skill cap as decimal string 0.000–1.000, displayed ×10 |
| `Limit` | string | Duplicate of `limit` — **both must be updated together** |
| `mood` | string | Decimal string 0.000–1.000 — displayed as **Happiness** ×100 (0–100) |
| `attitude` | string | Decimal string 0.000–1.000 — displayed as **Loyalty** ×100 (0–100) |
| `selfEsteem` | string | Internal calculation value; ranges outside 0–1, not surfaced in game UI — pass through only, do not edit |
| `xp` | number | Experience points |
| `firstNameId` | string | Index into embedded name table (`src/data/characterNames.ts`, 1140 entries) — do not edit |
| `lastNameId` | string | Index into embedded name table — do not edit |
| `customName` | string \| null | Custom display name written directly to save — preferred over localStorage |
| `labels` | string[] | Trait labels e.g. `"IMMORTAL"`, `"STERILE"` — editable array |
| `birthDate` | string \| undefined | Character date of birth, format `"DD-MM-YYYY"` e.g. `"17-08-1897"`. Used to compute in-game age. Write back in the same format. |

Filter employed characters by `studioId !== null`.

**Known profession types:**
`Actor`, `Director`, `Producer`, `Scriptwriter`, `Cinematographer`, `Composer`, `FilmEditor`, `Agent`, `CptLawyer`, `CptHR`, `CptPR`, `CptFinancier`, `LieutProd`, `LieutPrep`, `LieutTech`, `LieutScript`, `LieutRelease`, `LieutPost`, `LieutSecurity`, `LieutEscort`, `LieutMuseum`, `LieutInfrastructure`, `LieutProducers`

**Display names for Management professions** (`src/data/professions.ts`):

| Key | Display label |
|---|---|
| `CptHR` | Human Resources Executive |
| `CptPR` | Public Relations Executive |
| `CptLawyer` | Legal Executive |
| `CptFinancier` | Financial Executive |
| `LieutProd` | Head of Production |
| `LieutPrep` | Head of Pre-Production |
| `LieutTech` | Head of Technology |
| `LieutScript` | Head of Screenwriting |
| `LieutRelease` | Head of Release |
| `LieutPost` | Head of Post-Production |
| `LieutSecurity` | Head of Security |
| `LieutEscort` | Head of Escort |
| `LieutMuseum` | Head of Museum |
| `LieutInfrastructure` | Head of Infrastructure |
| `LieutProducers` | Head of Producers |

The profession filter dropdown groups all `Lieut*` and `Cpt*` keys into a single **"Management"** option (sentinel value `"management"`). Individual labels still appear on character cards and in the detail panel.

**Lieutenant upgrade bonuses** — Lieutenant (`Lieut*`) characters only have two bonus fields that are not present on other profession types:

| Field | Type | Notes |
|---|---|---|
| `BonusCardMoney` | number | Integer card count; displayed as `value × 10`% money bonus |
| `BonusCardInfluencePoints` | number | Integer card count; displayed as `value × 10`% influence bonus |
| `bonusCards` | number[] | Always `[BonusCardMoney, BonusCardInfluencePoints]` — **must be kept in sync** when either scalar is updated |

Observed range: 0–4+ cards. Each card = 10% bonus. A value of 4 displays as 40%.

**Known label values (31 observed):**
`ALCOHOLIC`, `ARROGANT`, `CALM`, `CHASTE`, `CHEERY`, `DEMANDING`, `DISCIPLINED`, `HARDWORKING`, `HEARTBREAKER`, `HOTHEADED`, `IMMORTAL`, `INDIFFERENT`, `JUNKIE`, `LAZY`, `LEADER`, `LUDOMANIAC`, `MAIN_CHARACTER`, `MELANCHOLIC`, `MISOGYNIST`, `MODEST`, `OPEN_MINDED`, `PERFECTIONIST`, `RACIST`, `SIMPLE`, `STERILE`, `SUPER_IMMORTAL`, `TEAM_PLAYER`, `UNDISCIPLINED`, `UNTOUCHABLE`, `UNWANTED_ACTOR`, `XENOPHOBE`

**Artistic and commercial appeal** are stored as special entries in `whiteTagsNEW` under the abbreviated keys `"ART"` (artistic) and `"COM"` (commercial). Only Actors and Directors are eligible for appeal. The `value` field is a decimal string 0.000–1.000. Edit only `value`; `overallValues` is a history log written by the game and must not be edited.

If a character has never earned appeal in-game the key will be absent from `whiteTagsNEW`. When the editor writes a value for the first time, create the full entry structure:

```json
{
  "overallValues": [],
  "id": "COM",
  "dateAdded": "0001-01-01T00:00:00",
  "movieId": 0,
  "value": "0.000",
  "IsOverall": false
}
```

`overallValues` starts empty; the game appends to it on subsequent movie releases. `dateAdded` uses the default date sentinel `"0001-01-01T00:00:00"`.

**Appeal tiers** (confirmed via in-game testing; thresholds are identical for ART and COM):

| Value | ART tier | COM tier |
|---|---|---|
| < 0.250 | — | — |
| 0.250 – 0.499 | Promising Talent | Rising Star |
| 0.500 – 0.749 | Commanding Presence | Star |
| 0.750 – 0.999 | True Artist | Superstar |
| exactly 1.000 | Icon | Legend |

The top tier (Icon / Legend) requires exactly 1.000 — a value of 0.999 shows the tier below.

Character display names are resolved by indexing `firstNameId` and `lastNameId` directly into the embedded `CHARACTER_NAMES` array (e.g. ID `258` → `"Mae"`, ID `654` → `"Lowe"` → displayed as `"Mae Lowe"`). `customName` takes priority when set and is written directly to the save. Do not edit `firstNameId` or `lastNameId`.

---

### Technologies

`stateJson.technologies` — array.

```json
{
  "id": 1,
  "configId": "DUPLER",
  "type": 0,
  "format": "35-mm",
  "owned": true,
  "created": false,
  "releaseYear": 1927,
  "isOutDated": false
}
```

| Field | Value | Meaning |
|---|---|---|
| `type` | `0` | Camera |
| `type` | `1` | Sound |
| `owned` | boolean | Toggle to unlock/remove |

Entries with an empty `configId` are player-created technologies. Display as read-only — do not allow editing or deletion.

---

### Opened Perks

`stateJson.openedPerks` — array of string IDs. Add an ID to unlock, remove to lock.

The list below covers 216 known perk IDs from a late-game save. Treat as a reference set for the UI — not a hardcoded enum. Perks in the player's save that aren't on this list must still display.

**All 216 known perk IDs:**

```
BLDG_ESCORT_DOMINION, LEGAL_DEFENSE_1, BANK_LOAN, GENERATION_IP_AND_REP, IMPROVEMENT_I,
BLDG_FREELANCE, BLDG_DISTRIBUTION, BLDG_LAB, IMPROVEMENT_0_NO_SADNESS, BANK_LOAN_EARLY_REPAYMENT,
SCRIPT_DOCTORS, MOVIE_THEATRE_SLOT_ADD_1, HIRING_BONUSES, CONTRACT_PAYMENTS_50_50,
GENERATION_REP_X2, BLDG_POWERPLANT_I, LAB_INHOUSE_IMPROVED, SCRIPT_DOCTORS_FASTER,
MOVIE_THEATRE_SLOT_RENT, MOVIE_RELEASE_MOOD_BOOST, LEGAL_DEFENSE_2, SCRIPT_DOCTORS_RANGE,
BLDG_ANALYTICS, GENERATION_IP_X2, BLDG_WATER_TOWER_I, NOMINATION_LOSS_NO_SADNESS,
SCRIPT_DOCTORS_SCORES, POSTRELEASE_ANALYSIS, CHARITY_TO_REP, REPAIR_TEAM_1,
SCRIPT_DOCTORS_CHEAPER, LAB_INHOUSE_TIME_1, LEGAL_DEFENSE_3, BAD_ATTITUDE_NO_SADNESS,
ANALYSIS_GROUPS, PROFITABLE_MOVIE_REP_2, BLDG_CONSTRUCTOR, CONTRACT_5_YEARS, ETHNIC_COMPOSITION,
MOVIEGOERS_NUMBER_WIDE, TAGS_RESEARCH, TOP1_TOP3, BUILDINGS_CONSERVATION, NEW_TAG_BY_LT_1,
CONTRACT_10_YEARS, MOVIEGOERS_NUMBER_NARROW, GOOD_ATTITUDE_REP_1, CONSERVATION_COOLDOWN,
NEW_TAG_BY_LT_2, ANALYSIS_ENTIRE_CAST, SALARY_CUT, TAGS_SLOTS_6, ANALYSIS_BUDGET,
INITIATIVE_PP_FREE, TAGS_SLOTS_7, ANALYSIS_TAGS, TAGS_SLOTS_8, ANALYSIS_SCREENPLAY,
LEGEND_REP_1, TAGS_SLOTS_9, BLDG_PRINT, SKILLED_ACTOR_REP, PRINT_INHOUSE_QLT_1, TAGS_SLOTS_10,
ICON_REP_1, PRINT_INHOUSE_QLT_2, TAGS_RESEARCH_TIME_RED_1, PRINT_EMERGENCY,
TAGS_RESEARCH_TIME_RED_2, GOOD_ATTITUDE_REP_2, BLDG_MARKETING, TAGS_RESEARCH_TIME_RED_3,
SCANDAL_COVER_UP_MONEY, TECH_SALE_PP, TAGS_NEW_PP_BONUS, SCANDAL_COVER_UP_PP, TAGS_XP_BONUS_1,
TAGS_XP_BONUS_2, WM_HOSPICE, CONTRACT_TERMINATION_FEE_1, WM_ORPHANAGE, TAGS_XP_BONUS_3,
WM_WEDDING, TAGS_RESEARCH_DIRECTION, WM_HOMELESS, CONTRACT_TERMINATION_FEE_2, WM_DEBT,
MOVIE_SEQUEL, CONTRACT_5_MOVIES, MOVIE_SEQUEL_ORIGINALITY, CONTRACT_10_MOVIES,
MOVIE_SEQUEL_LEGACY, MOVIE_RELEASE_XP_1, MOVIE_RELEASE_XP_2, MOVIE_RELEASE_TOP10_AUD_XP_1,
MOVIE_RELEASE_TOP10_ART_XP_1, MOVIE_RELEASE_XP_3, MOVIE_RELEASE_TOP10_COM_XP_1, EDITS_ON_GO,
SCEN_IDEAS_STORAGE_1, SCEN_IDEAS_GEN_AMT_1, SCEN_IDEAS_GEN_AMT_2, SCREENPLAY_TIME_RED_1,
NEW_SCREENPLAY_XP_BONUS_1, NEW_SCREENPLAY_XP_BONUS_2, SCREENPLAY_TIME_RED_2,
NEW_SCREENPLAY_XP_BONUS_3, SCREENPLAY_TIME_RED_3, NEW_SCREENPLAY_PP_BONUS_1,
NEW_SCREENPLAY_PP_BONUS_2, INSURANCE_PLUS, BLDG_SHENANIGANS, BLDG_PAVILION_II, BLDG_CONCERT,
BLDG_WORKSHOP, BLDG_EVENTS_STAGE, SHENANIGANS_BEATING, BLDG_SCOUT, CONCERT_INHOUSE_MPROVED,
OFFICIAL_RECEPTION_1, BLDG_CASTING, BLDG_PAVILION_III, LEAK_RISK_REDUCE_1, WG_WATCHES,
BLDG_SUPPLY, BLDG_SPIES, WG_ALCOHOL, EXTRAS_2, ACTIVE_PROTECTION, EXTRAS_3,
CONCERT_INHOUSE_TIME_1, WG_HAUTE_WARDROBE, ACTIVE_PROTECTION_XP_BONUS_1, EXTRAS_4,
POST_DIR_MONT_COMP_XP_1, PREPROD_PROD_DIR_CIN_XP_1, BLDG_PAVILION_IV, WG_SPORTCAR,
ACTIVE_PROTECTION_XP_BONUS_2, PREPROD_PROD_DIR_CIN_XP_2, BLDG_SOUND, PROD_DIR_CIN_ACT_XP_1,
TWO_PROJECTS, WG_CIGARS, LOCATION_SEARCH_TIME_1, SOUND_INHOUSE_IMPROVED,
SECRETS_HIDE_EFFECT_BOOST, BLDG_LINE_PRODUCTION, OFFICIAL_RECEPTION_2, LOCATION_SEARCH_TIME_2,
SOUND_INHOUSE_TIME_1, SECOND_UNIT, OFFICIAL_RECEPTION_3, URGENT_EXTRAS_SEARCH, PARTY_1,
CONTRACT_WEIGHT, FAIL_DISCLOSURE_NO_LEAK, LOCATION_SEARCH_WORLD, URGENT_DOUBLE_SEARCH, PARTY_2,
SECURITY_SCHOOL, LOCATION_QLT_1, URGENT_CREW_SEARCH, PARTY_3, PRODUCERS_ON_FILM_2,
URGENT_LOCATION_SEARCH, HOUSEMAID, SECURITY_SCHOOL_FAST, LOCATION_QLT_2, FLEX_SCHEDULE, NANNY,
PROPS_QLT_2, BLDG_LOGISTICS, SECURITY_SCHOOL_STRONG, PROPS_QLT_3, PRODUCERS_ON_FILM_3,
ASSISTANT, TEAM_SERVICE_1, SPYING_ILLEGALPREFERENCES, SETS_TIME_RED_1, SPYING_SINS,
NEGOTIATION_SCALE_50, CHEF, SETS_TIME_RED_2, TEAM_SERVICE_2, SPYING_XP_BONUS_1, BUTLER,
SETS_TIME_RED_3, NEGOTIATION_SCALE_75, SPYING_XP_BONUS_2, SPOUSES_ASSISTANT, SETS_QLT_2,
HOTEL_SUITE, SETS_QLT_3, FAIL_NO_DISCLOSURE, VILLA, SHENANIGANS_MURDER, PENTHOUSE,
SHENANIGANS_KIDNAPPING, PERSONAL_DRIVER, PERSONAL_DRIVER_PREMIUM, BG_UNLOCK, BG_NARCOTICS,
BG_METH, BG_NARCOTICS_2, BG_XXX, BG_BRAINS, BG_SAFARI, BG_KILLING, BG_CANNIBAL, BG_UNDERAGE,
STUDIO_TECH, STUDIO_TECH_ADD_RND, STUDIO_TECH_RED_TIME_1, STUDIO_TECH_RED_TIME_2, BLDG_RND_I
```

---

### Tag Pool

`stateJson.tagPool` — array of objects:

```json
{ "Item1": "DRAMA", "Item2": "1929-01-01T00:00:00" }
```

`Item1` is the tag ID. `Item2` is the availability date — use the current in-game date when adding new tags. The in-game date is not directly readable from the save, so `"1929-01-01T00:00:00"` is used as a safe fallback (the game accepts any valid date string here). Apply the same rules as perks: reference set only, not a hardcoded enum.

The authoritative tag list (253 known IDs across 8 categories) is maintained in `src/data/tags.ts` as `TAG_GROUPS`. See that file for the full set. Summary by category:

| Category | Count | Notes |
|---|---|---|
| Genre | 12 | Includes `MUSICAL`, `SLAPSTICK_COMEDY` (unlock after 1950) |
| Setting | 29 | Includes WW2 theatres, ancient/Asian settings, European settings, slavery-era settings |
| Protagonist | 42 | Includes 5 recipe protagonists (discovered by combining elements in-game) |
| Supporting Character | 23 | |
| Antagonist | 34 | Includes 6 recipe antagonists |
| Theme | 43 | |
| Events | 40 | Note: `EVENT_CURSED_DEAL` (singular) is an inconsistency in the game's own naming |
| Finale | 30 | `FINALE_PROTAGONIST_GETS_PUNISHED_FOR_A_CRIME` is currently unobtainable in-game (date set to year 3000) but included for completeness |

**Display names** for IDs where auto-formatting would be wrong (e.g. `EVENTS_CHEATING_SPOUSE` → "Adultery", `FINALE_HAPPY_ENDING` → "And Everyone Lived Happily...") are maintained in `TAG_LABELS: Record<string, string>` in `src/data/tags.ts`. The `formatTagLabel()` helper in `WritingTagsModule.tsx` checks this map first and falls back to prefix-stripping + title-case for any ID not explicitly mapped.

---

### Active Research Processes

When research is in progress these objects are populated. All are `{}` when idle.

| Field | What it tracks |
|---|---|
| `tagResearchProcessesData` | Tag research |
| `techProcessesData` | Technology research |
| `trashTagResearchProcessesData` | Trash tag research |
| `trashRecipeResearchProcessesData` | Recipe research |
| `partyProcessesData` | Party processes |

"Complete instantly" feature: zero out remaining-time fields when any of these are non-empty.

`overallPerkResearchSpeedup` (float string, e.g. `"0.000"`) — increasing this speeds up all future research globally.

---

### Buildings

`stateJson.buildings` — array.

```json
{
  "configId": "MAIN_BUILDING",
  "id": 0,
  "state": 2,
  "constructionDuration": 0,
  "constructionQuality": "1.000",
  "developerId": null
}
```

| `state` | Meaning |
|---|---|
| `2` | Built |
| `1` | Under construction |

To complete instantly: set `constructionDuration` to `0` and `constructionQuality` to `"1.000"`.

---

### Milestones

`stateJson.milestones` — object keyed by milestone ID.

```json
{
  "POLICY_ENABLE_MILE_7": {
    "id": "POLICY_ENABLE_MILE_7",
    "group": "POLICY_ENABLE",
    "finished": false,
    "locked": false,
    "progress": "0.000",
    "chains": []
  }
}
```

Set `finished: true`, `locked: false`, and `progress: "1.000"` to fully unlock.

**Known milestone groups (from a 1938 save):**

| Prefix | Group | Count |
|--------|-------|-------|
| `POLICY_ENABLE_MILE_7` | Policy system unlock | 1 |
| `POLICY_TRASH_0–3` | Trash King policy milestones | 4 |
| `POLICY_MAJOR_0–3` | Behemoth policy milestones | 4 |
| `POLICY_BOUTIQUE_0–3` | Boutique policy milestones | 4 |
| `POLICY_CONVEYOR_0–3` | Factory policy milestones | 4 |
| `POLICY_AVERAGE_0` | All-Rounder (stay open) | 1 |
| `HESPRO_QUEST_1–2` | HesPro 35 Extra camera quest | 2 |
| `BLUE_TERM_IRIS_QUEST_1–2` | Blue Term Iris Deluxe quest | 2 |
| `DUPLER_COMPACT_QUEST_1–2` | Dupler Compact S quest | 2 |
| `FRAMETONE_QUEST_1–2` | Frametone Pure audio quest | 2 |

Tech quest milestones use parallel conditions (_1 and _2 must both complete, order doesn't matter). Policy milestones are sequential (_0 unlocks _1, etc.).

The `group` field in the save data is mostly empty (except `POLICY_ENABLE_MILE_7` which has `"POLICY_ENABLE"`). Grouping in the UI is derived from ID prefix matching in `MilestonesModule.tsx`.

**`MILESTONE_META`** in `MilestonesModule.tsx` maps every known milestone ID to a human-readable `label` and optional `description`. Covers all 18 quest types documented in game configs (only quests present in the save are rendered). Falls back to a title-cased ID if a milestone ID is unknown.

---

### Functionalities

`stateJson.functionalities` — object of 33 boolean feature flags. All `true` in a normal game. Progressive unlocking in tutorial mode. Two flags (`PoliceRaidDefense`, `PoliceDefence`) are `false` even in a 1938 save — believed to unlock via a story event.

Full key list: `MapNavigation`, `QualitySelection`, `Lieutenants`, `Captains`, `Secrets`, `Policy`, `PerksEnabled`, `Upgrades`, `ProductionEvents`, `CharacterEvents`, `Scandals`, `StaffRaises`, `StaffRequests`, `AttackByCompetitors`, `Fire`, `PoliceRaidDefense`, `PoliceDefence`, `Building`, `FreezeBuilding`, `Staff`, `HRSelection`, `Cash`, `Influence`, `BirdView`, `InfoButton`, `TimeFlow`, `FullTimeControls`, `ShowTopBarElements`, `ShowBottomBarProgress`, `ShowBottomBarButtons`, `ShowBottomConstructorButton`, `ShowBottomStartProjectButton`, `UnblockUI`.

**`FUNC_META`** in `MilestonesModule.tsx` maps each key to a human-readable label and one of three categories: **UI**, **Management**, **Events & Competition**.

---

### Competitor Studios

`stateJson.competitorStudios` — object keyed by studio ID.

```json
{
  "isUnderRaid": false,
  "lastBudget": 24740430,
  "aggression": "0.000",
  "isDead": false
}
```

Require confirmation before setting `isDead: true` — it permanently removes the competitor and may affect event chains.

**Display metadata** for the five known studios is maintained in `src/data/competitors.ts` as `COMPETITOR_META: Record<string, CompetitorMeta>`. This is UI-only data derived from `CompetitorStudios.json` / `CompetitorStrategies.json` game config files — it is not written to the save. Each entry carries: `name` (full studio name), `tier`, `attackTier` (`"Nuclear" | "Very Aggressive" | "None"`), `qualityRange`, `releases`, and `defenceless` (boolean). The five known IDs are `GB` (Gerstein Brothers), `EM` (Evergreen Movies), `SU` (Supreme), `HE` (Hephaestus), `MA` (Marginese). Unknown studio IDs fall back to "Studio {id}" gracefully.

---

### Other notable fields

| Field | Notes |
|---|---|
| `studioName` | Studio name string |
| `nextCharacterId` | Increment if creating new character objects |
| `nextBuildingId` | Increment if creating new building objects |
| `nextTechId` | Increment if creating new technology objects |
| `tagRecipesPool` | Array of custom tag recipe ID strings |

---

## Modules

### 1. Upload / Download
- Drag and drop or click to upload a `.json` save file
- Parse with BOM handling
- Display studio name and save version in the header; warn if version is newer than `0.8.69EA`
- Download button re-serialises as compact JSON (no indentation) with BOM and triggers file download, preserving all unmodified fields
- UI note beneath the download button reminds users to overwrite an existing save slot, not create a new one

### 2. Resources
Edit `budget`, `cash`, `reputation`, `influence` via sliders with live numeric display and preset buttons (25 / 50 / 75 / 100%). Preserve original types on write.

### 3. Character Editor
- List all characters, filterable by employed/all, profession type, name/ID search
- Each row: character name, profession badge, top skill value
- Click to open detail panel:
  - Header shows: name (click to set custom name), profession badge, ID, **Age** (click to edit), Happiness
  - Edit profession skill(s), `limit`/`Limit` (always update both), `mood` (Happiness), `attitude` (Loyalty), `xp`
  - `selfEsteem` passes through untouched — not surfaced in UI
  - Appeal section (Actors and Directors only): ART and COM sliders (0.000–1.000), with tier preset buttons (Promising Talent / Commanding Presence / True Artist / Icon for ART; Rising Star / Star / Superstar / Legend for COM). Active tier highlighted. Setting a value for the first time creates the `whiteTagsNEW` entry.
- Bulk actions: Max All Stats (including appeal for eligible characters), Remove All Caps
- Write decimal values back as 3-decimal strings: `"1.000"`

**Age editing:** `birthDate` is stored as `"DD-MM-YYYY"` on every character. Current in-game age is computed as `floor((gameDate − birthDate) / 365.25)` where `gameDate = parseGameDate(stateJson)`. Editing age writes a new `birthDate` with the same day and month but a new year: `year = gameDate.year − newAge`. Characters missing `birthDate` show no age field. The `parseGameDate` function is exported from `src/lib/script-suggestions.ts` and is also used by the Writing Tags module for lock hints.

### 4. Writing Tags
- Show `tagPool` grouped by category (Genre, Setting, Protagonist, Supporting Character, Antagonist, Theme, Events, Finale)
- Active tags toggleable — removing deletes from array, adding injects `{ "Item1": id, "Item2": currentGameDate }`
- Show known tags not yet in pool as available to add (greyed out pills)
- Unlock All per category; global Unlock All in header
- Display names resolved via `TAG_LABELS` in `src/data/tags.ts` first; falls back to prefix-stripping + title-case (strips `PROTAGONIST_`, `ANTAGONIST_`, `THEME_`, `EVENTS_`/`EVENT_`, `FINALE_`, `SUPPORTINGCHARACTER_` prefixes before formatting)
- Unknown tags (not in the reference list) are grouped by prefix: `EVENTS_`/`EVENT_` → Events, `THEME_` → Theme, `PROTAGONIST_` → Protagonist, etc. Only tags with no matching prefix go to "Other (unknown)"
- Deactivating an unknown tag keeps it visible (inactive) so it can be re-toggled — it is not removed from the UI
- **Lock hints**: inactive tags that haven't been researched yet show a small hint (`from 1950`, `from Sep 1935`, `recipe`, etc.) derived from `getLockHint()` in `script-suggestions.ts`. Active tags (already in `tagPool`) never show a hint regardless of their unlock condition.
- **Recipe elements with `availalbeFromStartTag: true`**: three elements — Toxic Revenger (`PROTAGONIST_TOXIC_VIGILANTE`), Killer Toaster (`ANTAGONIST_TOASTER_KILLER`), and Wizard War (`THEME_WAR_WITH_SORCERERS`) — have `availalbeFromStartTag: true` in `TagData.json`, meaning they can appear in `tagPool` as normal researched tags (the recipe is just an alternate discovery path). Their unlock condition in `scriptElements.ts` is `">=1929"`, not `Recipe`. Do not change these to Recipe conditions.

### 5. Research (Perks)
- Checklist grouped by functional category
- Opened perks shown as checked; unchecking removes; checking adds
- Unlock All button
- Unknown perks still displayed

**Perk display names** are maintained in `src/data/perks.ts` as `PERK_LABELS: Record<string, string>`. The `formatPerkLabel(id)` helper in `ResearchModule.tsx` checks this map first and falls back to auto-formatting (snake_case → Title Case) for any ID not explicitly mapped. Always add new confirmed names to `PERK_LABELS` rather than relying on auto-format.

**PERK_GROUPS** groups visible research nodes into 20 functional categories matching the game's in-game section/building names (e.g. "Legal Department", "Pre-Production", "Theater Management", "Story Workshop"). Group names and membership are maintained in `src/data/perks.ts`.

**Hidden perks (`HIDDEN_PERK_IDS`):** 49 perk IDs have `behaviour=4` in the game's `Perks.json` — these are passive/auto-triggered effects that are not visible nodes in the research tree UI. They appear in `openedPerks` in save files (e.g. `BANK_LOAN_REFINANCING`, `TAX_BASE_REDUCTION_1`). They are included in `ALL_KNOWN_PERKS` so "Unlock All" covers them, but are excluded from `PERK_GROUPS` so they don't appear as interactive cards in the Research module. They are also filtered from the "Other (unknown)" fallback group. The full set is `HIDDEN_PERK_IDS` in `src/data/perks.ts`.

Sources used to build `PERK_LABELS`:
- Game localisation strings — extracted directly from the installed game; authoritative source for all ~230 labelled entries (added 2026-04-27)
- `Buildings.json` — maps building IDs to `needPerkId` (used for all `BLDG_` perk names, now superseded by localisation strings)
- `Presents.json` — maps present types to their unlock perk (used for `WG_` and `BG_` names, now superseded)
- `Party.json` — confirms `PARTY_1/2/3` and `OFFICIAL_RECEPTION_1/2/3` IDs

**Localization note:** The game's human-readable display strings live in Unity asset bundles, not in the JSON config files. The config files at `StreamingAssets/Data/Configs/` contain only internal IDs and numeric data. For any perk added by a future game update and not yet in `PERK_LABELS`, derive a provisional label from the ID pattern (e.g. `_QLT_` → "Quality", `_TIME_RED_` → "Time Reduction", `_XP_` → "XP Bonus") until the localisation string can be confirmed.

### 6. Research Speedup / Complete Instantly
- Slider for `overallPerkResearchSpeedup`
- "Complete All Active Research" when any process data objects are non-empty
- "Complete All Construction" for buildings with `state: 1`

### 7. Technologies
- Two columns: Camera (type 0) and Sound (type 1), each with an "Own all" button and owned count
- Within each column, technologies are grouped by manufacturer:
  - Camera: Dupler · Hespro · Blue Term · Flumen
  - Sound: Sonatone · Frametone · FilmSound
- Each card shows: display name, format, release year (omitted if 0), and badges for Quest / Color / Outdated
- Quality, Practicality, and Economy base stats shown as dot rows (9 dots) with numeric value
- All display names and QPE stats come from a static `TECH_INFO` lookup in `TechnologiesModule.tsx`, keyed on `configId`. Source data: `VideoTech.json` and `AudioTech.json` from the game config archive.
- 30 technologies total: 19 image cameras (4 manufacturers), 11 audio systems (3 manufacturers)
- Toggle `owned` on any technology with a known `configId`
- Entries with empty `configId` (player-created custom technologies) are displayed read-only in a "Custom" section at the bottom of each column — not toggleable

### 8. Competitor Studios
- Each studio card shows full name + two-letter ID badge, sourced from `COMPETITOR_META` in `src/data/competitors.ts`
- Read-only context row per card: tier (gold) · attack capability color-coded (Nuclear = danger, Very Aggressive = warning, None = muted) · quality range · releases/yr · "Defenceless" badge for MA
- Editable fields: `lastBudget` (click-to-edit), `aggression` (0–1 slider), `isUnderRaid` (toggle)
- Eliminate sets `isDead: true`; confirmation dialog uses the real studio name. Restore reverts it.
- Unknown studio IDs (not in `COMPETITOR_META`) display as "Studio {id}" — no data loss

### 9. Milestones & Game Flags
- Milestones grouped under **Studio Policies** and **Technology Quests** super-section headers
- Within each super-section, sub-groups per policy/quest (e.g. Trash King, Behemoth, HesPro 35 Extra) — only groups present in the save file are rendered
- Each milestone row shows a human-readable label and a description subtitle (goal or unlock bonus), both sourced from `MILESTONE_META` in the module; hover `title` attribute exposes full text when truncated
- Every row retains Locked and Finished toggles; finishing sets `progress: "1.000"` and clears `locked`
- `functionalities` flags grouped into UI / Management / Events & Competition, with human-readable labels from `FUNC_META`
- Bulk: Unlock All Milestones, Enable All Features

### 10. Script Workshop

Generates scored script combination ideas based on the player's unlocked elements. Fully client-side — no API key, no external calls.

**Unlock filtering** (`src/lib/script-suggestions.ts`):

`getUnlockedPool` uses **`tagPool` membership** as the sole source of truth — an element is included only if its ID is already in `stateJson.tagPool` (or `stateJson.tagRecipesPool` for recipe-only elements). Date conditions in `scriptElements.ts` determine when an element *becomes researchable* in-game; a player must still explicitly research it before it appears in their pool. Using date conditions alone would surface elements the player hasn't unlocked yet.

- `tagPool` — `TagPoolEntry[]` where `Item1` is the tag ID. If an ID is present here, the element is available in the Workshop.
- `tagRecipesPool` — `string[]` of element IDs discovered via in-game recipe combinations. Checked as a fallback for recipe-only elements not yet in `tagPool`.

Note: `parseGameDate` and `isUnlocked` are still exported from `script-suggestions.ts` and used by the **Writing Tags** module to compute lock hints — they are not used by the Workshop for pool filtering.

**Element data** (`src/data/scriptElements.ts`):

All 8 element categories encoded as typed arrays with art/com modifiers and raw unlock condition strings:

| Category | Count |
|---|---|
| Genres | 12 |
| Settings | 29 |
| Protagonists | 43 |
| Supporting Characters | 23 |
| Antagonists | 35 |
| Themes | 43 |
| Events | 40 |
| Finales | 29 |

Also exports:
- `GENRE_PAIR_MODIFIERS` — art/com bonuses when combining two genres (symmetric lookup keyed `"LabelA|LabelB"`). Values sourced directly from `GenrePairs.json`.
- `COMPAT_SCORES` — `Map<string, number>` of element-pair compatibility scores, keyed as sorted `"ID_A|ID_B"` strings. Score-5 pairs (perfect) → 1.0; score-4 pairs (strong) → 0.5. 5,662 total entries sourced from `TagCompatibilityData.json`. Uses tag IDs (not display labels).
- `POLLUX_GENRE_FACTORS` — `Record<string, number>` of genre weights for Pollux award scoring, sourced from `GameVariables.json`. Drama 1.0 → Horror 0.3.

**Scoring formulas** (`src/lib/script-suggestions.ts`):

```
art     = sum of all element art values + genre pair art modifier
com     = sum of all element com values + genre pair com modifier
synergy = weighted sum of COMPAT_SCORES for all element pairs
            (score-5 pairs add 1.0; score-4 pairs add 0.5)
pollux  = genre_factor × (art × 2 + com)
            art weighted 2× because pollux_art_status_bonus max 4 vs pollux_com_status_bonus max 2
```

**Bias sort key**:
- Art: `art × 2 + synergy × 0.1`
- Commercial: `com × 2 + synergy × 0.1`
- Balanced: `art + com + synergy × 0.1`
- Pollux: `pollux + synergy × 0.1`

Named constants in `script-suggestions.ts`: `CANDIDATE_COUNT = 300`, `DUAL_GENRE_PROBABILITY = 0.35`, `SECONDARY_GENRE_WEIGHT = 0.5`, `SYNERGY_MULTIPLIER = 0.1`. The shared synergy pair-loop is extracted as `computeSynergy(elements)` — used by both `scoreCombination` and `scorePartialBuild`.

**Suggestion algorithm**: 300 random candidate combinations are scored and the top 6 (deduplicated by genre+setting+protagonist) are returned. Sort order controlled by bias setting.

**Script composition constraints** (from `GameVariables.json`):

The game uses a shared **content tag budget** stored in `contentIds` (confirmed from `PreconfiguredMoviesConfigs.json`):
- `content_tags_in_script_range = 3_5` — minimum 3 content tags per script (base range)
- `max_content_tags_amount = 5` — base maximum (no perks)
- `TAGS_SLOTS_6` through `TAGS_SLOTS_10` in `stateJson.openedPerks` each extend the budget by 1 (up to 10). `getContentTagBudget(openedPerks)` in `script-suggestions.ts` resolves the active budget.
- **Protagonist**: mandatory, consumes **1 fixed content tag slot**
- **Finale**: mandatory, consumes **1 fixed content tag slot**
- **Supporting characters** (0 to N): optional, each consumes 1 slot (`max_content_tags_supporting_character_amount = 5` in `GameVariables.json`)
- **Antagonist** (0 or 1): optional, consumes 1 slot
- **Themes/Events**: fill remaining slots — max = `contentTagBudget − charSlotsUsed − FIXED_CONTENT_TAGS`, min 1 (enforced by the budget formula, ≥3 total enforced by `MIN_CONTENT_TAGS`)
- **Genre, Setting**: stored in separate fields, **not counted against the budget**

`FIXED_CONTENT_TAGS = 2` is a constant in both `ScriptBuilder.tsx` and `script-suggestions.ts`. The correct budget formula is: `protagonist(1) + supporting(0–N) + antagonist(0–1) + themesEvents(N) + finale(1) ≤ contentTagBudget`.

`ScriptCombo.supporting` is `ScriptElement[]` (always an array, possibly empty). `ScriptCombo.antagonist` is `ScriptElement | undefined`. `UnlockedPool` includes `contentTagBudget: number`.

**UI — two modes** (toggled by tab at the top of the module):

**Generate Ideas mode:**
- Genre filter pills (only unlocked genres shown)
- Bias toggle: Art / Balanced / Commercial / Pollux
- Themes/Events per film stepper (min 3, max = `pool.contentTagBudget − 2` — reserves 2 fixed slots for protagonist + finale). The generator clamps the actual theme count to `contentTagBudget − charCount − FIXED_CONTENT_TAGS` so generated combos never exceed the budget regardless of the stepper value.
- Pool stats bar (element counts by category)
- 6 result cards: genre(s), setting, cast (protagonist + any optional chars), themes/events, finale, Art / Com / Compat / Pol score badges

**Build Your Script mode:**
- 7 collapsible accordion sections (Genre → Setting → Protagonist → Supporting Characters (optional) → Antagonist (optional) → Themes/Events → Finale), one open at a time
- Selecting any element closes its section, auto-opens the next incomplete section, and **instantly re-ranks every other category list** by compatibility with the current selection set
- Compatibility ranking: each candidate scored via `scoreElementCompatibility(candidate, ctx)` where `ctx` = `selectedElements` with the **current category's selection excluded**. This gives honest "swap to this" scores when re-opening a filled section. Themes/Events and Supporting Characters are multi-select so no exclusion applies there.
- **Running score bar** (Art / Com / Compat badges) appears once ≥2 elements are selected, computed by `scorePartialBuild(selectedElements)`. Pollux requires a complete combo and is omitted from partial display.
- **Themes/Events** is multi-select (budget-aware): selected themes pin to the top with a remove button; picking a supporting char or antagonist reduces the live theme max. Label shows `N / maxThemes`. `isComplete` requires `contentTagsUsed ≥ 3` (not specific chars).
- **Supporting Characters** is multi-select (same UX pattern as Themes/Events): selected chars pin to top with remove buttons; adding a char reduces available theme slots. Section label shows selected names.
- **Budget enforcement** (`FIXED_CONTENT_TAGS = 2` for protagonist + finale, always deducted):
  - `contentTagsUsed = themes.length + charCount + FIXED_CONTENT_TAGS`
  - `maxThemes = contentTagBudget − charCount − FIXED_CONTENT_TAGS`
  - **Two enforcement layers**: (1) Supporting/Antagonist rows are disabled when `contentTagsUsed >= contentTagBudget` — prevents adding when full. (2) `selectSingle` (for antagonist) and `toggleSupporting` both trim `themes` to `maxAllowedThemes` as a safety net so the builder can never produce an over-budget combo regardless of selection order.
- **Second genre** (optional): rendered as a **footer below the scrollable genre list** inside the Genre accordion — always visible when the section is open and a primary genre is chosen, no extra click required. Sorted by `GENRE_PAIR_MODIFIERS` art+com sum. Each option shows its modifier value.
- **"Optimise for" bias selector** (Art / Balanced / Commercial / Pollux pills, default Balanced): same options as Generate Ideas. The selected bias is passed to `generateSuggestions` when auto-completing and resets to Balanced on "Start Over".
- **"Auto-complete Script"** button (visible once ≥1 element selected, hidden after finalising): calls `generateSuggestions` with the player's genre filter and chosen bias, then merges the top result with whatever the player has already selected. If all slots are filled manually, shows **"Complete Script"** instead (just scores what's there).
- Final result renders using the same `ScriptCard` component as Generate Ideas, with a "Your Script" heading and a "Start Over" button.

**New exported functions in `src/lib/script-suggestions.ts`:**

| Function | Signature | Purpose |
|---|---|---|
| `scoreElementCompatibility` | `(candidate: ScriptElement, selected: ScriptElement[]) => number` | Sum of COMPAT_SCORES hits between candidate and all selected elements. Used to re-rank lists in Build mode. |
| `scorePartialBuild` | `(elements: ScriptElement[]) => { art, com, synergy }` | Partial art/com/synergy from any subset of elements. Used for the running score bar. |

---

## Architecture checklist

- Lossless round-trip — unmodified fields survive unchanged
- Data-driven — perk and tag lists are reference data, not hardcoded enums
- Type preservation — strings stay strings, numbers stay numbers
- BOM preserved on download
- No backend, no server, no auth
- Save version displayed in header; warn on unknown versions
