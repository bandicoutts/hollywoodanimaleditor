# Hollywood Animal Save Editor — Technical Specification

## Overview

A browser-based save file editor for the game **Hollywood Animal** (Weappy, Steam). Players upload their JSON save file, edit game state through a UI, and download the modified file. Everything runs client-side — no backend, no server, no file ever leaves the browser.

**Stack:** Next.js · React · Tailwind · Vercel

---

## Core constraint: lossless round-trip

Parse → modify only touched fields → re-serialise. Any field the editor does not explicitly handle must survive the round-trip exactly as-is. This is non-negotiable. Future game updates will add fields the editor doesn't know about — they must not be destroyed.

---

## Save file format

Files use **UTF-8 with BOM** (`utf-8-sig`). Handle the BOM on read; write it back on download.

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
| `professions` | object | e.g. `{ "Actor": "0.810" }` — skill as decimal string |
| `limit` | string | Skill cap as decimal string |
| `Limit` | string | Duplicate of `limit` — **both must be updated together** |
| `mood` | string | Decimal string 0.000–1.000 |
| `attitude` | string | Decimal string 0.000–1.000 |
| `selfEsteem` | string | Decimal string 0.000–1.000 |
| `xp` | number | Experience points |
| `firstNameId` | string | References in-game name lookup — do not edit |
| `lastNameId` | string | References in-game name lookup — do not edit |
| `customName` | string \| null | Custom display name written directly to save — preferred over localStorage |
| `labels` | string[] | Trait labels e.g. `"IMMORTAL"`, `"STERILE"` — editable array |

Filter employed characters by `studioId !== null`.

**Known profession types:**
`Actor`, `Director`, `Producer`, `Scriptwriter`, `Cinematographer`, `Composer`, `FilmEditor`, `Agent`, `CptLawyer`, `CptHR`, `CptPR`, `CptFinancier`, `LieutProd`, `LieutPrep`, `LieutTech`, `LieutScript`, `LieutRelease`, `LieutPost`, `LieutSecurity`, `LieutEscort`, `LieutMuseum`, `LieutInfrastructure`, `LieutProducers`

**Known label values (31 observed):**
`ALCOHOLIC`, `ARROGANT`, `CALM`, `CHASTE`, `CHEERY`, `DEMANDING`, `DISCIPLINED`, `HARDWORKING`, `HEARTBREAKER`, `HOTHEADED`, `IMMORTAL`, `INDIFFERENT`, `JUNKIE`, `LAZY`, `LEADER`, `LUDOMANIAC`, `MAIN_CHARACTER`, `MELANCHOLIC`, `MISOGYNIST`, `MODEST`, `OPEN_MINDED`, `PERFECTIONIST`, `RACIST`, `SIMPLE`, `STERILE`, `SUPER_IMMORTAL`, `TEAM_PLAYER`, `UNDISCIPLINED`, `UNTOUCHABLE`, `UNWANTED_ACTOR`, `XENOPHOBE`

Character names are integer IDs referencing an in-game lookup table. The `customName` field exists on character objects in the save file — write display names there directly. Do not edit `firstNameId` or `lastNameId`.

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

`Item1` is the tag ID. `Item2` is the availability date — use the current in-game date when adding new tags. The in-game date is not directly readable from the save, so `"1929-01-01T00:00:00"` is used as a safe fallback (the game accepts any valid date string here). The list below covers 156 known tag IDs. Apply the same rules as perks: reference set only, not a hardcoded enum.

**Genre**
`DRAMA, COMEDY, ACTION, ROMANCE, DETECTIVE, ADVENTURE, THRILLER, HISTORICAL, HORROR, SCIENCE_FICTION`

**Setting**
`WILD_WEST, MODERN_AMERICAN_CITY, MODERN_AMERICAN_TOWN, MODERN_AMERICAN_COUNTRYSIDE, FANTASY_KINGDOM, TROPICAL_ISLAND, CARIBBEAN, SPACE, DYSTOPIAN_FUTURISTIC_CITY, UTOPIAN_FUTURISTIC_CITY, GREAT_WAR, AMERICAN_CIVIL_WAR, ARTHURIAN_LEGENDS, MIDDLE_AGES, VICTORIAN_ENGLAND`

