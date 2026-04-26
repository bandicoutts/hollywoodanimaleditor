"use client";

import { useCallback, useMemo } from "react";
import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";
import type { Technology } from "@/lib/save-file";

// ── Tech card ─────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<number, string> = { 0: "Camera", 1: "Sound" };
const TYPE_COLOR: Record<number, string> = {
  0: "#7ab0e0", // camera → blue
  1: "#e09090", // sound → rose
};

function TechCard({
  tech,
  onToggle,
}: {
  tech: Technology;
  onToggle: () => void;
}) {
  const isReadOnly = !tech.configId;
  const color = TYPE_COLOR[tech.type] ?? "#9a9280";
  const checked = tech.owned;

  return (
    <div
      onClick={isReadOnly ? undefined : onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 14px",
        border: `1px solid ${checked ? color + "55" : "var(--color-border-subtle)"}`,
        background: checked ? color + "0e" : "transparent",
        cursor: isReadOnly ? "default" : "pointer",
        transition: "all 0.15s ease",
        opacity: isReadOnly ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isReadOnly && !checked)
          e.currentTarget.style.background = "#1d1a1560";
      }}
      onMouseLeave={(e) => {
        if (!isReadOnly && !checked)
          e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Checkbox */}
      <div
        style={{
          width: 16,
          height: 16,
          flexShrink: 0,
          border: `1px solid ${checked ? color : "var(--color-border)"}`,
          background: checked ? color : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
        }}
      >
        {checked && (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <polyline
              points="1.5,4.5 3.5,6.5 7.5,2.5"
              stroke="#111009"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "12px",
            color: checked ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {tech.configId || `Custom Tech #${tech.id}`}
        </p>
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            color: "var(--color-text-muted)",
            marginTop: "1px",
          }}
        >
          {tech.format || "—"} · {tech.releaseYear ?? "—"}
          {isReadOnly && " · read-only"}
        </p>
      </div>

      {tech.isOutDated && (
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "9px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
            padding: "1px 5px",
            flexShrink: 0,
          }}
        >
          Outdated
        </span>
      )}
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────

function TechColumn({
  label,
  color,
  techs,
  onToggle,
  onToggleAll,
}: {
  label: string;
  color: string;
  techs: Technology[];
  onToggle: (id: number) => void;
  onToggleAll: (ids: number[]) => void;
}) {
  const editableTechs = techs.filter((t) => t.configId);
  const ownedCount = editableTechs.filter((t) => t.owned).length;

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Column header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid var(--color-border-subtle)",
          borderTop: `2px solid ${color}`,
          background: "var(--color-bg-panel)",
          marginBottom: "2px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color,
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              color: "var(--color-text-muted)",
            }}
          >
            {ownedCount}/{editableTechs.length}
          </span>
        </div>
        <button
          onClick={() => onToggleAll(editableTechs.map((t) => t.id))}
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: ownedCount === editableTechs.length ? "var(--color-text-muted)" : color,
            background: "transparent",
            border: `1px solid ${ownedCount === editableTechs.length ? "var(--color-border)" : color + "55"}`,
            padding: "2px 8px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {ownedCount === editableTechs.length ? "All owned" : "Own all"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {techs.map((t) => (
          <TechCard key={t.id} tech={t} onToggle={() => onToggle(t.id)} />
        ))}
      </div>
    </div>
  );
}

// ── Main module ───────────────────────────────────────────────────────────────

export default function TechnologiesModule() {
  const { isLoaded, saveData, updateStateJson } = useSaveFile();

  const technologies: Technology[] = saveData?.stateJson?.technologies ?? [];

  const { cameras, sound } = useMemo(() => ({
    cameras: technologies.filter((t) => t.type === 0),
    sound: technologies.filter((t) => t.type === 1),
  }), [technologies]);

  const toggleTech = useCallback(
    (id: number) => {
      updateStateJson((s) => {
        const t = s.technologies.find((t) => t.id === id);
        if (t && t.configId) t.owned = !t.owned;
      });
    },
    [updateStateJson]
  );

  const ownAll = useCallback(
    (ids: number[]) => {
      updateStateJson((s) => {
        for (const id of ids) {
          const t = s.technologies.find((t) => t.id === id);
          if (t && t.configId) t.owned = true;
        }
      });
    },
    [updateStateJson]
  );

  return (
    <ModuleShell
      title="Technologies"
      subtitle="Toggle camera and sound technology ownership"
      maxWidth={800}
    >
      {!isLoaded ? (
        <EmptyState message="Upload a save file to edit technologies" />
      ) : technologies.length === 0 ? (
        <EmptyState message="No technologies found in this save" />
      ) : (
        <div style={{ display: "flex", gap: "16px" }}>
          <TechColumn
            label="Camera"
            color={TYPE_COLOR[0]}
            techs={cameras}
            onToggle={toggleTech}
            onToggleAll={ownAll}
          />
          <TechColumn
            label="Sound"
            color={TYPE_COLOR[1]}
            techs={sound}
            onToggle={toggleTech}
            onToggleAll={ownAll}
          />
        </div>
      )}
    </ModuleShell>
  );
}
