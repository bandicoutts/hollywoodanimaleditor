# Hollywood Animal Save Editor

A browser-based save file editor for [Hollywood Animal](https://store.steampowered.com/app/1327900/Hollywood_Animal/) (Weappy Studio, Steam). Upload your `.json` save file, edit game state through a tab-based UI, and download the modified file back. Everything runs client-side — no backend, no server, your save file never leaves your browser.

---

## What you can edit

### Resources
Budget, cash, influence, reputation, water and electricity reserves. Also exposes the full negotiation and party item inventory (watches, cigars, alcohol, luxury cars, contraband items).

### Characters
All characters across every profession — actors, directors, cinematographers, writers, producers, and more. Edit stats, traits, XP, genre specialisations, and bonus cards. Supports per-stat max buttons and bulk actions per profession.

### Technologies
All owned video and audio technologies. Toggle ownership and see real QPE (Quality / Practicality / Economy) values including upgrades, not just the base config stats.

### Writing Tags
The full script element tag pool — all 254 tags across genres, protagonists, locations, themes, and more. Unlock individual tags or all at once.

### Research
The full perk/research tree. Unlock individual perks or all at once. Supports research speedup multiplier editing (1×, 5×, 10×, 99×).

### Milestones
All studio milestones and functionality flags. Unlock individual milestones or all at once, with correct progress values for count-based and chain milestones.

### Competitors
All five rival studios — Gerstein Brothers, Evergreen Movies, Supreme, Hephaestus, and Marginese. Edit budget, aggression, raid status, and elimination state. Studios not yet encountered in your save can be initialised with a single click.

### Script Workshop
A read-only advisory tool. Suggests script element tags based on your current tag pool, applying compatibility scores and optional Pollux award bias weighting. Supports alliance codex filtering and banned element markers.

### Cheats
One-click bulk operations: max all resources, max negotiation bonuses, set studio policy, unlock ad agencies, set research speedup, max XP for all characters, complete all research, and complete all construction.

---

## How to use it

1. Open the editor in your browser.
2. Find your Hollywood Animal save file — typically at:
   - **Windows:** `%AppData%\..\LocalLow\Weappy\Hollywood Animal\Saves\Profiles\0\`
3. Click **Upload Save** and select your `.json` save file.
4. Edit using the tabs on the left.
5. Click **Download Save** to get your modified file.
6. Replace the original file in the save directory with the downloaded file.

> The editor preserves all fields it does not expose — loading a modified save will not strip any unedited data.

---

## Running locally

```bash
npm install
npm run dev
```

The dev server runs on **port 3009** by default. Open [http://localhost:3009](http://localhost:3009).

---

## Tech stack

- [Next.js](https://nextjs.org/) (App Router)
- TypeScript
- React
- CSS variables — Art Deco-inspired UI theme

No database, no API routes, no authentication. The entire application is a static client-side bundle.

---

## Project structure

```
src/
  app/                  Next.js app router entry
  components/
    layout/             AppShell, Sidebar, tab routing
    modules/            One file per editor tab (ResourcesModule, CharactersModule, etc.)
  context/              SaveFileContext — parse, mutate, and serialize the save file
  data/                 Static lookup tables (tags, perks, tech info, competitor meta)
  lib/                  Save file types and utility functions
docs/
  audit/                Tab-by-tab audit of editor correctness vs. game config files
  technical-spec.md     Field-level reference for the save file format
  HANDOVER.md           Agent/contributor onboarding guide
```

---

## Save file format

Hollywood Animal saves are UTF-8 JSON files with a `stateJson` root object containing all editable game state. The editor reads `stateJson`, applies changes, and writes it back into the original file wrapper — preserving `currentMeta` and any other top-level fields untouched.

---

## Notes

- Compatible with **Hollywood Animal Early Access** (tested on versions 0.8.55EA – 0.8.69EA).
- Save file format may change between game updates. If the editor stops working after a game patch, check the `docs/audit/` folder for field-level documentation.
- The Script Workshop is advisory only — it does not modify your save file.
