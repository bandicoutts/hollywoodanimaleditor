"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { ScriptElement } from "@/data/scriptElements";
import ModuleShell, { EmptyState } from "./ModuleShell";
import PillButton from "./PillButton";
import ScriptCard from "./ScriptCard";
import ScriptBuilder from "./ScriptBuilder";
import { useSaveFile } from "@/context/SaveFileContext";
import {
  getUnlockedPool,
  generateSuggestions,
  biasScore,
  type ScriptCombo,
  type Bias,
  type AntagonistMode,
  type SupportingMode,
  type DualGenreMode,
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

// ── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  suffix?: string;
}) {
  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    fontFamily: "var(--font-ui)",
    fontSize: "14px",
    width: "28px",
    height: "28px",
    border: "1px solid var(--color-border)",
    background: "transparent",
    color: disabled ? "var(--color-text-muted)" : "var(--color-text-secondary)",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} style={btnStyle(value <= min)}>−</button>
      <span style={{ fontFamily: "var(--font-ui)", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", minWidth: "16px", textAlign: "center" }}>
        {value}
        {suffix && <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>{suffix}</span>}
      </span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} style={btnStyle(value >= max)}>+</button>
    </div>
  );
}

// ── Three-way pill row ────────────────────────────────────────────────────────

function ThreeWay<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p style={{ ...LABEL_STYLE, marginBottom: "8px" }}>{label}</p>
      <div style={{ display: "flex", gap: "6px" }}>
        {options.map((o) => (
          <PillButton key={o.value} active={value === o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </PillButton>
        ))}
      </div>
    </div>
  );
}

// ── Main module ───────────────────────────────────────────────────────────────

