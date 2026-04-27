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
  | "setting"
  | "protagonist"
  | "supporting"
  | "antagonist"
  | "themesEvents"
  | "finale";

const BUILDER_SECTION_ORDER: SectionKey[] = [
  "genre", "setting", "protagonist", "supporting", "antagonist", "themesEvents", "finale",
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
  supporting: ScriptElement | null;
  antagonist: ScriptElement | null;
  finale: ScriptElement | null;
};

// ── Element row ───────────────────────────────────────────────────────────────

function ElementRow({
  item, score, selected, disabled, onSelect,
}: {
  item: ScriptElement;
  score: number;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
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
}: {
  label: string;
  isOpen: boolean;
  isComplete: boolean;
  onToggle: () => void;
  children: React.ReactNode;
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
        <div style={{ maxHeight: "220px", overflowY: "auto", paddingBottom: "4px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Theme count constants ─────────────────────────────────────────────────────

const MIN_THEMES = 3;
const MAX_THEMES = 5;

// ── Script builder ────────────────────────────────────────────────────────────

export default function ScriptBuilder({
  pool,
  bias,
  onBiasChange,
  initialCombo,
}: {
  pool: UnlockedPool;
  bias: Bias;
  onBiasChange: (b: Bias) => void;
  initialCombo?: ScriptCombo;
}) {
  const [sel, setSel] = useState<SelState>(() => initialCombo ? {
    genre:       initialCombo.genre,
    genre2:      initialCombo.genre2 ?? null,
    setting:     initialCombo.setting,
    protagonist: initialCombo.protagonist,
    supporting:  initialCombo.supporting,
    antagonist:  initialCombo.antagonist,
    finale:      initialCombo.finale,
  } : {
    genre: null, genre2: null, setting: null,
    protagonist: null, supporting: null, antagonist: null, finale: null,
  });
  const [themes, setThemes] = useState<ScriptElement[]>(() => initialCombo?.themesEvents ?? []);
  const [activeSection, setActiveSection] = useState<SectionKey | null>(initialCombo ? null : "genre");
  const [showGenre2, setShowGenre2] = useState(() => !!(initialCombo?.genre2));
  const [finalCombo, setFinalCombo] = useState<ScriptCombo | null>(null);

  const selectedElements = useMemo(() =>
    [sel.genre, sel.genre2, sel.setting, sel.protagonist, sel.supporting, sel.antagonist, sel.finale, ...themes]
      .filter((e): e is ScriptElement => e !== null),
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
    const rank = (items: ScriptElement[]) =>
      [...items]
        .map(item => {
          const compat = scoreElementCompatibility(item, selectedElements);
          let biasValue: number;
          switch (bias) {
            case "art":        biasValue = item.art; break;
            case "commercial": biasValue = item.com; break;
            case "balanced":   biasValue = (item.art + item.com) * 0.5; break;
            case "pollux":
              biasValue = polluxFactor > 0
                ? polluxFactor * (item.art * 2 + item.com)
                : item.art; // fall back to art weighting before genre is chosen
              break;
          }
          return { item, score: compat + biasValue };
        })
        .sort((a, b) => b.score - a.score);
    return {
      genre:        rank(pool.genres),
      setting:      rank(pool.settings),
      protagonist:  rank(pool.protagonists),
      supporting:   rank(pool.supportingChars),
      antagonist:   rank(pool.antagonists),
      themesEvents: rank(pool.themesEvents),
      finale:       rank(pool.finales),
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

  // Precompute theme IDs as a Set to avoid O(pool × themes) in the filter
  const themeIds = useMemo(() => new Set(themes.map(t => t.id)), [themes]);

  const isComplete = !!(
    sel.genre && sel.setting && sel.protagonist &&
    sel.supporting && sel.antagonist && sel.finale && themes.length >= MIN_THEMES
  );
  const hasSelection = selectedElements.length > 0;

  function selectSingle(key: Exclude<SectionKey, "themesEvents">, item: ScriptElement) {
    const newSel = { ...sel, [key]: item };
    setSel(newSel);
    const idx = BUILDER_SECTION_ORDER.indexOf(key);
    for (let i = idx + 1; i < BUILDER_SECTION_ORDER.length; i++) {
      const next = BUILDER_SECTION_ORDER[i];
      const isEmpty =
        next === "themesEvents"
          ? themes.length < MIN_THEMES
          : newSel[next as keyof SelState] === null;
      if (isEmpty) { setActiveSection(next); return; }
    }
    setActiveSection(null);
  }

  function toggleTheme(item: ScriptElement) {
    setThemes(prev => {
      if (prev.find(t => t.id === item.id)) return prev.filter(t => t.id !== item.id);
      if (prev.length >= MAX_THEMES) return prev;
      return [...prev, item];
    });
  }

  function handleComplete() {
    if (isComplete) {
      const combo = {
        genre: sel.genre!, genre2: sel.genre2 ?? undefined,
        setting: sel.setting!, protagonist: sel.protagonist!,
        supporting: sel.supporting!, antagonist: sel.antagonist!,
        finale: sel.finale!, themesEvents: themes,
      };
      setFinalCombo({ ...combo, scores: scoreCombination(combo) });
      return;
    }
    const suggestions = generateSuggestions(pool, {
      genreFilter: sel.genre?.id ?? null,
      bias,
      themeEventCount: Math.max(MIN_THEMES, themes.length),
    });
    if (!suggestions.length) return;
    const base = suggestions[0];
    const merged = {
      genre:       sel.genre       ?? base.genre,
      genre2:      sel.genre2      ?? base.genre2,
      setting:     sel.setting     ?? base.setting,
      protagonist: sel.protagonist ?? base.protagonist,
      supporting:  sel.supporting  ?? base.supporting,
      antagonist:  sel.antagonist  ?? base.antagonist,
      finale:      sel.finale      ?? base.finale,
      themesEvents: themes.length >= MIN_THEMES ? themes : base.themesEvents,
    };
    setFinalCombo({ ...merged, scores: scoreCombination(merged) });
  }

  function startOver() {
    setSel({ genre: null, genre2: null, setting: null, protagonist: null, supporting: null, antagonist: null, finale: null });
    setThemes([]);
    setActiveSection("genre");
    setShowGenre2(false);
    setFinalCombo(null);
    onBiasChange("balanced");
  }

  const sectionLabel: Record<SectionKey, string> = {
    genre:        sel.genre       ? `Genre — ${sel.genre.label}`            : "Genre",
    setting:      sel.setting     ? `Setting — ${sel.setting.label}`         : "Setting",
    protagonist:  sel.protagonist ? `Protagonist — ${sel.protagonist.label}` : "Protagonist",
    supporting:   sel.supporting  ? `Supporting — ${sel.supporting.label}`   : "Supporting Character",
    antagonist:   sel.antagonist  ? `Antagonist — ${sel.antagonist.label}`   : "Antagonist",
    themesEvents: themes.length > 0 ? `Themes / Events — ${themes.length} / ${MAX_THEMES}` : "Themes / Events",
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
        {BUILDER_SECTION_ORDER.map((key) => {
          const isThemes = key === "themesEvents";
          const isDone = isThemes ? themes.length >= MIN_THEMES : sel[key as keyof SelState] !== null;
          const rankedList = ranked[key as keyof typeof ranked];

          return (
            <CategorySection
              key={key}
              label={sectionLabel[key]}
              isOpen={activeSection === key}
              isComplete={isDone}
              onToggle={() => setActiveSection(prev => prev === key ? null : key)}
            >
              {isThemes ? (
                <>
                  {themes.map(t => (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "5px 12px",
                        borderLeft: "2px solid var(--color-gold)",
                      }}
                    >
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7ec8a0", flexShrink: 0, marginRight: "10px" }} />
                      <span style={{ fontFamily: "var(--font-ui)", fontSize: "11px", flex: 1, color: "var(--color-gold)" }}>
                        {t.label}
                      </span>
                      <button
                        onClick={() => toggleTheme(t)}
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "12px",
                          color: "var(--color-text-muted)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "0 4px",
                          lineHeight: 1,
                        }}
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
                        disabled={themes.length >= MAX_THEMES}
                        onSelect={() => toggleTheme(item)}
                      />
                    ))}
                </>
              ) : (
                rankedList.map(({ item, score }) => (
                  <ElementRow
                    key={item.id}
                    item={item}
                    score={score}
                    selected={sel[key as keyof SelState]?.id === item.id}
                    onSelect={() => selectSingle(key as Exclude<SectionKey, "themesEvents">, item)}
                  />
                ))
              )}
            </CategorySection>
          );
        })}
      </div>

      {/* Genre2 picker */}
      {sel.genre && (
        <div style={{ marginBottom: "16px" }}>
          {!showGenre2 ? (
            <button
              onClick={() => setShowGenre2(true)}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                color: "var(--color-text-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                letterSpacing: "0.04em",
              }}
            >
              + Add second genre
            </button>
          ) : (
            <div
              style={{
                border: "1px solid var(--color-border-subtle)",
                background: "var(--color-bg-panel)",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "10px",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Second Genre
                  {sel.genre2 && (
                    <span style={{ color: "var(--color-gold)", marginLeft: "6px" }}>— {sel.genre2.label}</span>
                  )}
                </span>
                <button
                  onClick={() => { setShowGenre2(false); setSel(prev => ({ ...prev, genre2: null })); }}
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "10px",
                    color: "var(--color-text-muted)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {rankedGenre2.map(({ item, artMod, comMod }) => {
                  const total = artMod + comMod;
                  const isSelected = sel.genre2?.id === item.id;
                  const modColor = total > 0.01 ? "#7ec8a0" : total < -0.01 ? "#d47a7a" : "var(--color-text-muted)";
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSel(prev => ({ ...prev, genre2: isSelected ? null : item }))}
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "10px",
                        padding: "4px 10px",
                        border: `1px solid ${isSelected ? "var(--color-gold)" : "var(--color-border)"}`,
                        background: isSelected ? "rgba(184,156,84,0.09)" : "transparent",
                        color: isSelected ? "var(--color-gold)" : "var(--color-text-secondary)",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.label}
                      {Math.abs(total) > 0.01 && (
                        <span style={{ marginLeft: "6px", fontSize: "9px", color: modColor }}>
                          {total > 0 ? "+" : ""}{total.toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

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
