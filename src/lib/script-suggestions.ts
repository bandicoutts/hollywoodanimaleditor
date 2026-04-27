import type { StateJson, TagPoolEntry } from "./save-file";
import {
  GENRES,
  SETTINGS,
  PROTAGONISTS,
  SUPPORTING_CHARS,
  ANTAGONISTS,
  THEMES,
  EVENTS,
  FINALES,
  GENRE_PAIR_MODIFIERS,
  COMPAT_SCORES,
  POLLUX_GENRE_FACTORS,
  type ScriptElement,
  type ScoreResult,
} from "@/data/scriptElements";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Bias = "art" | "balanced" | "commercial" | "pollux";

export interface SuggestionOpts {
  genreFilter: string | null;
  bias: Bias;
  themeEventCount: number;
}

export interface ScriptCombo {
  genre: ScriptElement;
  genre2?: ScriptElement;
  setting: ScriptElement;
  protagonist: ScriptElement;
  supporting: ScriptElement;
  antagonist: ScriptElement;
  themesEvents: ScriptElement[];
  finale: ScriptElement;
  scores: ScoreResult;
}

export interface UnlockedPool {
  genres: ScriptElement[];
  settings: ScriptElement[];
  protagonists: ScriptElement[];
  supportingChars: ScriptElement[];
  antagonists: ScriptElement[];
  themesEvents: ScriptElement[];
  finales: ScriptElement[];
}

// ── Game date parsing ─────────────────────────────────────────────────────────

// stateJson.timePassed format: "3287.00:00:00" = elapsed days from 1929-01-01
export function parseGameDate(stateJson: StateJson): Date {
  const timePassed = stateJson.timePassed;
  if (typeof timePassed === "string") {
    const dayStr = timePassed.split(".")[0];
    const days = parseInt(dayStr, 10);
    if (!isNaN(days) && days >= 0) {
      const d = new Date(1929, 0, 1);
      d.setDate(d.getDate() + days);
      return d;
    }
  }

  // Fallback: infer from latest tagPool entry date
  const tagPool: TagPoolEntry[] = stateJson.tagPool ?? [];
  const dates: number[] = [];
  for (const entry of tagPool) {
    if (typeof entry.Item2 === "string") {
      const ms = Date.parse(entry.Item2);
      if (!isNaN(ms)) dates.push(ms);
    }
  }
  if (dates.length > 0) {
    return new Date(Math.max(...dates));
  }

  return new Date(1929, 0, 2);
}

// ── Unlock checking ───────────────────────────────────────────────────────────

function parseDMY(dmy: string): Date {
  // DD-MM-YYYY
  const parts = dmy.split("-");
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  return new Date(y, m - 1, d);
}

export function isUnlocked(
  element: ScriptElement,
  gameDate: Date,
  recipesPool: string[]
): boolean {
  const u = element.unlock;

  if (u === "never") return false;
  if (u.startsWith("Recipe")) return recipesPool.includes(element.id);

  if (u.startsWith(">=")) {
    const raw = u.slice(2).trim();
    let threshold: Date;
    if (/^\d{4}$/.test(raw)) {
      threshold = new Date(parseInt(raw), 0, 1);
    } else {
      // DD-MM-YYYY: detect by checking if the year is the last 4-digit group
      const parts = raw.split("-");
      if (parts.length === 3 && parts[2].length === 4) {
        threshold = parseDMY(raw);
      } else {
        threshold = new Date(parseInt(raw), 0, 1);
      }
    }
    return gameDate >= threshold;
  }

  if (u.startsWith("Before ")) {
    const year = parseInt(u.slice(7));
    return gameDate.getFullYear() < year;
  }

  if (u.startsWith("After ")) {
    const year = parseInt(u.slice(6));
    return gameDate.getFullYear() > year;
  }

  // Bare year
  if (/^\d{4}$/.test(u)) {
    return gameDate.getFullYear() >= parseInt(u);
  }

  return false;
}

// ── Pool building ─────────────────────────────────────────────────────────────

export function getUnlockedPool(stateJson: StateJson): UnlockedPool {
  // Use tagPool (actually researched tags) as the source of truth.
  // Date conditions only determine when an element becomes researchable — the
  // player must still explicitly research it before it appears in their tagPool.
  const tagPoolIds = new Set((stateJson.tagPool ?? []).map((t) => t.Item1));
  const recipesPool: string[] = stateJson.tagRecipesPool ?? [];

  const check = (el: ScriptElement) =>
    tagPoolIds.has(el.id) || recipesPool.includes(el.id);

  return {
    genres: GENRES.filter(check),
    settings: SETTINGS.filter(check),
    protagonists: PROTAGONISTS.filter(check),
    supportingChars: SUPPORTING_CHARS.filter(check),
    antagonists: ANTAGONISTS.filter(check),
    themesEvents: [...THEMES, ...EVENTS].filter(check),
    finales: FINALES.filter(check),
  };
}

// ── Scoring ───────────────────────────────────────────────────────────────────

