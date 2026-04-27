"use client";

import { useState, useMemo } from "react";
import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";
import {
  getUnlockedPool,
  generateSuggestions,
  scoreCombination,
  scoreElementCompatibility,
  scorePartialBuild,
  type ScriptCombo,
  type Bias,
  type UnlockedPool,
} from "@/lib/script-suggestions";
import { GENRE_PAIR_MODIFIERS, type ScriptElement } from "@/data/scriptElements";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(2);
}

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "10px",
        letterSpacing: "0.06em",
        color,
        border: `1px solid ${color}55`,
        padding: "2px 7px",
        whiteSpace: "nowrap",
      }}
    >
      {label} {fmt(value)}
    </span>
  );
}

// ── Element chip ──────────────────────────────────────────────────────────────

function Chip({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "10px",
        letterSpacing: "0.04em",
        color: muted ? "var(--color-text-muted)" : "var(--color-text-secondary)",
        background: "var(--color-bg-panel)",
        border: "1px solid var(--color-border-subtle)",
        padding: "2px 8px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

// ── Script idea card ──────────────────────────────────────────────────────────

function ScriptCard({ combo, index }: { combo: ScriptCombo; index: number }) {
  const { genre, genre2, setting, protagonist, supporting, antagonist, themesEvents, finale, scores } = combo;

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        background: "var(--color-bg-panel)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "9px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
            minWidth: "20px",
            paddingTop: "2px",
            flexShrink: 0,
          }}
        >
          #{index + 1}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "var(--color-gold)",
            }}
          >
            {genre.label}
            {genre2 && <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}> / {genre2.label}</span>}
          </span>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              color: "var(--color-text-muted)",
              letterSpacing: "0.04em",
            }}
          >
            {setting.label}
          </span>
        </div>
      </div>

      {/* Score badges */}
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
        <ScoreBadge label="Art" value={scores.art} color="#7ec8a0" />
        <ScoreBadge label="Com" value={scores.com} color="#7ab4d4" />
        {scores.synergy > 0 && (
          <ScoreBadge label="Compat" value={scores.synergy} color="var(--color-gold)" />
        )}
        {scores.pollux > 0 && (
          <ScoreBadge label="Pol" value={scores.pollux} color="#b8a0d4" />
        )}
      </div>

      {/* Cast row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginRight: "2px" }}>Cast</span>
        <Chip label={protagonist.label} />
        <Chip label={supporting.label} />
        <Chip label={antagonist.label} />
      </div>

      {/* Themes & events */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginRight: "2px" }}>Story</span>
        {themesEvents.map((te) => (
          <Chip key={te.id} label={te.label} />
        ))}
      </div>

      {/* Finale */}
      <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginRight: "2px" }}>End</span>
        <Chip label={finale.label} />
      </div>
    </div>
  );
}

// ── Controls ──────────────────────────────────────────────────────────────────

const BIAS_OPTIONS: { value: Bias; label: string }[] = [
  { value: "art",        label: "Art"        },
  { value: "balanced",   label: "Balanced"   },
  { value: "commercial", label: "Commercial" },
  { value: "pollux",     label: "Pollux"     },
];

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "11px",
        letterSpacing: "0.06em",
        padding: "5px 12px",
        border: `1px solid ${active ? "var(--color-gold)" : "var(--color-border)"}`,
        background: active ? "var(--color-gold)18" : "transparent",
        color: active ? "var(--color-gold)" : "var(--color-text-muted)",
        cursor: "pointer",
        transition: "all 0.12s ease",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

// ── Builder: element row ──────────────────────────────────────────────────────

type SectionKey = "genre" | "setting" | "protagonist" | "supporting" | "antagonist" | "themesEvents" | "finale";
const BUILDER_SECTION_ORDER: SectionKey[] = ["genre", "setting", "protagonist", "supporting", "antagonist", "themesEvents", "finale"];

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

// ── Builder: category section ─────────────────────────────────────────────────

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

// ── Builder ───────────────────────────────────────────────────────────────────

type SelState = {
  genre: ScriptElement | null;
  genre2: ScriptElement | null;
  setting: ScriptElement | null;
  protagonist: ScriptElement | null;
  supporting: ScriptElement | null;
  antagonist: ScriptElement | null;
  finale: ScriptElement | null;
};

