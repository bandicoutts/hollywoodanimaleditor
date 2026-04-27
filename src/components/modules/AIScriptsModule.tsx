"use client";

import { useState, useMemo } from "react";
import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";
import {
  getUnlockedPool,
  generateSuggestions,
  type ScriptCombo,
  type Bias,
  type UnlockedPool,
} from "@/lib/script-suggestions";

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "9px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              minWidth: "16px",
            }}
          >
            #{index + 1}
          </span>
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
            — {setting.label}
          </span>
        </div>
        <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
          <ScoreBadge label="Art" value={scores.art} color="#7ec8a0" />
          <ScoreBadge label="Com" value={scores.com} color="#7ab4d4" />
          {scores.synergy > 0 && (
            <ScoreBadge label="Syn" value={scores.synergy} color="var(--color-gold)" />
          )}
        </div>
      </div>

      {/* Cast row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginRight: "2px" }}>Cast</span>
        <Chip label={protagonist.label} />
        <Chip label={supporting.label} muted />
        <Chip label={antagonist.label} muted />
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

// ── Main module ───────────────────────────────────────────────────────────────

export default function AIScriptsModule() {
  const { isLoaded, saveData } = useSaveFile();

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
                    onClick={() => setThemeCount((n) => Math.max(1, n - 1))}
                    disabled={themeCount <= 1}
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "14px",
                      width: "28px",
                      height: "28px",
                      border: "1px solid var(--color-border)",
                      background: "transparent",
                      color: themeCount <= 1 ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                      cursor: themeCount <= 1 ? "not-allowed" : "pointer",
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
      )}
    </ModuleShell>
  );
}