**Protagonist**
`PROTAGONIST_COWBOY, PROTAGONIST_WORKING_MAN, PROTAGONIST_DETECTIVE, PROTAGONIST_COP, PROTAGONIST_KNIGHT, PROTAGONIST_CLUMSY_OAF, PROTAGONIST_DARING_ADVENTURER, PROTAGONIST_HOPELESS_ROMANTIC, PROTAGONIST_OUTCAST, PROTAGONIST_SHERIFF, PROTAGONIST_SOLDIER, PROTAGONIST_WAYWARD_SOUL, PROTAGONIST_RETIRED_LEGEND, PROTAGONIST_CHARISMATIC_CRIMINAL, PROTAGONIST_AMBITIOUS_WOMAN, PROTAGONIST_WARRIOR, PROTAGONIST_BOUNTY_HUNTER, PROTAGONIST_ACCIDENTAL_HERO, PROTAGONIST_FARM_GIRL, PROTAGONIST_LOVEABLE_ROGUE, PROTAGONIST_SPIRITED_YOUNG_LADY, PROTAGONIST_LAST_SURVIVOR`

**Supporting Character**
`SUPPORTINGCHARACTER_LOVE_INTEREST, SUPPORTINGCHARACTER_SIDEKICK, SUPPORTINGCHARACTER_ANGRY_BOSS, SUPPORTINGCHARACTER_FEMME_FATALE, SUPPORTINGCHARACTER_DAMSEL_IN_DISTRESS, SUPPORTINGCHARACTER_RIVAL, SUPPORTINGCHARACTER_STRICT_PARENT, SUPPORTINGCHARACTER_MENTOR, SUPPORTINGCHARACTER_CONCERNED_WIFE, SUPPORTINGCHARACTER_SHERIFF, SUPPORTINGCHARACTER_PARENT_FIGURE, SUPPORTINGCHARACTER_WIZARD, SUPPORTINGCHARACTER_KEY_WITNESS, SUPPORTINGCHARACTER_VILLAINS_RIGHT_HAND, SUPPORTINGCHARACTER_FIRST_VICTIM, SUPPORTINGCHARACTER_MYSTERIOUS_GUIDE`

**Antagonist**
`ANTAGONIST_CRIMINAL_MASTERMIND, ANTAGONIST_MURDERER, ANTAGONIST_SERIAL_KILLER, ANTAGONIST_EVIL_MONSTER, ANTAGONIST_EVIL_WITCH, ANTAGONIST_BANDIT, ANTAGONIST_TRIBAL_CHIEF, ANTAGONIST_HEARTLESS_BUREAUCRAT, ANTAGONIST_EVIL_SORCERER, ANTAGONIST_PIRATE, ANTAGONIST_CRIMINAL_GANG, ANTAGONIST_CORRUPT_OFFICIAL, ANTAGONIST_ENEMY_FROM_THE_PAST, ANTAGONIST_TYRANT, ANTAGONIST_RULE_ENFORCER, ANTAGONIST_PATRIARCH, ANTAGONIST_VAMPIRE, ANTAGONIST_ALIEN, ANTAGONIST_ANCIENT_EVIL, ANTAGONIST_ROBOT, ANTAGONIST_MAD_SCIENTIST, ANTAGONIST_OLD_FRIEND_ENEMY, ANTAGONIST_VENGEFUL_SPIRIT, ANTAGONIST_UNDEAD`

**Theme**
`THEME_TREASURE_HUNT, THEME_WINNING_THE_BELOVED, THEME_LOVE_TRIANGLE, THEME_AVENGING_LOVED_ONES, THEME_STRUGGLE_FOR_BETTER_LIFE, THEME_UNREQUITED_LOVE, THEME_SEARCH_KILLER, THEME_SLAPSTICK_MAYHEM, THEME_GENERATIONAL_CONFLICT, THEME_FIGHT_HYPOCRITICAL_AMERICAN, THEME_UNIFORM_HEROISM, THEME_ALCOHOL_FREEDOM, THEME_PROTAGONIST_ROPED_BACK_IN, THEME_MOB_WAR, THEME_ONE_LAST_JOB, THEME_SOCIAL_REJECTION, THEME_FROM_SMALL_TOWN_TO_BIG_TIME, THEME_A_CURSE, THEME_LONG_JOURNEY, THEME_EVIL_TRANSFORMATION, THEME_PROTECTING_THE_WITNESS, THEME_LOWBROW_HUMOR, THEME_HIGHBROW_HUMOR`

