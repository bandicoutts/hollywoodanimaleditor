"use client";

import { useState, useMemo } from "react";
import PillButton from "./PillButton";
import ScoreBadge from "./ScoreBadge";
import ScriptCard from "./ScriptCard";
import {
  generateSuggestions,
  scoreCombination,
  scoreElementCompatibility,
  scorePartialBuild,
  type ScriptCombo,
  type Bias,
  type UnlockedPool,
} from "@/lib/script-suggestions";
import { GENRE_PAIR_MODIFIERS, POLLUX_GENRE_FACTORS, type ScriptElement } from "@/data/scriptElements";

const POLLUX_TOOLTIP = "Pollux Award score — the game's prestige prize for artistic films";

// ── Types ─────────────────────────────────────────────────────────────────────

type SectionKey =
  | "genre"
  | "genre2"
  | "setting"
  | "protagonist"
  | "supporting"
  | "antagonist"
  | "themesEvents"
  | "finale";

const BUILDER_SECTION_ORDER: SectionKey[] = [
  "genre", "genre2", "setting", "protagonist", "supporting", "antagonist", "themesEvents", "finale",
];

const BIAS_OPTIONS: { value: Bias; label: string }[] = [
  { value: "art",        label: "Art"        },
  { value: "balanced",   label: "Balanced"   },
  { value: "commercial", label: "Commercial" },
  { value: "pollux",     label: "Pollux"     },
];

type SelState = {
  genre: ScriptElement | null;
  genre2: ScriptElement | null;
  setting: ScriptElement | null;
  protagonist: ScriptElement | null;
  supporting: ScriptElement[];
  antagonist: ScriptElement | null;
  finale: ScriptElement | null;
};

// ── Element row ───────────────────────────────────────────────────────────────

function BanLabel({ pending }: { pending?: boolean }) {
  return (
    <span style={{ fontFamily: "var(--font-ui)", fontSize: "9px", color: pending ? "#a07830" : "#a05050" }}>
      {pending ? "pending ban" : "banned"}
    </span>
  );
}

function ElementRow({
  item, score, selected, disabled, onSelect, banned, pending,
}: {
  item: ScriptElement;
  score: number;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  banned?: boolean;
  pending?: boolean;
}) {
  const dotColor = score >= 1.0 ? "#7ec8a0" : score > 0 ? "var(--color-gold)" : "transparent";
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "5px 12px",
        width: "100%",
        background: selected ? "rgba(184,156,84,0.06)" : "transparent",
        border: "none",
        borderLeft: `2px solid ${selected ? "var(--color-gold)" : "transparent"}`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        textAlign: "left",
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "11px",
          flex: 1,
          color: selected ? "var(--color-gold)" : "var(--color-text-secondary)",
        }}
      >
        {item.label}
      </span>
      {banned && <BanLabel />}
      {!banned && pending && <BanLabel pending />}
      {score > 0 && (
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "9px", color: "var(--color-text-muted)" }}>
          +{score.toFixed(1)}
        </span>
      )}
    </button>
  );
}

// ── Category section ──────────────────────────────────────────────────────────

function CategorySection({
  label,
  isOpen,
  isComplete: done,
  onToggle,
  children,
  footer,
}: {
  label: string;
  isOpen: boolean;
  isComplete: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          padding: "9px 12px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            flexShrink: 0,
            background: done ? "#7ec8a0" : "var(--color-border)",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            flex: 1,
            color: done ? "var(--color-text-secondary)" : "var(--color-text-muted)",
          }}
        >
          {label}
        </span>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "9px", color: "var(--color-text-muted)" }}>
          {isOpen ? "▲" : "▼"}
        </span>
      </button>
      {isOpen && (
        <>
          <div style={{ maxHeight: "220px", overflowY: "auto", paddingBottom: "4px" }}>
            {children}
          </div>
          {footer}
        </>
      )}
    </div>
  );
}

// ── Content tag constants ─────────────────────────────────────────────────────

const MIN_CONTENT_TAGS = 3;
// Protagonist + finale always occupy 2 content tag slots in the game's contentIds array
const FIXED_CONTENT_TAGS = 2;

// ── Script builder ────────────────────────────────────────────────────────────

