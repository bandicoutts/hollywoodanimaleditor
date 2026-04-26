"use client";

import { useCallback } from "react";
import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";
import type { Milestone } from "@/lib/save-file";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMilestoneLabel(id: string): string {
  return id
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Milestone row ─────────────────────────────────────────────────────────────

function MilestoneRow({
  milestone,
  onToggleFinished,
  onToggleLocked,
}: {
  milestone: Milestone;
  onToggleFinished: () => void;
  onToggleLocked: () => void;
}) {
  const progress = parseFloat(milestone.progress) || 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto",
        alignItems: "center",
        gap: "16px",
        padding: "10px 16px",
        border: "1px solid var(--color-border-subtle)",
        background: milestone.finished ? "#3a5a3a18" : "transparent",
        marginBottom: "4px",
        transition: "background 0.15s ease",
      }}
    >
      {/* Label + progress */}
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "12px",
            color: milestone.finished ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {formatMilestoneLabel(milestone.id)}
        </p>
        {milestone.group && (
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              color: "var(--color-text-muted)",
              letterSpacing: "0.04em",
              marginTop: "1px",
            }}
          >
            {milestone.group}
          </p>
        )}
        {!milestone.finished && progress > 0 && (
          <div
            style={{
              marginTop: "5px",
              height: "2px",
              background: "var(--color-bg-raised)",
              overflow: "hidden",
              width: "120px",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress * 100}%`,
                background: "var(--color-gold)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        )}
      </div>

      {/* Locked toggle */}
      <label
        style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", userSelect: "none" }}
      >
        <div
          onClick={onToggleLocked}
          style={{
            width: 13,
            height: 13,
            flexShrink: 0,
            border: `1px solid ${milestone.locked ? "var(--color-warning)" : "var(--color-border)"}`,
            background: milestone.locked ? "var(--color-warning)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
            cursor: "pointer",
          }}
        >
          {milestone.locked && (
            <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
              <polyline points="1,3.5 3,5.5 6.5,2" stroke="#111009" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "10px", color: milestone.locked ? "var(--color-warning)" : "var(--color-text-muted)", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
          Locked
        </span>
      </label>

      {/* Finished toggle */}
      <label
        style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", userSelect: "none" }}
      >
        <div
          onClick={onToggleFinished}
          style={{
            width: 13,
            height: 13,
            flexShrink: 0,
            border: `1px solid ${milestone.finished ? "var(--color-success)" : "var(--color-border)"}`,
            background: milestone.finished ? "var(--color-success)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
            cursor: "pointer",
          }}
        >
          {milestone.finished && (
            <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
              <polyline points="1,3.5 3,5.5 6.5,2" stroke="#111009" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "10px", color: milestone.finished ? "var(--color-success)" : "var(--color-text-muted)", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
          Finished
        </span>
      </label>
    </div>
  );
}

// ── Functionality toggle ───────────────────────────────────────────────────────

function FunctionalityToggle({
  id,
  enabled,
  onToggle,
}: {
  id: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        padding: "8px 12px",
        border: `1px solid ${enabled ? "var(--color-border)" : "var(--color-border-subtle)"}`,
        background: enabled ? "#c9a44a08" : "transparent",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
      onClick={onToggle}
    >
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "11px",
          color: enabled ? "var(--color-text-primary)" : "var(--color-text-muted)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {id}
      </span>
      {/* Toggle pill */}
      <div
        style={{
          width: 28,
          height: 14,
          flexShrink: 0,
          background: enabled ? "var(--color-gold)" : "var(--color-bg-raised)",
          border: `1px solid ${enabled ? "var(--color-gold)" : "var(--color-border)"}`,
          position: "relative",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: enabled ? 14 : 2,
            width: 8,
            height: 8,
            background: enabled ? "#111009" : "var(--color-text-muted)",
            transition: "left 0.2s ease",
          }}
        />
      </div>
    </div>
  );
}

// ── Main module ───────────────────────────────────────────────────────────────

export default function MilestonesModule() {
  const { isLoaded, saveData, updateStateJson } = useSaveFile();

  const milestones = saveData?.stateJson?.milestones ?? {};
  const functionalities = saveData?.stateJson?.functionalities ?? {};

  const milestoneEntries = Object.entries(milestones) as [string, Milestone][];
  const functionalityEntries = Object.entries(functionalities) as [string, boolean][];

  const finishedCount = milestoneEntries.filter(([, m]) => m.finished).length;
  const enabledCount = functionalityEntries.filter(([, v]) => v).length;

  const toggleMilestoneFinished = useCallback(
    (id: string) => {
      updateStateJson((s) => {
        const m = s.milestones[id] as Milestone | undefined;
        if (m) {
          m.finished = !m.finished;
          if (m.finished) {
            m.progress = "1.000";
            m.locked = false;
          }
        }
      });
    },
    [updateStateJson]
  );

  const toggleMilestoneLocked = useCallback(
    (id: string) => {
      updateStateJson((s) => {
        const m = s.milestones[id] as Milestone | undefined;
        if (m) m.locked = !m.locked;
      });
    },
    [updateStateJson]
  );

  const unlockAllMilestones = useCallback(() => {
    updateStateJson((s) => {
      for (const key of Object.keys(s.milestones)) {
        const m = s.milestones[key] as Milestone;
        m.finished = true;
        m.locked = false;
        m.progress = "1.000";
      }
    });
  }, [updateStateJson]);

  const toggleFunctionality = useCallback(
    (key: string) => {
      updateStateJson((s) => {
        s.functionalities[key] = !s.functionalities[key];
      });
    },
    [updateStateJson]
  );

  const enableAllFunctionalities = useCallback(() => {
    updateStateJson((s) => {
      for (const key of Object.keys(s.functionalities)) {
        s.functionalities[key] = true;
      }
    });
  }, [updateStateJson]);

  return (
    <ModuleShell
      title="Milestones & Features"
      subtitle={
        isLoaded
          ? `${finishedCount}/${milestoneEntries.length} milestones finished · ${enabledCount}/${functionalityEntries.length} features enabled`
          : "Manage milestones and game feature flags"
      }
      maxWidth={800}
      actions={
        isLoaded ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={enableAllFunctionalities}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "11px",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
                background: "transparent",
                border: "1px solid var(--color-border)",
                padding: "5px 14px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-gold)";
                e.currentTarget.style.borderColor = "var(--color-gold-mid)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-text-muted)";
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              Enable All Features
            </button>
            <button
              onClick={unlockAllMilestones}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "11px",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
                background: "transparent",
                border: "1px solid var(--color-border)",
                padding: "5px 14px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-gold)";
                e.currentTarget.style.borderColor = "var(--color-gold-mid)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-text-muted)";
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              Unlock All Milestones
            </button>
          </div>
        ) : undefined
      }
    >
      {!isLoaded ? (
        <EmptyState message="Upload a save file to edit milestones and features" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
          {/* Milestones column */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-text-secondary)",
                marginBottom: "10px",
              }}
            >
              Milestones
              <span style={{ color: "var(--color-text-muted)", fontWeight: 400, marginLeft: "6px" }}>
                {finishedCount}/{milestoneEntries.length}
              </span>
            </p>
            {milestoneEntries.length === 0 ? (
              <EmptyState message="No milestones found" />
            ) : (
              milestoneEntries.map(([id, milestone]) => (
                <MilestoneRow
                  key={id}
                  milestone={milestone}
                  onToggleFinished={() => toggleMilestoneFinished(id)}
                  onToggleLocked={() => toggleMilestoneLocked(id)}
                />
              ))
            )}
          </div>

          {/* Functionalities column */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-text-secondary)",
                marginBottom: "10px",
              }}
            >
              Game Features
              <span style={{ color: "var(--color-text-muted)", fontWeight: 400, marginLeft: "6px" }}>
                {enabledCount}/{functionalityEntries.length}
              </span>
            </p>
            {functionalityEntries.length === 0 ? (
              <EmptyState message="No features found" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {functionalityEntries.map(([key, enabled]) => (
                  <FunctionalityToggle
                    key={key}
                    id={key}
                    enabled={enabled}
                    onToggle={() => toggleFunctionality(key)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </ModuleShell>
  );
}
