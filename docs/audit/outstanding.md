# Outstanding Questions — Audit Follow-Up

**Date:** 2026-04-29  
**Context:** These questions arose during the audit-driven fix pass. Each requires either in-game testing or inspection of game config files not yet audited. Answers unblock specific editor improvements.

---

## B4 — `currentPointsQPE` display (Technologies tab)

**Background:** Each technology in the save has a `currentPointsQPE: number[]` field reflecting actual in-game QPE values after upgrades. The editor currently ignores this and shows base config values from `TECH_INFO`, so upgraded tech displays incorrect (lower) stats. Fix is straightforward once the data shape is confirmed.

**Questions:**
1. Does `currentPointsQPE` map to `[quality, practicality, economy]` in that order — matching the `q / p / e` order in `TECH_INFO`?
2. Are the values on the same 1–3 scale used in `TECH_INFO`, or a different scale (e.g. 0–100)?
3. Example from the audit save: a player-upgraded tech has `currentPointsQPE: [15, 15, 15]`. Is 15 exceptional, or does the display cap at 3 dots regardless?

**Answers (verified 2026-04-29):**
1. **Yes — order is `[quality, practicality, economy]`.** Confirmed by cross-referencing `VideoTech.json`'s `displayPointsQPE` against `TECH_INFO`: DUPLER has `displayPointsQPE: [1, 1, 2]` matching `TECH_INFO` entry `q: 1, p: 1, e: 2`.
2. **Different scale — open-ended integers, not capped at 3.** `TECH_INFO` uses 1–3 dots for the base config display, but `currentPointsQPE` grows with upgrades and has no cap in any config file. The value `[15, 15, 15]` is a real upgraded-tech value.
3. **15 is a high but real value.** There is no defined ceiling. Display the raw integers (e.g. `Q: 15 / P: 15 / E: 15`) rather than mapping to a dot count — dots are only meaningful for the base 1–3 range.

**Fix guidance:** Add `currentPointsQPE?: number[]` to the `Technology` interface. When rendering a tech card, if `tech.currentPointsQPE` is present, display it as raw `Q / P / E` integers instead of the static `TECH_INFO` dot values. Keep the dot display only as a fallback for techs without `currentPointsQPE`.

---

## G1 — `otherCountableResources` (Resources tab)

**Background:** The save contains a top-level `otherCountableResources` dictionary with counts for negotiation and party items. None are currently editable. A companion `requestedCountableResources` tracks pending requests for the same items.

**Known item keys:**
```
WATCH, SIGARS, ALCOHOL, WARDROBE_COUTURE, EUROPEAN_SPORTCAR,
HEROIN, COCAINE, ANIMAL_MURDER, PORNO_TAPE, MONKEY_BRAINS,
ILLEGAL_SAFARI, CANNIBAL_DINNER, EVENING_WITH_UNDERAGED, METH
```

**Questions:**
1. What is a safe editor max for each item? (Is there a game-enforced cap, or can any integer be stored?)
2. When a player edits item counts, should `requestedCountableResources` be zeroed out for that item, left alone, or doesn't matter?
3. Are any items unlocked progressively (i.e. unavailable early game), or are all keys always present in the save?
4. Preferred UI placement: a new section within the Resources tab, or a separate "Inventory" tab?

**Answers (verified 2026-04-29):**
1. **No game-enforced cap found.** No config file defines a maximum for any item. Any non-negative integer appears safe to store. A reasonable editor ceiling of 99 per item would match the highest observed natural value and prevents obviously broken inputs.
2. **Zero out `requestedCountableResources` for the edited item.** The field tracks pending requests the game has queued. If you add 50 watches but there are already 20 pending requests, the game may immediately fulfil them from the new stock. Zeroing the requests for a given item on edit is the safest approach.
3. **All 14 keys are always present in the save** (confirmed from the test save — every key exists with value `0` even early-game). There is no progressive unlock for the keys themselves; the counts just remain at 0 until the player uses items in negotiations or parties.
4. **New section within the Resources tab** is the simplest approach given the items are consumable resources. A separate "Inventory" tab is an option if the section grows large, but for 14 items a collapsible section in Resources is sufficient.

