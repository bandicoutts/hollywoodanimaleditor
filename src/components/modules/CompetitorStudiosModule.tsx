"use client";

import { useCallback, useState } from "react";
import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";
import type { CompetitorStudio } from "@/lib/save-file";
import { formatDecimalString } from "@/lib/save-file";
import { COMPETITOR_META } from "@/data/competitors";
import ConfirmDialog from "./ConfirmDialog";

// Default budgets from CompetitorStudios.json initialBudget values (approximate)
const DEFAULT_BUDGETS: Record<string, number> = {
  GB: 29_000_000,
  EM: 6_000_000,
  SU: 6_000_000,
  HE: 4_000_000,
  MA: 2_000_000,
};

function makeDefaultEntry(id: string): CompetitorStudio {
  return {
    id: null,
    isUnderRaid: false,
    lastBudget: DEFAULT_BUDGETS[id] ?? 0,
    incomeThisMonth: 0,
    ip: 0,
    avgAttitude: "1.000",
    aggression: "0.000",
    generalSpending: 0,
    attackedThisMonth: 0,
    abortedMoviesThisYear: 0,
    targetBaselineMultiplier: "1.000",
    targetBudgetMultiplier: "1.000",
    cinemasDiffLastMonth: 0,
    isDead: false,
    attackCooldown: 0,
    budgetCheatsRemaining: 2,
    wallets: {},
    scheduledMovies: [],
    debugStats: [],
    budgetOnStartOfYear: 0,
  };
}

// ── Studio row ────────────────────────────────────────────────────────────────