export default function ScriptBuilder({
  pool,
  bias,
  onBiasChange,
  initialCombo,
  bannedIds,
  pendingBannedIds,
}: {
  pool: UnlockedPool;
  bias: Bias;
  onBiasChange: (b: Bias) => void;
  initialCombo?: ScriptCombo;
  bannedIds?: Set<string>;
  pendingBannedIds?: Set<string>;
}) {
  const [sel, setSel] = useState<SelState>(() => initialCombo ? {
    genre:       initialCombo.genre,
    genre2:      initialCombo.genre2 ?? null,
    setting:     initialCombo.setting,
    protagonist: initialCombo.protagonist,
    supporting:  initialCombo.supporting,
    antagonist:  initialCombo.antagonist ?? null,
    finale:      initialCombo.finale,
  } : {
    genre: null, genre2: null, setting: null,
    protagonist: null, supporting: [], antagonist: null, finale: null,
  });
  const [themes, setThemes] = useState<ScriptElement[]>(() => initialCombo?.themesEvents ?? []);
  const [activeSection, setActiveSection] = useState<SectionKey | null>(initialCombo ? null : "genre");
  const [finalCombo, setFinalCombo] = useState<ScriptCombo | null>(null);

  function isBanned(id: string) { return bannedIds?.has(id) ?? false; }
  function isPending(id: string) { return !isBanned(id) && (pendingBannedIds?.has(id) ?? false); }

  const selectedElements = useMemo(() =>
    [sel.genre, sel.genre2, sel.setting, sel.protagonist, ...sel.supporting, sel.antagonist, sel.finale, ...themes]
      .filter((e): e is ScriptElement => e !== null && e !== undefined),
    [sel, themes]
  );

  // Stable string key — ranked only recomputes when the selected IDs actually change
  const selectedKey = useMemo(
    () => selectedElements.map(e => e.id).sort().join("|"),
    [selectedElements]
  );

  const genreId = sel.genre?.id;

  const ranked = useMemo(() => {
    const polluxFactor = genreId ? (POLLUX_GENRE_FACTORS[genreId] ?? 0) : 0;

    const biasFor = (item: ScriptElement, isGenre: boolean): number => {
      switch (bias) {
        // Weights match biasScore() in script-suggestions.ts:
        // art×2, com×2, balanced = art+com, pollux = genreFactor×(art×2+com)
        case "art":        return item.art * 2;
        case "commercial": return item.com * 2;
        case "balanced":   return item.art + item.com;
        case "pollux":
          if (isGenre) {
            // Before a genre is chosen, rank genres by their Pollux eligibility factor
            return POLLUX_GENRE_FACTORS[item.id] ?? 0;
          }
          // After genre chosen, weight element by genre_factor × (art×2 + com)
          return polluxFactor > 0
            ? polluxFactor * (item.art * 2 + item.com)
            : item.art * 2;
      }
    };

    // Exclude the currently-selected item for each single-select category so scores
    // reflect "swap to this" compatibility rather than including the old selection.
    const rank = (items: ScriptElement[], isGenre = false, excludeId?: string) => {
      const ctx = excludeId
        ? selectedElements.filter(e => e.id !== excludeId)
        : selectedElements;
      return [...items]
        .map(item => ({
          item,
          score: scoreElementCompatibility(item, ctx) + biasFor(item, isGenre),
        }))
        .sort((a, b) => b.score - a.score);
    };

    return {
      genre:        rank(pool.genres, true,  sel.genre?.id),
      setting:      rank(pool.settings, false, sel.setting?.id),
      protagonist:  rank(pool.protagonists, false, sel.protagonist?.id),
      supporting:   rank(pool.supportingChars), // multi-select: no single exclusion
      antagonist:   rank(pool.antagonists, false, sel.antagonist?.id),
      themesEvents: rank(pool.themesEvents),    // multi-select: no exclusion
      finale:       rank(pool.finales, false,  sel.finale?.id),
    };
    // selectedElements used inside but selectedKey is the stable equality signal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, pool, bias, genreId]);

  const rankedGenre2 = useMemo(() => {
    if (!sel.genre) return [];
    return pool.genres
      .filter(g => g.id !== sel.genre!.id)
      .map(g => {
        const mod = GENRE_PAIR_MODIFIERS[`${sel.genre!.label}|${g.label}`];
        return { item: g, artMod: mod?.art ?? 0, comMod: mod?.com ?? 0 };
      })
      .sort((a, b) => (b.artMod + b.comMod) - (a.artMod + a.comMod));
  }, [sel.genre, pool.genres]);

  const partialScore = useMemo(() =>
    selectedElements.length >= 2 ? scorePartialBuild(selectedElements) : null,
    [selectedElements]
  );

  const polluxPartial = useMemo(() => {
    if (!sel.genre || selectedElements.length < 1) return null;
    const factor = POLLUX_GENRE_FACTORS[sel.genre.id] ?? 0;
    if (factor === 0) return null;
    let art = 0, com = 0;
    for (const e of selectedElements) { art += e.art; com += e.com; }
    return factor * (art * 2 + com);
  }, [selectedElements, sel.genre]);

  // Precompute theme/supporting IDs as Sets to avoid O(pool × selected) in filters
  const themeIds = useMemo(() => new Set(themes.map(t => t.id)), [themes]);
  const supportingIds = useMemo(() => new Set(sel.supporting.map(s => s.id)), [sel.supporting]);

  // Genre2 section only appears when ≥2 genres are unlocked
  const sectionOrder = useMemo(
    () => pool.genres.length > 1 ? BUILDER_SECTION_ORDER : BUILDER_SECTION_ORDER.filter(k => k !== "genre2"),
    [pool.genres.length]
  );

  // Content tag budget: protagonist + supporting[] + antagonist + themes/events + finale
  // must all fit within budget (base 5, up to 10 with TAGS_SLOTS_N perks).
  const charCount = sel.supporting.length + (sel.antagonist ? 1 : 0);
  const contentTagBudget = pool.contentTagBudget;
  const contentTagsUsed = themes.length + charCount + FIXED_CONTENT_TAGS;
  const maxThemes = contentTagBudget - charCount - FIXED_CONTENT_TAGS;

  const isComplete = !!(
    sel.genre && sel.setting && sel.protagonist &&
    sel.finale && contentTagsUsed >= MIN_CONTENT_TAGS
  );
  const hasSelection = selectedElements.length > 0;

  function selectSingle(key: Exclude<SectionKey, "themesEvents" | "supporting">, item: ScriptElement) {
    let newSel = { ...sel, [key]: item };
    // Changing primary genre invalidates any current second genre
    if (key === "genre") newSel = { ...newSel, genre2: null };
    setSel(newSel);
    // Selecting antagonist may reduce available theme slots — trim to stay in budget
    if (key === "antagonist") {
      const newCharCount = sel.supporting.length + (newSel.antagonist ? 1 : 0);
      const maxAllowedThemes = contentTagBudget - newCharCount - FIXED_CONTENT_TAGS;
      if (themes.length > maxAllowedThemes) {
        setThemes(prev => prev.slice(0, maxAllowedThemes));
      }
    }
    const idx = sectionOrder.indexOf(key);
    for (let i = idx + 1; i < sectionOrder.length; i++) {
      const next = sectionOrder[i];
      const isEmpty =
        next === "themesEvents"
          ? contentTagsUsed < MIN_CONTENT_TAGS
          : next === "supporting"
            ? newSel.supporting.length === 0
            : newSel[next as keyof SelState] === null;
      if (isEmpty) { setActiveSection(next); return; }
    }
    setActiveSection(null);
  }

  function toggleTheme(item: ScriptElement) {
    setThemes(prev => {
      if (prev.find(t => t.id === item.id)) return prev.filter(t => t.id !== item.id);
      if (prev.length + charCount + FIXED_CONTENT_TAGS >= contentTagBudget) return prev;
      return [...prev, item];
    });
  }

  function toggleSupporting(item: ScriptElement) {
    const already = sel.supporting.find(s => s.id === item.id);
    if (already) {
      setSel(prev => ({ ...prev, supporting: prev.supporting.filter(s => s.id !== item.id) }));
      return;
    }
    const newCharCount = sel.supporting.length + 1 + (sel.antagonist ? 1 : 0);
    const maxAllowedThemes = contentTagBudget - newCharCount - FIXED_CONTENT_TAGS;
    if (maxAllowedThemes < 0) return; // no budget remaining
    setSel(prev => ({ ...prev, supporting: [...prev.supporting, item] }));
    if (themes.length > maxAllowedThemes) {
      setThemes(prev => prev.slice(0, maxAllowedThemes));
    }
  }

  function skipSection(key: SectionKey) {
    const idx = sectionOrder.indexOf(key);
    for (let i = idx + 1; i < sectionOrder.length; i++) {
      const next = sectionOrder[i];
      const isEmpty =
        next === "themesEvents" ? contentTagsUsed < MIN_CONTENT_TAGS
        : next === "supporting" ? sel.supporting.length === 0
        : sel[next as keyof SelState] === null;
      if (isEmpty) { setActiveSection(next); return; }
    }
    setActiveSection(null);
  }

  function handleComplete() {
    if (isComplete) {
      const combo = {
        genre: sel.genre!, genre2: sel.genre2 ?? undefined,
        setting: sel.setting!, protagonist: sel.protagonist!,
        supporting: sel.supporting,
        antagonist: sel.antagonist ?? undefined,
        finale: sel.finale!, themesEvents: themes,
      };
      setFinalCombo({ ...combo, scores: scoreCombination(combo) });
      return;
    }
    const suggestions = generateSuggestions(pool, {
      genreFilter: sel.genre?.id ?? null,
      bias,
      themeEventCount: Math.max(1, themes.length),
    });
    if (!suggestions.length) return;
    const base = suggestions[0];
    const merged = {
      genre:       sel.genre       ?? base.genre,
      genre2:      sel.genre2      ?? base.genre2,
      setting:     sel.setting     ?? base.setting,
      protagonist: sel.protagonist ?? base.protagonist,
      supporting:  sel.supporting.length > 0 ? sel.supporting : base.supporting,
      antagonist:  sel.antagonist  ?? base.antagonist,
      finale:      sel.finale      ?? base.finale,
      themesEvents: themes.length > 0 ? themes : base.themesEvents,
    };
    setFinalCombo({ ...merged, scores: scoreCombination(merged) });
  }

  function startOver() {
    setSel({ genre: null, genre2: null, setting: null, protagonist: null, supporting: [], antagonist: null, finale: null });
    setThemes([]);
    setActiveSection("genre");
    setFinalCombo(null);
    onBiasChange("balanced");
  }

  const sectionLabel: Record<SectionKey, string> = {
    genre:        sel.genre       ? `Genre — ${sel.genre.label}`            : "Genre",
    genre2:       sel.genre2      ? `Second Genre — ${sel.genre2.label}`    : "Second Genre (optional)",
    setting:      sel.setting     ? `Setting — ${sel.setting.label}`         : "Setting",
    protagonist:  sel.protagonist ? `Protagonist — ${sel.protagonist.label}` : "Protagonist",
    supporting:   sel.supporting.length > 0
      ? `Supporting — ${sel.supporting.map(s => s.label).join(", ")}`
      : "Supporting Character (optional)",
    antagonist:   sel.antagonist  ? `Antagonist — ${sel.antagonist.label}`   : "Antagonist (optional)",
    themesEvents: themes.length > 0 ? `Themes / Events — ${themes.length} / ${maxThemes}` : "Themes / Events",
    finale:       sel.finale      ? `Finale — ${sel.finale.label}`           : "Finale",
  };

  return (
    <div>
      {/* Optimise for — shown first so bias guides all element picks */}
      <div style={{ marginBottom: "16px" }}>
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
            marginBottom: "8px",
          }}
        >
          Optimise for
        </p>
        <div style={{ display: "flex", gap: "6px" }}>
          {BIAS_OPTIONS.map(({ value, label }) => (
            <PillButton
              key={value}
              active={bias === value}
              onClick={() => onBiasChange(value)}
              title={value === "pollux" ? "Optimise for the Pollux Award — the game's prestige prize for artistic films" : undefined}
            >
              {label}
            </PillButton>
          ))}
        </div>
        {bias === "pollux" && !sel.genre && (
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "10px", color: "var(--color-text-muted)", marginTop: "8px", fontStyle: "italic" }}>
            Select a genre first — Pollux eligibility depends on genre
          </p>
        )}
      </div>

      {/* Running score */}
      {partialScore && (
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: "16px",
            padding: "8px 12px",
            background: "var(--color-bg-panel)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "9px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginRight: "4px",
            }}
          >
            Running
          </span>
          <ScoreBadge label="Art" value={partialScore.art} color="#7ec8a0" />
          <ScoreBadge label="Com" value={partialScore.com} color="#7ab4d4" />
          {partialScore.synergy > 0 && (
            <ScoreBadge label="Compat" value={partialScore.synergy} color="var(--color-gold)" />
          )}
          {polluxPartial !== null && (
            <ScoreBadge label="Pol" value={polluxPartial} color="#b8a0d4" title={POLLUX_TOOLTIP} />
          )}
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "11px",
              fontWeight: 600,
              color: contentTagsUsed >= contentTagBudget
                ? "var(--color-text-muted)"
                : "var(--color-text-secondary)",
              marginLeft: "4px",
            }}
          >
            {contentTagBudget - (themes.length + charCount + (sel.protagonist ? 1 : 0) + (sel.finale ? 1 : 0))}/{contentTagBudget}
          </span>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "9px",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
            }}
          >
            slots left
          </span>
        </div>
      )}

      {/* Accordion */}
      <div
        style={{
          border: "1px solid var(--color-border)",
          background: "var(--color-bg-panel)",
          marginBottom: "16px",
        }}
      >
        {sectionOrder.map((key) => {
          const isThemes = key === "themesEvents";
          const isSupporting = key === "supporting";
          const isGenre2 = key === "genre2";
          const isDone = isThemes
            ? contentTagsUsed >= MIN_CONTENT_TAGS
            : isSupporting
              ? sel.supporting.length > 0
              : sel[key as keyof SelState] !== null;
          const rankedList = isGenre2 ? [] : ranked[key as keyof typeof ranked];

          let sectionBody: React.ReactNode;
          if (isGenre2) {
            sectionBody = !sel.genre ? (
              <p style={{ padding: "6px 12px 8px", fontFamily: "var(--font-ui)", fontSize: "10px", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                Select a genre first
              </p>
            ) : (
              <>
                <div style={{ padding: "6px 12px 6px", borderBottom: "1px solid var(--color-border-subtle)" }}>
                  <button
                    onClick={() => skipSection("genre2")}
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "10px",
                      letterSpacing: "0.04em",
                      color: "var(--color-text-muted)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Skip →
                  </button>
                </div>
                {rankedGenre2.map(({ item, artMod, comMod }) => {
                  const total = artMod + comMod;
                  const isSelected = sel.genre2?.id === item.id;
                  const modColor = total > 0.01 ? "#7ec8a0" : total < -0.01 ? "#d47a7a" : "var(--color-text-muted)";
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (isSelected) {
                          setSel(prev => ({ ...prev, genre2: null }));
                        } else {
                          selectSingle("genre2", item);
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "5px 12px",
                        width: "100%",
                        background: isSelected ? "rgba(184,156,84,0.06)" : "transparent",
                        border: "none",
                        borderLeft: `2px solid ${isSelected ? "var(--color-gold)" : "transparent"}`,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "11px",
                        flex: 1,
                        color: isSelected ? "var(--color-gold)" : "var(--color-text-secondary)",
                      }}>
                        {item.label}
                      </span>
                      {isBanned(item.id) && <BanLabel />}
                      {isPending(item.id) && <BanLabel pending />}
                      {Math.abs(total) > 0.01 && (
                        <span style={{ fontFamily: "var(--font-ui)", fontSize: "9px", color: modColor }}>
                          {total > 0 ? "+" : ""}{total.toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </>
            );
          } else if (isThemes) {
            sectionBody = (
              <>
                {themes.map(t => (
                  <div
                    key={t.id}
                    style={{ display: "flex", alignItems: "center", padding: "5px 12px", borderLeft: "2px solid var(--color-gold)" }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7ec8a0", flexShrink: 0, marginRight: "10px" }} />
                    <span style={{ fontFamily: "var(--font-ui)", fontSize: "11px", flex: 1, color: "var(--color-gold)" }}>
                      {t.label}
                    </span>
                    {isBanned(t.id) && <BanLabel />}
                    {isPending(t.id) && <BanLabel pending />}
                    <button
                      onClick={() => toggleTheme(t)}
                      style={{ fontFamily: "var(--font-ui)", fontSize: "12px", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {rankedList
                  .filter(({ item }) => !themeIds.has(item.id))
                  .map(({ item, score }) => (
                    <ElementRow
                      key={item.id}
                      item={item}
                      score={score}
                      selected={false}
                      disabled={contentTagsUsed >= contentTagBudget}
                      onSelect={() => toggleTheme(item)}
                      banned={isBanned(item.id)}
                      pending={isPending(item.id)}
                    />
                  ))}
              </>
            );
          } else if (isSupporting) {
            sectionBody = (
              <>
                <div style={{ padding: "6px 12px 6px", borderBottom: "1px solid var(--color-border-subtle)" }}>
                  <button
                    onClick={() => skipSection("supporting")}
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "10px",
                      letterSpacing: "0.04em",
                      color: "var(--color-text-muted)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Skip →
                  </button>
                </div>
                {sel.supporting.map(s => (
                  <div
                    key={s.id}
                    style={{ display: "flex", alignItems: "center", padding: "5px 12px", borderLeft: "2px solid var(--color-gold)" }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7ec8a0", flexShrink: 0, marginRight: "10px" }} />
                    <span style={{ fontFamily: "var(--font-ui)", fontSize: "11px", flex: 1, color: "var(--color-gold)" }}>
                      {s.label}
                    </span>
                    {isBanned(s.id) && <BanLabel />}
                    {isPending(s.id) && <BanLabel pending />}
                    <button
                      onClick={() => toggleSupporting(s)}
                      style={{ fontFamily: "var(--font-ui)", fontSize: "12px", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {rankedList
                  .filter(({ item }) => !supportingIds.has(item.id))
                  .map(({ item, score }) => (
                    <ElementRow
                      key={item.id}
                      item={item}
                      score={score}
                      selected={false}
                      disabled={contentTagsUsed >= contentTagBudget}
                      onSelect={() => toggleSupporting(item)}
                      banned={isBanned(item.id)}
                      pending={isPending(item.id)}
                    />
                  ))}
              </>
            );
          } else {
            const isAntagonist = key === "antagonist";
            const rows = rankedList.map(({ item, score }) => {
              const wouldAddNewChar = isAntagonist && sel.antagonist === null;
              const disabled = wouldAddNewChar && contentTagsUsed >= contentTagBudget;
              return (
                <ElementRow
                  key={item.id}
                  item={item}
                  score={score}
                  selected={(sel[key as keyof SelState] as ScriptElement | null)?.id === item.id}
                  disabled={disabled}
                  onSelect={() => selectSingle(key as Exclude<SectionKey, "themesEvents" | "supporting">, item)}
                  banned={isBanned(item.id)}
                  pending={isPending(item.id)}
                />
              );
            });
            sectionBody = isAntagonist ? (
              <>
                <div style={{ padding: "6px 12px 6px", borderBottom: "1px solid var(--color-border-subtle)" }}>
                  <button
                    onClick={() => skipSection("antagonist")}
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "10px",
                      letterSpacing: "0.04em",
                      color: "var(--color-text-muted)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Skip →
                  </button>
                </div>
                {rows}
              </>
            ) : rows;
          }

          return (
            <CategorySection
              key={key}
              label={sectionLabel[key]}
              isOpen={activeSection === key}
              isComplete={isDone}
              onToggle={() => setActiveSection(prev => prev === key ? null : key)}
            >
              {sectionBody}
            </CategorySection>
          );
        })}
      </div>

      {/* Complete / Auto-complete */}
      {hasSelection && !finalCombo && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <button
            onClick={handleComplete}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-gold)",
              background: "transparent",
              border: "1px solid var(--color-gold)",
              padding: "10px 24px",
              cursor: "pointer",
            }}
          >
            {isComplete ? "Complete Script" : "Auto-complete Script"}
          </button>
          {!isComplete && (
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "10px", color: "var(--color-text-muted)" }}>
              Fills remaining slots with best-scoring choices
            </span>
          )}
        </div>
      )}

      {/* Result card */}
      {finalCombo && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
              }}
            >
              Your Script
            </span>
            <button
              onClick={startOver}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                color: "var(--color-text-muted)",
                background: "none",
                border: "1px solid var(--color-border)",
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              Start Over
            </button>
          </div>
          <ScriptCard combo={finalCombo} index={0} />
        </div>
      )}
    </div>
  );
}