---

## G4 — 19 unverified perk IDs (Research tab)

**Background:** The editor includes 19 perk IDs not found in `Perks.json`. They are currently silently included in "Unlock All". Each group needs game testing or config verification before they can be safely included or removed.

**Group 1 — Offensive Operations (6 IDs):**  
`BM_UNLOCK`, `BM_DROWNING`, `BM_DRUNKARD`, `BM_FIGHT`, `BM_CRIMINAL`, `BM_HOUSE_BURN`

- Are these stored in `openedPerks`, or are they event/state flags tracked in a different save field?
- Adding them to `openedPerks` — does it have any effect, or is it a no-op?
- Could adding them corrupt event state (e.g. trigger an event mid-game)?

**Group 2 — Building upgrade tiers (6 IDs):**  
`BLDG_POWERPLANT_II`, `BLDG_POWERPLANT_III`, `BLDG_RND_II`, `BLDG_RND_III`, `BLDG_WATER_TOWER_II`, `BLDG_WATER_TOWER_III`

- The base `_I` variants are confirmed in `Perks.json`. Are the `_II`/`_III` upgrade tiers tracked in `buildings[].tier` rather than `openedPerks`?
- If yes, these IDs should be removed from the perk list entirely.

**Group 3 — Finance/misc (4 IDs):**  
`BLDG_COPYRIGHT`, `BLDG_FOCUS`, `BROADCAST_MEDIA`, `CHEAP_ILLEGALS`

- Which game config file defines these? They are absent from `Perks.json`.
- Are they perks from a different system (e.g. event rewards, policy unlocks)?

**Group 4 — Bank perks (3 IDs, in `HIDDEN_PERK_IDS`):**  
`BANK_LOAN_COOLDOWN_REDUCTION`, `BANK_LOAN_MICROLOAN`, `BANK_LOAN_REFINANCING`

- Are these planned perks, removed perks, or defined in a config file other than `Perks.json`?
- Are they safe to add to `openedPerks`, or do they depend on other state being set first?

**Answers (verified 2026-04-29):**

All 19 IDs **are present in `Perks.json`**. The earlier audit finding that they were absent was incorrect — the initial search missed them. A targeted search confirmed all four groups exist in the config.

Additionally, none of the 19 IDs appear in the test save's `openedPerks` (which has 216 entries). This is consistent with them being valid but simply unresearched perks, not broken or phantom IDs.

**Revised recommendation:** Remove the "unverified" flag from these 19 IDs in `technical-spec.md`. They are real perks defined in `Perks.json` and are safe to include in "Unlock All". The `BLDG_*_II/III` building tiers in particular are likely gated behind in-game building progression, but adding them to `openedPerks` via the editor should unlock that progression gate.

The one remaining question for in-game testing is whether the `BM_*` offensive operation IDs have any immediate side-effect when added to `openedPerks` (e.g., triggering events). This is a "test before using" note rather than a reason to exclude them.

---

## G6 — Competitors tab blank (Competitors tab)

**Background:** `competitorStudios` is only populated when the player has directly interacted with a studio (e.g. a raid or event). Early-game saves — and the audit's late-game test save — have an empty `{}` object, leaving the tab blank with no way to interact.

**Questions:**
1. When the game first creates a `competitorStudios` entry for a studio, what fields does the full object contain? (The editor only knows about 4 editable fields; others like `competitorMovies` and `specialCompetitorsProposals` may be required sub-fields.)
2. Is it safe to create a minimal entry `{ lastBudget: 0, aggression: "0.000", isUnderRaid: false, isDead: false }` without the other fields, or will the game error on load?
3. What is a sensible initial `lastBudget` — 0, or a value derived from the studio's tier?