export function scoreCombination(combo: Omit<ScriptCombo, "scores">): ScoreResult {
  const elements: ScriptElement[] = [
    combo.genre,
    combo.setting,
    combo.protagonist,
    combo.supporting,
    combo.antagonist,
    ...combo.themesEvents,
    combo.finale,
  ];
  if (combo.genre2) elements.push(combo.genre2);

  let art = elements.reduce((s, e) => s + e.art, 0);
  let com = elements.reduce((s, e) => s + e.com, 0);

  if (combo.genre2) {
    const key = `${combo.genre.label}|${combo.genre2.label}`;
    const mod = GENRE_PAIR_MODIFIERS[key];
    if (mod) {
      art += mod.art;
      com += mod.com;
    }
  }

  // Compatibility score: weighted sum using real TagCompatibilityData
  // Score-5 pairs (perfect) → 1.0, score-4 pairs (strong) → 0.5
  let synergy = 0;
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const sorted = [elements[i].id, elements[j].id].sort();
      synergy += COMPAT_SCORES.get(`${sorted[0]}|${sorted[1]}`) ?? 0;
    }
  }

  // Pollux: genre_factor × (art×2 + com), per GameVariables pollux_genre_factors
  // art_status_bonus max 4, com_status_bonus max 2 → art weighted 2× com
  const primaryFactor = POLLUX_GENRE_FACTORS[combo.genre.id] ?? 0;
  const secondaryFactor = combo.genre2 ? (POLLUX_GENRE_FACTORS[combo.genre2.id] ?? 0) * 0.5 : 0;
  const genreFactor = Math.min(1, primaryFactor + secondaryFactor);
  const pollux = genreFactor * (art * 2 + com);

  return { art, com, synergy, pollux };
}

function biasScore(scores: ScoreResult, bias: Bias): number {
  const syn = scores.synergy * 0.1;
  switch (bias) {
    case "art":        return scores.art * 2 + syn;
    case "commercial": return scores.com * 2 + syn;
    case "balanced":   return scores.art + scores.com + syn;
    case "pollux":     return scores.pollux + scores.synergy * 0.1;
  }
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

// ── Suggestion generation ─────────────────────────────────────────────────────

export function generateSuggestions(
  pool: UnlockedPool,
  opts: SuggestionOpts
): ScriptCombo[] {
  const { genreFilter, bias, themeEventCount } = opts;

  const genrePool = genreFilter
    ? pool.genres.filter((g) => g.id === genreFilter)
    : pool.genres;

  if (
    genrePool.length === 0 ||
    pool.settings.length === 0 ||
    pool.protagonists.length === 0 ||
    pool.supportingChars.length === 0 ||
    pool.antagonists.length === 0 ||
    pool.themesEvents.length === 0 ||
    pool.finales.length === 0
  ) {
    return [];
  }

  const candidates: ScriptCombo[] = [];

  for (let i = 0; i < 300; i++) {
    const genre = pick(genrePool);

    // Optionally pick a 2nd genre when the pair modifier is positive
    let genre2: ScriptElement | undefined;
    if (pool.genres.length > 1 && Math.random() < 0.35) {
      const others = pool.genres.filter((g) => g.id !== genre.id);
      const g2 = pick(others);
      const key = `${genre.label}|${g2.label}`;
      const mod = GENRE_PAIR_MODIFIERS[key];
      if (mod && mod.art + mod.com > 0) genre2 = g2;
    }

    const base: Omit<ScriptCombo, "scores"> = {
      genre,
      genre2,
      setting: pick(pool.settings),
      protagonist: pick(pool.protagonists),
      supporting: pick(pool.supportingChars),
      antagonist: pick(pool.antagonists),
      themesEvents: pickN(pool.themesEvents, themeEventCount),
      finale: pick(pool.finales),
    };

    candidates.push({ ...base, scores: scoreCombination(base) });
  }

  candidates.sort(
    (a, b) => biasScore(b.scores, bias) - biasScore(a.scores, bias)
  );

  // Deduplicate: drop combos sharing genre+setting+protagonist
  const seen = new Set<string>();
  const results: ScriptCombo[] = [];
  for (const c of candidates) {
    const key = `${c.genre.id}|${c.setting.id}|${c.protagonist.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push(c);
    }
    if (results.length >= 6) break;
  }

  return results;
}

// ── Lock hint ─────────────────────────────────────────────────────────────────

export function getLockHint(
  element: ScriptElement,
  gameDate: Date,
  recipesPool: string[]
): string | null {
  if (isUnlocked(element, gameDate, recipesPool)) return null;
  const u = element.unlock;
  if (u === "never") return "n/a";
  if (u.startsWith("Recipe")) return "recipe";
  if (u.startsWith("Before ")) return `until ${u.slice(7)}`;
  if (u.startsWith("After ")) return `from ${+u.slice(6) + 1}`;
  const raw = u.startsWith(">=") ? u.slice(2).trim() : u.trim();
  const parts = raw.split("-");
  if (parts.length === 3 && parts[2].length === 4) {
    const d = new Date(+parts[2], +parts[1] - 1, +parts[0]);
    return `from ${d.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  }
  return `from ${raw.slice(0, 4)}`;
}
