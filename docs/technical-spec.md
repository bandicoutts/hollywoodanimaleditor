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

---

### Functionalities

`stateJson.functionalities` — object of boolean feature flags. Many are `false` in early game.

Known keys: `MapNavigation`, `QualitySelection`, `Lieutenants`, `Secrets`, `ProductionEvents`, `StaffRaises`, `StaffRequests`, `InfoButton`, `CharacterEvents`, `Scandals`, `Policy`, `AttackByCompetitors`, `BirdView`, `Building`, `Cash`, `Influence`, `FullTimeControls`, and others.

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
  - Edit profession skill(s), `limit`/`Limit` (always update both), `mood` (Happiness), `attitude` (Loyalty), `xp`
  - `selfEsteem` passes through untouched — not surfaced in UI
  - Appeal section (Actors and Directors only): ART and COM sliders (0.000–1.000), with tier preset buttons (Promising Talent / Commanding Presence / True Artist / Icon for ART; Rising Star / Star / Superstar / Legend for COM). Active tier highlighted. Setting a value for the first time creates the `whiteTagsNEW` entry.
- Bulk actions: Max All Stats (including appeal for eligible characters), Remove All Caps
- Write decimal values back as 3-decimal strings: `"1.000"`

### 4. Writing Tags
- Show `tagPool` grouped by category (Genre, Setting, Protagonist, Supporting Character, Antagonist, Theme, Events, Finale)
- Active tags toggleable — removing deletes from array, adding injects `{ "Item1": id, "Item2": currentGameDate }`
- Show known tags not yet in pool as available to add (greyed out pills)
- Unlock All per category; global Unlock All in header
- Display names resolved via `TAG_LABELS` in `src/data/tags.ts` first; falls back to prefix-stripping + title-case (strips `PROTAGONIST_`, `ANTAGONIST_`, `THEME_`, `EVENTS_`/`EVENT_`, `FINALE_`, `SUPPORTINGCHARACTER_` prefixes before formatting)
- Unknown tags (not in the reference list) are grouped by prefix: `EVENTS_`/`EVENT_` → Events, `THEME_` → Theme, `PROTAGONIST_` → Protagonist, etc. Only tags with no matching prefix go to "Other (unknown)"
- Deactivating an unknown tag keeps it visible (inactive) so it can be re-toggled — it is not removed from the UI

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
- List all entries grouped by type (Camera / Sound)
- Toggle `owned`
- Entries with empty `configId` shown as read-only

### 8. Competitor Studios
- Show and edit budget, aggression, raid status per competitor
- Confirmation required before `isDead: true`

### 9. Milestones & Game Flags
- All milestones with finished/locked toggles
- `functionalities` flags with toggle switches
- Bulk: Unlock All Milestones, Enable All Features

### 10. AI Script Optimizer _(deferred)_

The UI shell (genre pills, disabled generate button) is scaffolded to reserve the module slot. Full implementation is deferred pending feasibility assessment.

Planned behaviour when implemented:
- User selects target genre/tone
- Pass player's current `tagPool` to Claude API (`claude-sonnet-4-5` or later)
- Claude suggests: protagonist, antagonist, supporting character, theme, events, finale, setting
- "Inject into save" adds combination to `movieScriptIdeas`
- API key entered by user in a settings panel — never hardcoded

---

## Architecture checklist

- Lossless round-trip — unmodified fields survive unchanged
- Data-driven — perk and tag lists are reference data, not hardcoded enums
- Type preservation — strings stay strings, numbers stay numbers
- BOM preserved on download
- No backend, no server, no auth
- Save version displayed in header; warn on unknown versions
