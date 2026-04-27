"use client";

import { useState, useMemo } from "react";
import ModuleShell, { EmptyState } from "./ModuleShell";
import PillButton from "./PillButton";
import ScriptCard from "./ScriptCard";
import ScriptBuilder from "./ScriptBuilder";
import { useSaveFile } from "@/context/SaveFileContext";
import {
  getUnlockedPool,
  generateSuggestions,
  type ScriptCombo,
  type Bias,
  type UnlockedPool,
} from "@/lib/script-suggestions";
import { LABEL_STYLE } from "@/lib/styles";

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = "generate" | "build";

const BIAS_OPTIONS: { value: Bias; label: string }[] = [
  { value: "art",        label: "Art"        },
  { value: "balanced",   label: "Balanced"   },
  { value: "commercial", label: "Commercial" },
  { value: "pollux",     label: "Pollux"     },
];

const MIN_THEME_COUNT = 3;
const MAX_THEME_COUNT = 5;

// ── Main module ───────────────────────────────────────────────────────────────

export default function AIScriptsModule() {
  const { isLoaded, saveData } = useSaveFile();

  const [mode, setMode] = useState<Mode>("generate");
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [bias, setBias] = useState<Bias>("balanced");
  const [themeCount, setThemeCount] = useState(MIN_THEME_COUNT);
  const [results, setResults] = useState<ScriptCombo[]>([]);
  const [generated, setGenerated] = useState(false);
  const [builderPreload, setBuilderPreload] = useState<ScriptCombo | undefined>(undefined);
  const [builderKey, setBuilderKey] = useState(0);

  function useCombo(combo: ScriptCombo) {
    setBuilderPreload(combo);
    setBuilderKey((k) => k + 1);
    setMode("build");
  }

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

  const genreIds = useMemo(() => new Set(pool?.genres.map((g) => g.id) ?? []), [pool]);
  const activeGenreFilter = genreFilter && genreIds.has(genreFilter) ? genreFilter : null;

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
              Explore Ideas
            </PillButton>
            <PillButton active={mode === "build"} onClick={() => setMode("build")}>
              Refine &amp; Score
            </PillButton>
          </div>

          {mode === "generate" ? (
            <>
              {/* Controls */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                {/* Genre filter */}
                <div>
                  <p style={{ ...LABEL_STYLE, marginBottom: "8px" }}>Genre</p>
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
                    <p style={{ ...LABEL_STYLE, marginBottom: "8px" }}>Optimise for</p>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {BIAS_OPTIONS.map(({ value, label }) => (
                        <PillButton
                          key={value}
                          active={bias === value}
                          onClick={() => setBias(value)}
                          title={value === "pollux" ? "Optimise for the Pollux Award — the game's prestige prize for artistic films" : undefined}
                        >
                          {label}
                        </PillButton>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p style={{ ...LABEL_STYLE, marginBottom: "8px" }}>Themes / Events per film</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        onClick={() => setThemeCount((n) => Math.max(MIN_THEME_COUNT, n - 1))}
                        disabled={themeCount <= MIN_THEME_COUNT}
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "14px",
                          width: "28px",
                          height: "28px",
                          border: "1px solid var(--color-border)",
                          background: "transparent",
                          color: themeCount <= MIN_THEME_COUNT ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                          cursor: themeCount <= MIN_THEME_COUNT ? "not-allowed" : "pointer",
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
                        onClick={() => setThemeCount((n) => Math.min(MAX_THEME_COUNT, n + 1))}
                        disabled={themeCount >= MAX_THEME_COUNT}
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "14px",
                          width: "28px",
                          height: "28px",
                          border: "1px solid var(--color-border)",
                          background: "transparent",
                          color: themeCount >= MAX_THEME_COUNT ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                          cursor: themeCount >= MAX_THEME_COUNT ? "not-allowed" : "pointer",
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
                    { label: "Genres",        count: pool.genres.length },
                    { label: "Settings",      count: pool.settings.length },
                    { label: "Protagonists",  count: pool.protagonists.length },
                    { label: "Supporting",    count: pool.supportingChars.length },
                    { label: "Antagonists",   count: pool.antagonists.length },
                    { label: "Themes/Events", count: pool.themesEvents.length },
                    { label: "Finales",       count: pool.finales.length },
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
                    gridTemplateColumns: "repeat(auto-fill, minmax(min(380px, 100%), 1fr))",
                    gap: "12px",
                  }}
                >
                  {results.map((combo, i) => (
                    <ScriptCard key={i} combo={combo} index={i} onUse={useCombo} />
                  ))}
                </div>
              )}
            </>
          ) : (
            pool ? (
              <ScriptBuilder
                key={builderKey}
                pool={pool}
                bias={bias}
                onBiasChange={setBias}
                initialCombo={builderPreload}
              />
            ) : null
          )}
        </>
      )}
    </ModuleShell>
  );
}