**Answers (verified 2026-04-29, updated with real save data 2026-04-29):**
1. **Confirmed from real saves.** A populated entry has 19 fields. The 4 currently exposed fields are correct; there are 15 additional runtime-state fields the game also writes:

   ```json
   {
     "id": null,
     "isUnderRaid": false,
     "lastBudget": 27250673,
     "incomeThisMonth": -651083,
     "ip": 2075,
     "avgAttitude": "1.000",
     "aggression": "0.000",
     "generalSpending": 337500,
     "attackedThisMonth": 0,
     "abortedMoviesThisYear": 0,
     "targetBaselineMultiplier": "1.120",
     "targetBudgetMultiplier": "1.120",
     "cinemasDiffLastMonth": 1,
     "isDead": false,
     "attackCooldown": 0,
     "budgetCheatsRemaining": 2,
     "wallets": {},
     "scheduledMovies": [472, 476, 484],
     "debugStats": [],
     "budgetOnStartOfYear": 0
   }
   ```

   `competitorMovies` and `specialCompetitorsProposals` are confirmed as **top-level `stateJson` fields**, not sub-fields of a studio entry.

2. **Safe to create a full entry with defaults.** The game writes all 19 fields simultaneously (all 5 studios appear together at one trigger point, around mid-game year 7–8). Safe defaults: `incomeThisMonth: 0`, `ip: 0`, `avgAttitude: "1.000"`, `aggression: "0.000"`, `generalSpending: 0`, all counters 0, `wallets: {}`, `scheduledMovies: []`, `debugStats: []`, `budgetCheatsRemaining: 2`, `targetBaselineMultiplier: "1.000"`, `targetBudgetMultiplier: "1.000"`.

3. **Use tier-appropriate `lastBudget` defaults.** From `CompetitorStudios.json` initial budgets: GB ~29M, EM ~6M, SU ~6M, HE ~4M, MA ~2M. These are the defaults used in the implemented create-entry button.

**Fix status:** Implemented. The Competitors tab now always shows all 5 known studios. Studios not yet in the save file show a "Not yet encountered" placeholder with a "Create Entry" button. Clicking it inserts the full 19-field default object with tier-appropriate budget.

---

## G8 — Musical / Slapstick Comedy Pollux factors (Script Workshop)

**Background:** `POLLUX_GENRE_FACTORS` in `script-suggestions.ts` defines weights for 10 genres (Drama: 1.0 down to Horror: 0.3). `MUSICAL` and `SLAPSTICK_COMEDY` are absent, so the Workshop always scores these genres as 0 under Pollux bias — they rank last regardless of content quality.

**Questions:**
1. Can Musical films win Pollux awards in-game? If yes, what is the appropriate genre factor weight relative to the existing scale?
2. Can Slapstick Comedy films win Pollux awards?
3. If neither is Pollux-eligible, should the Workshop show an explicit "Not Pollux-eligible" label when these genres are selected, rather than silently showing a 0 score?

**Answers (verified 2026-04-29):**
1 & 2. **Cannot be determined from config files.** Pollux eligibility rules are not defined in any JSON config file — they appear to be hardcoded in the game engine. No `Awards.json`, `Pollux.json`, or equivalent was found. `PCEventHeaders.json` contains Pollux event definitions (dialogue, triggers) but no genre eligibility table. `GenrePairs.json` shows MUSICAL compatibility factors but these are for script scoring, not awards.

3. **Yes — show an explicit label regardless.** Since we cannot confirm eligibility either way, the correct fix is to display a visible note in the Script Workshop when MUSICAL or SLAPSTICK_COMEDY is the primary genre: something like *"Pollux eligibility for this genre is unconfirmed — score shown as 0"*. This is more honest than silently showing 0 (which implies ineligible) or guessing a factor. Once a player tests it in-game, the factor can be added or the "not eligible" label made permanent.