**Events**
`EVENTS_PRISON_BREAK, EVENTS_BANK_ROBBERY, EVENTS_JOUSTING_TOURNAMENT, EVENTS_SHOOTOUT, EVENTS_ANCIENT_PUZZLE, EVENTS_PROMISCUITY, EVENTS_CHEATING_SPOUSE, EVENTS_TRAIN_JOB, EVENTS_NUDITY, EVENTS_ABUNDANT_PROFANITY, EVENTS_DIVORCE, EVENTS_CRIME_OF_NECESSITY, EVENTS_RUNAWAY, EVENTS_EXCESSIVE_VIOLENCE, EVENTS_RAPE, EVENTS_SAVING_BELOVED, EVENTS_AMBUSH, EVENTS_BIG_BATTLE_SCENES, EVENTS_STAGECOACH_ROBBERY, EVENTS_BETRAYAL, EVENTS_FINAL_SHOWDOWN, EVENT_CURSED_DEAL`

**Finale**
`FINALE_ANTAGONIST_GETS_PUNISHED, FINALE_PROTAGONIST_DIES_HEROICALLY, FINALE_ANTAGONIST_GETS_KILLED, FINALE_ANTAGONIST_REPENTS, FINALE_PROTAGONIST_RESCUES_HOSTAGE, FINALE_SWEETHEARTS_STAY_TOGETHER, FINALE_PROTAGONIST_GETS_CHANCE_FOR_BETTER_LIFE, FINALE_PROTAGONIST_OVERCAME_SELFDOUBT, FINALE_PROTAGONIST_FINDS_TREASURE, FINALE_ANTAGONIST_ESCAPES_JUSTICE, FINALE_PROTAGONIST_FINDS_LOVE, FINALE_COUPLE_GETS_MARRIED, FINALE_PROTAGONIST_GETS_PUNISHED_FOR_CRIME, FINALE_PROTAGONIST_COMMITS_SUICIDE, FINALE_PROTAGONIST_AVOIDS_PUNISHMENT, FINALE_PROTAGONIST_RETIRES_FOR_GOOD, FINALE_EVERYONE_LEARNS_A_LESSON, FINALE_PROTAGONISTS_DREAMS_CRUSHED, FINALE_FAMILY_REUNION, FINALE_EVIL_EXPOSED, FINALE_STARCROSSED_LOVERS, FINALE_ANTAGONIST_DEFEATED_EVIL_PERSISTS, FINALE_PROTAGONIST_TAKES_ANTAGONIST_WITH_THEM`

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
- Display studio name, save version, in-game date
- Download button re-serialises and triggers file download, preserving all unmodified fields
- Warn if save version is newer than `0.8.69EA`

### 2. Resources
Edit `budget`, `cash`, `reputation`, `influence` via sliders with live numeric display. Preserve original types on write.

### 3. Character Editor
- List all characters, filterable by employed/all, profession type, name search
- Each row: character identifier, profession badge, skill bar showing current vs cap
- Click to open detail panel: edit skill, `limit`/`Limit` (always update both), `mood`, `attitude`, `selfEsteem`, `xp`
- Bulk actions: Max All Stats, Remove All Caps
- Write decimal values back as 3-decimal strings: `"1.000"`

### 4. Writing Tags
- Show `tagPool` grouped by category
- Active tags toggleable — removing deletes from array, adding injects `{ "Item1": id, "Item2": currentGameDate }`
- Show known tags not yet in pool as available to add
- Unlock All per category
- Unknown tags grouped as "Other"

### 5. Research (Perks)
- Checklist grouped by functional category
- Opened perks shown as checked; unchecking removes; checking adds
- Unlock All button
- Unknown perks still displayed

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
