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

---

## G6 — Competitors tab blank (Competitors tab)

**Background:** `competitorStudios` is only populated when the player has directly interacted with a studio (e.g. a raid or event). Early-game saves — and the audit's late-game test save — have an empty `{}` object, leaving the tab blank with no way to interact.

**Questions:**
1. When the game first creates a `competitorStudios` entry for a studio, what fields does the full object contain? (The editor only knows about 4 editable fields; others like `competitorMovies` and `specialCompetitorsProposals` may be required sub-fields.)
2. Is it safe to create a minimal entry `{ lastBudget: 0, aggression: "0.000", isUnderRaid: false, isDead: false }` without the other fields, or will the game error on load?
3. What is a sensible initial `lastBudget` — 0, or a value derived from the studio's tier?

---

## G8 — Musical / Slapstick Comedy Pollux factors (Script Workshop)

**Background:** `POLLUX_GENRE_FACTORS` in `script-suggestions.ts` defines weights for 10 genres (Drama: 1.0 down to Horror: 0.3). `MUSICAL` and `SLAPSTICK_COMEDY` are absent, so the Workshop always scores these genres as 0 under Pollux bias — they rank last regardless of content quality.

**Questions:**
1. Can Musical films win Pollux awards in-game? If yes, what is the appropriate genre factor weight relative to the existing scale?
2. Can Slapstick Comedy films win Pollux awards?
3. If neither is Pollux-eligible, should the Workshop show an explicit "Not Pollux-eligible" label when these genres are selected, rather than silently showing a 0 score?
