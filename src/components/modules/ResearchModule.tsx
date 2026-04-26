"use client";

import { useCallback, useMemo } from "react";
import ModuleShell from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";
import { PERK_GROUPS, PERK_LABELS, ALL_KNOWN_PERKS, type PerkGroup } from "@/data/perks";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPerkLabel(id: string): string {
  if (id in PERK_LABELS) return PERK_LABELS[id];
  return id
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Perk row ──────────────────────────────────────────────────────────────────

function PerkRow({
  id,
  checked,
  color,
  onToggle,
}: {
  id: string;
  checked: boolean;
  color: string;
  onToggle: () => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "7px 16px",
        cursor: "pointer",
        transition: "background 0.15s ease",
        userSelect: "none",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "#1d1a1560")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "transparent")
      }
    >
      {/* Custom checkbox */}
      <div
        onClick={onToggle}
        style={{
          width: 14,
          height: 14,
          border: `1px solid ${checked ? color : "var(--color-border)"}`,
          background: checked ? color : "transparent",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
        }}
      >
        {checked && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <polyline
              points="1,4 3,6 7,2"
              stroke="#111009"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span
        onClick={onToggle}
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "11px",
          color: checked ? "var(--color-text-primary)" : "var(--color-text-secondary)",
          flex: 1,
          transition: "color 0.15s ease",
        }}
      >
        {formatPerkLabel(id)}
      </span>
    </label>
  );
}

// ── Perk group card ───────────────────────────────────────────────────────────

function PerkCard({
  group,
  openedSet,
  onToggle,
  onToggleAll,
}: {
  group: PerkGroup;
  openedSet: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
}) {
  const checkedCount = group.perks.filter((id) => openedSet.has(id)).length;
  const allChecked = checkedCount === group.perks.length;

  return (
    <div
      style={{
        background: "var(--color-bg-panel)",
        border: "1px solid var(--color-border-subtle)",
        borderTop: `2px solid ${group.color}`,
        overflow: "hidden",
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: group.color,
            }}
          >
            {group.label}
          </span>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              color: "var(--color-text-muted)",
            }}
          >
            {checkedCount}/{group.perks.length}
          </span>
        </div>
        <button
          onClick={() => onToggleAll(group.perks)}
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: allChecked ? "var(--color-text-muted)" : group.color,
            background: "transparent",
            border: `1px solid ${allChecked ? "var(--color-border)" : group.color + "55"}`,
            padding: "2px 8px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          {allChecked ? "All unlocked" : "All"}
        </button>
      </div>

      {/* Perk rows */}
      <div>
        {group.perks.map((id) => (
          <PerkRow
            key={id}
            id={id}
            checked={openedSet.has(id)}
            color={group.color}
            onToggle={() => onToggle(id)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main module ───────────────────────────────────────────────────────────────

export default function ResearchModule() {
  const { isLoaded, saveData, updateStateJson } = useSaveFile();

  const openedPerks: string[] = saveData?.stateJson?.openedPerks ?? [];
  const openedSet = useMemo(() => new Set(openedPerks), [openedPerks]);

  // Perks in the save that aren't in our known list
  const unknownOpened = useMemo(
    () => openedPerks.filter((id) => !ALL_KNOWN_PERKS.has(id)),
    [openedPerks]
  );

  const togglePerk = useCallback(
    (id: string) => {
      updateStateJson((s) => {
        const idx = s.openedPerks.indexOf(id);
        if (idx !== -1) {
          s.openedPerks.splice(idx, 1);
        } else {
          s.openedPerks.push(id);
        }
      });
    },
    [updateStateJson]
  );

  const unlockGroup = useCallback(
    (ids: string[]) => {
      updateStateJson((s) => {
        const existing = new Set(s.openedPerks);
        for (const id of ids) {
          if (!existing.has(id)) s.openedPerks.push(id);
        }
      });
    },
    [updateStateJson]
  );

  const unlockAll = useCallback(() => {
    updateStateJson((s) => {
      const existing = new Set(s.openedPerks);
      for (const id of ALL_KNOWN_PERKS) {
        if (!existing.has(id)) s.openedPerks.push(id);
      }
    });
  }, [updateStateJson]);

  const totalKnown = ALL_KNOWN_PERKS.size;
  const openedKnown = openedPerks.filter((id) => ALL_KNOWN_PERKS.has(id)).length;
  const progressPct = totalKnown > 0 ? (openedKnown / totalKnown) * 100 : 0;

  return (
    <ModuleShell
      title="Research"
      subtitle={
        isLoaded
          ? `${openedPerks.length} perks unlocked · ${openedKnown} of ${totalKnown} known`
          : "Unlock and manage studio perks"
      }
      maxWidth={800}
      actions={
        isLoaded ? (
          <button
            onClick={unlockAll}
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
            Unlock All
          </button>
        ) : undefined
      }
    >
      {!isLoaded ? (
        <p style={{ fontFamily: "var(--font-ui)", fontSize: "12px", color: "var(--color-text-muted)" }}>
          Upload a save file to edit research perks.
        </p>
      ) : (
        <>
          {/* Progress bar */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                height: 4,
                background: "var(--color-bg-raised)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, var(--color-gold), var(--color-success))",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                color: "var(--color-text-muted)",
                marginTop: "6px",
                letterSpacing: "0.04em",
              }}
            >
              {progressPct.toFixed(0)}% of known perks unlocked
            </p>
          </div>

          {/* 2-column card grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {PERK_GROUPS.map((group) => (
              <PerkCard
                key={group.label}
                group={group}
                openedSet={openedSet}
                onToggle={togglePerk}
                onToggleAll={unlockGroup}
              />
            ))}

            {/* Unknown perks from save */}
            {unknownOpened.length > 0 && (
              <PerkCard
                group={{
                  label: "Other (unknown)",
                  color: "#9a9280",
                  perks: unknownOpened,
                }}
                openedSet={openedSet}
                onToggle={togglePerk}
                onToggleAll={unlockGroup}
              />
            )}
          </div>
        </>
      )}
    </ModuleShell>
  );
}