export default function AIScriptsModule() {
  const { isLoaded, saveData } = useSaveFile();

  const [mode, setMode] = useState<Mode>("generate");
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [bias, setBias] = useState<Bias>("balanced");
  const [themeCount, setThemeCount] = useState(MIN_THEME_COUNT);
  const [antagonistMode, setAntagonistMode] = useState<AntagonistMode>("any");
  const [supportingMode, setSupportingMode] = useState<SupportingMode>("any");
  const [dualGenreMode, setDualGenreMode] = useState<DualGenreMode>("any");
  const [results, setResults] = useState<ScriptCombo[]>([]);
  const [sortBias, setSortBias] = useState<Bias>("balanced");
  const [generated, setGenerated] = useState(false);
  const [showPoolStats, setShowPoolStats] = useState(false);
  const [builderPreload, setBuilderPreload] = useState<ScriptCombo | undefined>(undefined);
  const [builderKey, setBuilderKey] = useState(0);
  const [excludeBanned, setExcludeBanned] = useState(false);
  const allianceInitialized = useRef(false);

  useEffect(() => {
    if (saveData && !allianceInitialized.current) {
      allianceInitialized.current = true;
      setExcludeBanned(saveData.stateJson.joinedAssociation ?? false);
    }
  }, [saveData]);

  const bannedIds = useMemo(() =>
    new Set(Object.keys(saveData?.stateJson.currentTagsInCodex ?? {})),
    [saveData]
  );

  const pendingBannedIds = useMemo(() =>
    new Set(Object.keys(saveData?.stateJson.queueTagsForCodex ?? {})),
    [saveData]
  );

  const openedAgentIds = useMemo(() =>
    new Set<string>((saveData?.stateJson.openedAdsAgents as string[] | undefined) ?? []),
    [saveData]
  );

  function useCombo(combo: ScriptCombo) {
    setBuilderPreload(combo);
    setBuilderKey((k) => k + 1);
    setMode("build");
  }

  const pool = useMemo<UnlockedPool | null>(() => {
    if (!isLoaded || !saveData) return null;
    return getUnlockedPool(saveData.stateJson);
  }, [isLoaded, saveData]);

  const effectivePool = useMemo<UnlockedPool | null>(() => {
    if (!pool || !excludeBanned || bannedIds.size === 0) return pool;
    const allowed = (el: ScriptElement) => !bannedIds.has(el.id);
    return {
      ...pool,
      genres: pool.genres.filter(allowed),
      settings: pool.settings.filter(allowed),
      protagonists: pool.protagonists.filter(allowed),
      supportingChars: pool.supportingChars.filter(allowed),
      antagonists: pool.antagonists.filter(allowed),
      themesEvents: pool.themesEvents.filter(allowed),
      finales: pool.finales.filter(allowed),
    };
  }, [pool, excludeBanned, bannedIds]);

  function generate() {
    if (!effectivePool) return;
    const suggestions = generateSuggestions(effectivePool, {
      genreFilter,
      bias,
      themeEventCount: themeCount,
      antagonistMode,
      supportingMode,
      dualGenreMode,
    });
    setResults(suggestions);
    setSortBias(bias);
    setGenerated(true);
  }

  const genreIds = useMemo(() => new Set(pool?.genres.map((g) => g.id) ?? []), [pool]);
  const activeGenreFilter = genreFilter && genreIds.has(genreFilter) ? genreFilter : null;

  // Client-side re-sort of existing results without regenerating
  const sortedResults = useMemo(() => {
    if (results.length === 0) return results;
    return [...results].sort((a, b) => biasScore(b.scores, sortBias) - biasScore(a.scores, sortBias));
  }, [results, sortBias]);

  return (
    <ModuleShell
      title="Script Workshop"
      subtitle="Generate script ideas based on your unlocked elements"
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

                {/* Row 2: Bias + Dual genre */}
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
                    {bias === "pollux" && activeGenreFilter === null && (
                      <p style={{ ...LABEL_STYLE, marginTop: "6px", fontStyle: "italic", textTransform: "none", letterSpacing: 0 }}>
                        Filter by genre for best Pollux results
                      </p>
                    )}
                  </div>

                  <ThreeWay
                    label="Second genre"
                    options={[
                      { value: "any" as DualGenreMode, label: "Any" },
                      { value: "prefer" as DualGenreMode, label: "Prefer paired" },
                      { value: "single" as DualGenreMode, label: "Single only" },
                    ]}
                    value={dualGenreMode}
                    onChange={setDualGenreMode}
                  />
                </div>

                {/* Row 3: Theme count + character controls */}
                <div style={{ display: "flex", gap: "32px", flexWrap: "wrap", alignItems: "flex-start" }}>
                  {(() => {
                    const maxThemeCount = (pool?.contentTagBudget ?? 5) - 2;
                    return (
                      <div>
                        <p style={{ ...LABEL_STYLE, marginBottom: "8px" }}>Themes / Events per film</p>
                        <Stepper
                          value={themeCount}
                          min={MIN_THEME_COUNT}
                          max={maxThemeCount}
                          onChange={setThemeCount}
                          suffix={` / ${maxThemeCount}`}
                        />
                      </div>
                    );
                  })()}

                  <ThreeWay
                    label="Antagonist"
                    options={[
                      { value: "any" as AntagonistMode, label: "Any" },
                      { value: "always" as AntagonistMode, label: "Always" },
                      { value: "never" as AntagonistMode, label: "Never" },
                    ]}
                    value={antagonistMode}
                    onChange={setAntagonistMode}
                  />

                  <ThreeWay
                    label="Supporting cast"
                    options={[
                      { value: "any" as SupportingMode, label: "Any" },
                      { value: "some" as SupportingMode, label: "1+" },
                      { value: "none" as SupportingMode, label: "None" },
                    ]}
                    value={supportingMode}
                    onChange={setSupportingMode}
                  />
                </div>

                {/* Alliance filter */}
                {bannedIds.size > 0 && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={LABEL_STYLE}>Alliance</span>
                    <PillButton active={excludeBanned} onClick={() => setExcludeBanned((v) => !v)}>
                      Alliance-safe only
                    </PillButton>
                    <span style={{ fontFamily: "var(--font-ui)", fontSize: "10px", color: "var(--color-text-muted)" }}>
                      {bannedIds.size} banned{pendingBannedIds.size > 0 ? ` · ${pendingBannedIds.size} pending` : ""}
                    </span>
                  </div>
                )}

                {/* Generate button + pool stats toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gold)18"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {generated ? "Generate Again" : "Generate Ideas"}
                  </button>

                  {pool && (
                    <button
                      onClick={() => setShowPoolStats((v) => !v)}
                      title="Show unlocked element counts"
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "11px",
                        color: showPoolStats ? "var(--color-text-secondary)" : "var(--color-text-muted)",
                        background: "transparent",
                        border: "1px solid var(--color-border-subtle)",
                        padding: "4px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Pool stats
                    </button>
                  )}
                </div>

                {/* Pool stats (collapsed by default) */}
                {showPoolStats && pool && (
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      flexWrap: "wrap",
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
                        <span style={{ fontFamily: "var(--font-ui)", fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                          {count}
                        </span>
                        <span style={{ fontFamily: "var(--font-ui)", fontSize: "9px", letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Results */}
              {generated && results.length === 0 && (
                <div style={{ marginTop: "16px" }}>
                  <EmptyState message="No suggestions found — try a different genre or lower the theme count" />
                </div>
              )}

              {sortedResults.length > 0 && (
                <>
                  {/* Sort bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <span style={{ ...LABEL_STYLE }}>Sort by</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {BIAS_OPTIONS.map(({ value, label }) => (
                        <PillButton
                          key={value}
                          active={sortBias === value}
                          onClick={() => setSortBias(value)}
                          title={value === "pollux" ? "Optimise for the Pollux Award — the game's prestige prize for artistic films" : undefined}
                        >
                          {label}
                        </PillButton>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(min(380px, 100%), 1fr))",
                      gap: "12px",
                    }}
                  >
                    {sortedResults.map((combo, i) => (
                      <ScriptCard
                        key={`${combo.genre.id}|${combo.setting.id}|${combo.protagonist.id}`}
                        combo={combo}
                        index={i}
                        onUse={useCombo}
                        bannedIds={bannedIds.size > 0 ? bannedIds : undefined}
                        pendingBannedIds={pendingBannedIds.size > 0 ? pendingBannedIds : undefined}
                        openedAgentIds={openedAgentIds}
                      />
                    ))}
                  </div>
                </>
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
                bannedIds={bannedIds.size > 0 ? bannedIds : undefined}
                pendingBannedIds={pendingBannedIds.size > 0 ? pendingBannedIds : undefined}
                openedAgentIds={openedAgentIds}
              />
            ) : null
          )}
        </>
      )}
    </ModuleShell>
  );
}