function CompetitorRow({
  id,
  studio,
  onUpdate,
  onKill,
}: {
  id: string;
  studio: CompetitorStudio;
  onUpdate: (updater: (s: CompetitorStudio) => void) => void;
  onKill: () => void;
}) {
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetVal, setBudgetVal] = useState("");

  const meta = COMPETITOR_META[id] ?? null;
  const aggression = parseFloat(studio.aggression) || 0;

  const commitBudget = () => {
    const v = parseInt(budgetVal.replace(/[^0-9]/g, ""), 10) || 0;
    onUpdate((s) => { s.lastBudget = v; });
    setEditingBudget(false);
  };

  return (
    <div
      style={{
        padding: "16px 20px",
        border: "1px solid var(--color-border-subtle)",
        borderLeft: studio.isDead
          ? "3px solid var(--color-danger)"
          : studio.isUnderRaid
          ? "3px solid var(--color-warning)"
          : "3px solid var(--color-border)",
        background: studio.isDead ? "#e0808008" : "transparent",
        opacity: studio.isDead ? 0.7 : 1,
        marginBottom: "8px",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "10px",
          gap: "12px",
        }}
      >
        <div>
          {/* Name + ID badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "15px",
                fontWeight: 600,
                color: studio.isDead ? "var(--color-text-muted)" : "var(--color-text-primary)",
              }}
            >
              {meta?.name ?? `Studio ${id}`}
            </p>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", border: "1px solid var(--color-border-subtle)", padding: "1px 5px" }}>
              {id}
            </span>
          </div>

          {/* Reference context row */}
          {meta && (
            <div style={{ display: "flex", gap: "20px", marginTop: "8px", flexWrap: "wrap" }}>
              {[
                { label: "Focus", value: meta.tier, color: "var(--color-gold-mid)" },
                { label: "Film quality", value: meta.qualityRange, color: "var(--color-text-secondary)" },
                { label: "Releases/yr", value: meta.releases, color: "var(--color-text-secondary)" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "2px" }}>
                    {label}
                  </p>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: "11px", letterSpacing: "0.04em", color }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Status badges */}
          <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
            {studio.isDead && (
              <span style={{ fontFamily: "var(--font-ui)", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-danger)", border: "1px solid var(--color-danger)", padding: "1px 6px" }}>
                Eliminated
              </span>
            )}
            {studio.isUnderRaid && (
              <span style={{ fontFamily: "var(--font-ui)", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-warning)", border: "1px solid var(--color-warning)", padding: "1px 6px" }}>
                Under Raid
              </span>
            )}
          </div>
        </div>

        {/* Eliminate button */}
        {!studio.isDead && (
          <button
            onClick={onKill}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              background: "transparent",
              border: "1px solid var(--color-border)",
              padding: "3px 10px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-danger)";
              e.currentTarget.style.borderColor = "var(--color-danger)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-text-muted)";
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          >
            Eliminate
          </button>
        )}
        {studio.isDead && (
          <button
            onClick={() => onUpdate((s) => { s.isDead = false; })}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              background: "transparent",
              border: "1px solid var(--color-border)",
              padding: "3px 10px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Restore
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
        {/* Budget */}
        <div>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "4px" }}>
            Last Budget
          </p>
          {editingBudget ? (
            <input
              autoFocus
              value={budgetVal}
              onChange={(e) => setBudgetVal(e.target.value)}
              onBlur={commitBudget}
              onKeyDown={(e) => { if (e.key === "Enter") commitBudget(); if (e.key === "Escape") setEditingBudget(false); }}
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--color-gold)",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid var(--color-gold)",
                outline: "none",
                width: "120px",
                padding: "0 0 1px",
              }}
            />
          ) : (
            <span
              onClick={() => { setBudgetVal(String(studio.lastBudget)); setEditingBudget(true); }}
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--color-gold)",
                borderBottom: "1px dashed var(--color-border)",
                cursor: "text",
              }}
            >
              ${studio.lastBudget.toLocaleString()}
            </span>
          )}
        </div>

        {/* Aggression */}
        <div>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "4px" }}>
            Aggression
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "15px", fontWeight: 600, color: aggression > 0.5 ? "var(--color-danger)" : "var(--color-text-secondary)", minWidth: 40 }}>
              {aggression.toFixed(2)}
            </span>
            <div style={{ position: "relative", flex: 1 }}>
              <div style={{ height: "6px", background: "var(--color-bg-raised)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${aggression * 100}%`, background: aggression > 0.5 ? "var(--color-danger)" : "var(--color-text-muted)", transition: "width 0.3s ease" }} />
              </div>
              <input
                type="range" min={0} max={1} step={0.01} value={aggression}
                onChange={(e) => onUpdate((s) => { s.aggression = formatDecimalString(parseFloat(e.target.value)); })}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", margin: 0 }}
              />
            </div>
          </div>
        </div>

        {/* Raid toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <div
              onClick={() => onUpdate((s) => { s.isUnderRaid = !s.isUnderRaid; })}
              style={{
                width: 14, height: 14, flexShrink: 0,
                border: `1px solid ${studio.isUnderRaid ? "var(--color-warning)" : "var(--color-border)"}`,
                background: studio.isUnderRaid ? "var(--color-warning)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s ease", cursor: "pointer",
              }}
            >
              {studio.isUnderRaid && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <polyline points="1.5,4.5 3.5,6.5 7.5,2.5" stroke="#111009" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "11px", color: "var(--color-text-secondary)" }}>
              Under Raid
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

// ── Main module ───────────────────────────────────────────────────────────────

export default function CompetitorStudiosModule() {
  const { isLoaded, saveData, updateStateJson } = useSaveFile();
  const [confirmKill, setConfirmKill] = useState<string | null>(null);

  const competitorStudios = saveData?.stateJson?.competitorStudios ?? {};
  const knownIds = Object.keys(COMPETITOR_META);
  // Always show all known studios; fallback to save keys for any unknown ones
  const saveKeys = Object.keys(competitorStudios).filter((k) => !knownIds.includes(k));
  const allIds = [...knownIds, ...saveKeys];

  const updateStudio = useCallback(
    (id: string, updater: (s: CompetitorStudio) => void) => {
      updateStateJson((s) => {
        const studio = s.competitorStudios[id];
        if (studio) updater(studio as CompetitorStudio);
      });
    },
    [updateStateJson]
  );

  const killStudio = useCallback(
    (id: string) => {
      updateStateJson((s) => {
        const studio = s.competitorStudios[id];
        if (studio) (studio as CompetitorStudio).isDead = true;
      });
      setConfirmKill(null);
    },
    [updateStateJson]
  );

  const createStudio = useCallback(
    (id: string) => {
      updateStateJson((s) => {
        s.competitorStudios[id] = makeDefaultEntry(id);
      }, `${COMPETITOR_META[id]?.name ?? id} entry created`);
    },
    [updateStateJson]
  );

  return (
    <ModuleShell
      title="Competitor Studios"
      subtitle="Edit rival studio budgets, aggression, raid status, and elimination"
    >
      {!isLoaded ? (
        <EmptyState message="Upload a save file to edit competitor studios" />
      ) : (
        allIds.map((id) => {
          const studio = competitorStudios[id] as CompetitorStudio | undefined;
          const meta = COMPETITOR_META[id];
          if (!studio) {
            return (
              <div
                key={id}
                style={{
                  padding: "14px 20px",
                  border: "1px solid var(--color-border-subtle)",
                  borderLeft: "3px solid var(--color-border-subtle)",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  opacity: 0.6,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <p style={{ fontFamily: "var(--font-serif)", fontSize: "15px", fontWeight: 600, color: "var(--color-text-muted)" }}>
                      {meta?.name ?? `Studio ${id}`}
                    </p>
                    <span style={{ fontFamily: "var(--font-ui)", fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", border: "1px solid var(--color-border-subtle)", padding: "1px 5px" }}>
                      {id}
                    </span>
                  </div>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                    Not yet encountered in this save
                  </p>
                </div>
                <button
                  onClick={() => createStudio(id)}
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "10px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--color-text-muted)",
                    background: "transparent",
                    border: "1px solid var(--color-border)",
                    padding: "3px 10px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--color-gold)";
                    e.currentTarget.style.borderColor = "var(--color-gold)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--color-text-muted)";
                    e.currentTarget.style.borderColor = "var(--color-border)";
                  }}
                >
                  Create Entry
                </button>
              </div>
            );
          }
          return (
            <CompetitorRow
              key={id}
              id={id}
              studio={studio}
              onUpdate={(updater) => updateStudio(id, updater)}
              onKill={() => setConfirmKill(id)}
            />
          );
        })
      )}

      {confirmKill && (
        <ConfirmDialog
          message={`Permanently eliminate ${COMPETITOR_META[confirmKill]?.name ?? `Studio ${confirmKill}`}? This removes them from the game and may affect event chains. This action cannot be undone without re-uploading your original save.`}
          onConfirm={() => killStudio(confirmKill)}
          onCancel={() => setConfirmKill(null)}
        />
      )}
    </ModuleShell>
  );
}