function ScriptBuilder({ pool }: { pool: UnlockedPool }) {
  const [sel, setSel] = useState<SelState>({
    genre: null, genre2: null, setting: null,
    protagonist: null, supporting: null, antagonist: null, finale: null,
  });
  const [themes, setThemes] = useState<ScriptElement[]>([]);
  const [activeSection, setActiveSection] = useState<SectionKey | null>("genre");
  const [showGenre2, setShowGenre2] = useState(false);
  const [finalCombo, setFinalCombo] = useState<ScriptCombo | null>(null);
  const [bias, setBias] = useState<Bias>("balanced");

  const selectedElements = useMemo(() =>
    [sel.genre, sel.genre2, sel.setting, sel.protagonist, sel.supporting, sel.antagonist, sel.finale, ...themes]
      .filter((e): e is ScriptElement => e !== null),
    [sel, themes]
  );

  const ranked = useMemo(() => {
    const rank = (items: ScriptElement[]) =>
      [...items]
        .map(item => ({ item, score: scoreElementCompatibility(item, selectedElements) }))
        .sort((a, b) => b.score - a.score);
    return {
      genre: rank(pool.genres),
      setting: rank(pool.settings),
      protagonist: rank(pool.protagonists),
      supporting: rank(pool.supportingChars),
      antagonist: rank(pool.antagonists),
      themesEvents: rank(pool.themesEvents),
      finale: rank(pool.finales),
    };
  }, [selectedElements, pool]);

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

  const isComplete = !!(
    sel.genre && sel.setting && sel.protagonist &&
    sel.supporting && sel.antagonist && sel.finale && themes.length >= 3
  );
  const hasSelection = selectedElements.length > 0;

  function selectSingle(key: Exclude<SectionKey, "themesEvents">, item: ScriptElement) {
    const newSel = { ...sel, [key]: item };
    setSel(newSel);
    // Auto-advance to next incomplete section
    const idx = BUILDER_SECTION_ORDER.indexOf(key);
    for (let i = idx + 1; i < BUILDER_SECTION_ORDER.length; i++) {
      const next = BUILDER_SECTION_ORDER[i];
      const isEmpty =
        next === "themesEvents"
          ? themes.length < 3
          : newSel[next as keyof SelState] === null;
      if (isEmpty) { setActiveSection(next); return; }
    }
    setActiveSection(null);
  }

  function toggleTheme(item: ScriptElement) {
    setThemes(prev => {
      if (prev.find(t => t.id === item.id)) return prev.filter(t => t.id !== item.id);
      if (prev.length >= 5) return prev;
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
      themeEventCount: Math.max(3, themes.length),
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
      themesEvents: themes.length >= 3 ? themes : base.themesEvents,
    };
    setFinalCombo({ ...merged, scores: scoreCombination(merged) });
  }

  function startOver() {
    setSel({ genre: null, genre2: null, setting: null, protagonist: null, supporting: null, antagonist: null, finale: null });
    setThemes([]);
    setActiveSection("genre");
    setShowGenre2(false);
    setFinalCombo(null);
    setBias("balanced");
  }

  const sectionLabel: Record<SectionKey, string> = {
    genre:       sel.genre       ? `Genre — ${sel.genre.label}`            : "Genre",
    setting:     sel.setting     ? `Setting — ${sel.setting.label}`         : "Setting",
    protagonist: sel.protagonist ? `Protagonist — ${sel.protagonist.label}` : "Protagonist",
    supporting:  sel.supporting  ? `Supporting — ${sel.supporting.label}`   : "Supporting Character",
    antagonist:  sel.antagonist  ? `Antagonist — ${sel.antagonist.label}`   : "Antagonist",
    themesEvents: themes.length > 0 ? `Themes / Events — ${themes.length} / 5` : "Themes / Events",
    finale:      sel.finale      ? `Finale — ${sel.finale.label}`           : "Finale",
  };

  return (
    <div>
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
          {!sel.genre && (
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "9px", color: "var(--color-text-muted)" }}>
              — select a genre to unlock Pollux
            </span>
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
          const isDone = isThemes ? themes.length >= 3 : sel[key as keyof SelState] !== null;
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
                    .filter(({ item }) => !themes.find(t => t.id === item.id))
                    .map(({ item, score }) => (
                      <ElementRow
                        key={item.id}
                        item={item}
                        score={score}
                        selected={false}
                        disabled={themes.length >= 5}
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

      {/* Optimise for */}
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
            <PillButton key={value} active={bias === value} onClick={() => setBias(value)}>
              {label}
            </PillButton>
          ))}
        </div>
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

// ── Main module ───────────────────────────────────────────────────────────────

type Mode = "generate" | "build";

export default function AIScriptsModule() {
  const { isLoaded, saveData } = useSaveFile();

  const [mode, setMode] = useState<Mode>("generate");
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [bias, setBias] = useState<Bias>("balanced");
  const [themeCount, setThemeCount] = useState(3);
  const [results, setResults] = useState<ScriptCombo[]>([]);
  const [generated, setGenerated] = useState(false);

  const pool = useMemo<UnlockedPool | null>(() => {
    if (!isLoaded || !saveData) return null;
    return getUnlockedPool(saveData.stateJson);
  }, [isLoaded, saveData]);

  function generate() {
    if (!pool) return;
    const suggestions = generateSuggestions(pool, { genreFilter, bias, themeEventCount: themeCount });
    setResults(suggestions);
    setGenerated(true);
  }

  // Reset genre filter if it's no longer in the pool (save file changed)
  const genreIds = useMemo(() => new Set(pool?.genres.map((g) => g.id) ?? []), [pool]);
  const activeGenreFilter = genreFilter && genreIds.has(genreFilter) ? genreFilter : null;

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-ui)",
    fontSize: "10px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--color-text-muted)",
    marginBottom: "8px",
  };

  return (
    <ModuleShell
      title="Script Workshop"
      subtitle="Generate script ideas based on your unlocked elements"
      maxWidth={900}
    >
      {!isLoaded ? (
        <div style={{ marginTop: "32px" }}>
          <EmptyState message="Upload a save file to generate script ideas" />
        </div>
      ) : (
        <>
          {/* Mode tabs */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
            <PillButton active={mode === "generate"} onClick={() => setMode("generate")}>
              Generate Ideas
            </PillButton>
            <PillButton active={mode === "build"} onClick={() => setMode("build")}>
              Build Your Script
            </PillButton>
          </div>

          {mode === "generate" ? (
            <>
              {/* Controls */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                {/* Genre filter */}
                <div>
                  <p style={labelStyle}>Genre</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    <PillButton
                      active={activeGenreFilter === null}
                      onClick={() => setGenreFilter(null)}
                    >
                      Any
                    </PillButton>
                    {pool?.genres.map((g) => (
                      <PillButton
                        key={g.id}
                        active={activeGenreFilter === g.id}
                        onClick={() => setGenreFilter(g.id === activeGenreFilter ? null : g.id)}
                      >
                        {g.label}
                      </PillButton>
                    ))}
                  </div>
                </div>

                {/* Bias + theme count */}
                <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
                  <div>
                    <p style={labelStyle}>Optimise for</p>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {BIAS_OPTIONS.map(({ value, label }) => (
                        <PillButton
                          key={value}
                          active={bias === value}
                          onClick={() => setBias(value)}
                        >
                          {label}
                        </PillButton>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p style={labelStyle}>Themes / Events per film</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        onClick={() => setThemeCount((n) => Math.max(3, n - 1))}
                        disabled={themeCount <= 3}
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "14px",
                          width: "28px",
                          height: "28px",
                          border: "1px solid var(--color-border)",
                          background: "transparent",
                          color: themeCount <= 3 ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                          cursor: themeCount <= 3 ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                          minWidth: "16px",
                          textAlign: "center",
                        }}
                      >
                        {themeCount}
                      </span>
                      <button
                        onClick={() => setThemeCount((n) => Math.min(5, n + 1))}
                        disabled={themeCount >= 5}
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "14px",
                          width: "28px",
                          height: "28px",
                          border: "1px solid var(--color-border)",
                          background: "transparent",
                          color: themeCount >= 5 ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                          cursor: themeCount >= 5 ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Generate button */}
                <div>
                  <button
                    onClick={generate}
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
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--color-gold)18";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {generated ? "Generate Again" : "Generate Ideas"}
                  </button>
                </div>
              </div>

              {/* Pool stats */}
              {pool && (
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                    marginBottom: "20px",
                    padding: "8px 12px",
                    background: "var(--color-bg-panel)",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  {[
                    { label: "Genres", count: pool.genres.length },
                    { label: "Settings", count: pool.settings.length },
                    { label: "Protagonists", count: pool.protagonists.length },
                    { label: "Supporting", count: pool.supportingChars.length },
                    { label: "Antagonists", count: pool.antagonists.length },
                    { label: "Themes/Events", count: pool.themesEvents.length },
                    { label: "Finales", count: pool.finales.length },
                  ].map(({ label, count }) => (
                    <div key={label} style={{ display: "flex", gap: "5px", alignItems: "baseline" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {count}
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
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Results */}
              {generated && results.length === 0 && (
                <div style={{ marginTop: "16px" }}>
                  <EmptyState message="No suggestions found — try a different genre or lower the theme count" />
                </div>
              )}

              {results.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {results.map((combo, i) => (
                    <ScriptCard key={i} combo={combo} index={i} />
                  ))}
                </div>
              )}
            </>
          ) : (
            pool ? <ScriptBuilder pool={pool} /> : null
          )}
        </>
      )}
    </ModuleShell>
  );
}
