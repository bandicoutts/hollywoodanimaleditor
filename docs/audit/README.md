# Save Editor Audit — Index

**Audited:** 2026-04-28  
**Save file:** `1.json` (version 0.8.55EA, 1,199 characters, 39 buildings)  
**Game version:** Hollywood Animal (Early Access, Steam)

Each tab has a dedicated audit file. This index summarises findings by severity.

---

## Bugs (incorrect behaviour, risk of data corruption or silent stat loss)

| # | Tab | Issue | File | Status |
|---|---|---|---|---|
| B1 | Characters | INDOOR/OUTDOOR filming skill cap is `0.400` but actual save values reach `0.500` — touching a maxed cinematographer's slider silently reduces their skills | [characters.md](characters.md) | ✅ Fixed |
| B2 | Characters | XP is clamped to ≥ 0 but valid saves contain negative XP (mid-leveling state) — editor will corrupt valid negative-XP characters | [characters.md](characters.md) | ✅ Fixed |
| B3 | Technologies | `DOMINUS` (Sonatone audio tech) missing from `TECH_INFO` — displays as "Custom Tech" with no `owned` toggle | [technologies.md](technologies.md) | ✅ Already fixed |
| B4 | Technologies | `currentPointsQPE` ignored — editor shows base QPE stats from config instead of player's actual (potentially upgraded) values | [technologies.md](technologies.md) | ✅ Fixed |
| B5 | Milestones | "Unlock All" sets `progress = "1.000"` for all milestones, but count/chain milestones have goals > 1 (e.g. 8 actors = `"8.000"`, 365 days = `"365.000"`) — creates inconsistent state | [milestones.md](milestones.md) | ✅ Fixed |
| B6 | Resources | `boughtWaterThisMonth` / `boughtElectricityThisMonth` not reset when utilities are edited — may cause billing inconsistencies in-game | [resources.md](resources.md) | ✅ Fixed |

---

## Gaps (missing features, editor incomplete vs. game)

| # | Tab | Issue | File | Status |
|---|---|---|---|---|
| G1 | Resources | `otherCountableResources` (watches, cigars, alcohol, luxury cars, contraband items) not exposed — no way to edit negotiation/party item inventory | [resources.md](resources.md) | ✅ Fixed |
| G2 | Characters | Genre tags in `whiteTagsNEW` (ADVENTURE, ROMANCE, etc.) not exposed — pass through safely but players can't see or edit character film specialisations | [characters.md](characters.md) | 🔲 Not started |
| G3 | Writing Tags | `PROTAGONIST_SAILOR` missing from hardcoded tag list — not included in "Unlock All" | [writing-tags.md](writing-tags.md) | ✅ Fixed |
| G4 | Research | 19 perk IDs in editor are explicitly flagged as unverified (may have no effect or corrupt event state) — still silently included in "Unlock All" | [research.md](research.md) | ✅ Fixed — IDs confirmed valid in Perks.json; warning removed from technical-spec.md |
| G5 | Research | Editor perk count (~216) vs `Perks.json` (157) gap not fully explained — other config files may define additional perks | [research.md](research.md) | 🔲 Not started |
| G6 | Competitors | Tab is blank when `competitorStudios: {}` — common even in late game; no way to create entries for studios not yet interacted with | [competitors.md](competitors.md) | ⏳ Deferred — needs real populated save for safe-entry structure verification |
| G7 | Competitors | `specialCompetitorsProposals` cooldowns not editable | [competitors.md](competitors.md) | 🔲 Not started |
| G8 | Script Workshop | Musical and Slapstick Comedy have no Pollux factor — always score 0 under Pollux bias (may be misleading if these genres are Pollux-eligible in game) | [script-workshop.md](script-workshop.md) | ✅ Fixed — explicit "unconfirmed eligibility" note shown in UI |
| G9 | Cheats | `mainPolicyId: "REJECTED"` not shown in policy dropdown — player can't see their current state is "rejected" before overwriting | [cheats.md](cheats.md) | ✅ Fixed |
| G10 | Cheats | `openedAdsAgents` IDs hardcoded but not verified against game config — may be stale | [cheats.md](cheats.md) | 🔲 Not started |

---

## Minor / Low risk

| # | Tab | Issue | File |
|---|---|---|---|
| M1 | Characters | Character type detected via profession key prefix heuristic rather than `$type` field — fragile if game adds new types | [characters.md](characters.md) |
| M2 | Characters | `isShady`, `isImmune`, `isOnTheHook`, `wasImprisoned` boolean flags not exposed | [characters.md](characters.md) |
| M3 | Writing Tags | "Unlock All" stamps all tags with current game date, ignoring date-based unlock conditions — game may or may not re-validate on load | [writing-tags.md](writing-tags.md) |
| M4 | Research | `HIDDEN_PERK_IDS` is a manual sync point — won't update if game reclassifies perks | [research.md](research.md) |
| M5 | Technologies | Type definition explicitly covers only 8 of 17 save fields (others pass through via catch-all) | [technologies.md](technologies.md) |
| M6 | Technologies | Obsolescence dates (`isMarkedToBeOutDated`, `outDate`) not exposed | [technologies.md](technologies.md) |
| M7 | Milestones | `POLICY_AVERAGE_0–3` present in editor and save but absent from game config — likely deprecated | [milestones.md](milestones.md) |
| M8 | Milestones | Milestone goal values and dependency chains not shown in UI | [milestones.md](milestones.md) |
| M9 | Cheats | Max XP (`9,999,999`) overwrites valid negative-XP mid-leveling state — irreversible without re-upload | [cheats.md](cheats.md) |

---

## Verified correct

All fields in the following areas were verified against the actual save file and game config and found to be correct:

- **Resources:** all 6 field names, types, and max values
- **Characters:** all 23 profession key names, all 31 trait IDs, `limit`/`Limit` dual sync, `bonusCards` sync, `birthDate` format
- **Writing Tags:** all 253 tags match game config (254 total; only `PROTAGONIST_SAILOR` missing); `Item1`/`Item2` structure; Cyrillic tag ID
- **Research:** all 7 field names and types; 49 hidden perk IDs match `Perks.json`
- **Technologies:** `owned` toggle; round-trip safety; `type` enum; custom tech detection
- **Competitors:** all 4 editable fields; all 5 studio IDs match `CompetitorStudios.json`
- **Milestones:** all milestone fields; all 33 functionality flags
- **Script Workshop:** `tagPool` unlock logic; alliance/codex filtering; content budget enforcement
- **Cheats:** all 8 operations; building state/type correctness
