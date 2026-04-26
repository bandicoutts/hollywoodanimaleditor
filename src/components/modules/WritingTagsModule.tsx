"use client";

import { useCallback, useMemo } from "react";
import ModuleShell from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";
import { TAG_GROUPS, ALL_KNOWN_TAGS, type TagGroup } from "@/data/tags";
import type { TagPoolEntry } from "@/lib/save-file";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTagLabel(id: string): string {
  // Strip known category prefix (e.g. PROTAGONIST_, ANTAGONIST_, THEME_, etc.)
  const prefixes = [
    "PROTAGONIST_", "SUPPORTINGCHARACTER_", "ANTAGONIST_",
    "THEME_", "EVENTS_", "EVENT_", "FINALE_",
  ];
  let s = id;
  for (const p of prefixes) {
    if (s.startsWith(p)) { s = s.slice(p.length); break; }
  }
  return s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function currentGameDate(): string {
  // Fallback date when we can't determine the in-game date
  return "1929-01-01T00:00:00";
}

// ── Tag pill ──────────────────────────────────────────────────────────────────

function TagPill({
  id,
  active,
  color,
  onToggle,
}: {
  id: string;
  active: boolean;
  color: string;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      title={id}
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "11px",
        letterSpacing: "0.04em",
        color: active ? color : "var(--color-text-muted)",
        background: active ? color + "18" : "transparent",
        border: `1px solid ${active ? color + "88" : "var(--color-border-subtle)"}`,
        padding: "4px 10px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--color-text-secondary)";
          e.currentTarget.style.borderColor = "var(--color-border)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--color-text-muted)";
          e.currentTarget.style.borderColor = "var(--color-border-subtle)";
        }
      }}
    >
      {formatTagLabel(id)}
    </button>
  );
}

// ── Tag group section ─────────────────────────────────────────────────────────

function TagGroupSection({
  group,
  activeSet,
  onToggle,
  onUnlockAll,
}: {
  group: TagGroup & { tags: string[] };
  activeSet: Set<string>;
  onToggle: (id: string) => void;
  onUnlockAll: (ids: string[]) => void;
}) {
  const activeCount = group.tags.filter((id) => activeSet.has(id)).length;

  return (
    <div style={{ marginBottom: "28px" }}>
      {/* Group header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        {/* Colour accent bar */}
        <div
          style={{
            width: 3,
            height: 14,
            background: group.color,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-secondary)",
            flex: 1,
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
          {activeCount}/{group.tags.length}
        </span>
        <button
          onClick={() => onUnlockAll(group.tags)}
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: activeCount === group.tags.length ? "var(--color-text-muted)" : group.color,
            background: "transparent",
            border: `1px solid ${activeCount === group.tags.length ? "var(--color-border)" : group.color + "55"}`,
            padding: "2px 8px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          {activeCount === group.tags.length ? "All unlocked" : "Unlock all"}
        </button>
      </div>

      {/* Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {group.tags.map((id) => (
          <TagPill
            key={id}
            id={id}
            active={activeSet.has(id)}
            color={group.color}
            onToggle={() => onToggle(id)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main module ───────────────────────────────────────────────────────────────

export default function WritingTagsModule() {
  const { isLoaded, saveData, updateStateJson } = useSaveFile();

  const tagPool: TagPoolEntry[] = saveData?.stateJson?.tagPool ?? [];
  const activeSet = useMemo(
    () => new Set(tagPool.map((t) => t.Item1)),
    [tagPool]
  );

  // Unknown tags: in the save but not in our reference list
  const unknownActive = useMemo(
    () => tagPool.filter((t) => !ALL_KNOWN_TAGS.has(t.Item1)).map((t) => t.Item1),
    [tagPool]
  );

  const toggleTag = useCallback(
    (id: string) => {
      updateStateJson((s) => {
        const idx = s.tagPool.findIndex((t) => t.Item1 === id);
        if (idx !== -1) {
          // Remove
          s.tagPool.splice(idx, 1);
        } else {
          // Add
          s.tagPool.push({ Item1: id, Item2: currentGameDate() });
        }
      });
    },
    [updateStateJson]
  );

  const unlockAll = useCallback(
    (ids: string[]) => {
      updateStateJson((s) => {
        const existing = new Set(s.tagPool.map((t) => t.Item1));
        for (const id of ids) {
          if (!existing.has(id)) {
            s.tagPool.push({ Item1: id, Item2: currentGameDate() });
          }
        }
      });
    },
    [updateStateJson]
  );

  const unlockAllKnown = useCallback(() => {
    updateStateJson((s) => {
      const existing = new Set(s.tagPool.map((t) => t.Item1));
      for (const id of ALL_KNOWN_TAGS) {
        if (!existing.has(id)) {
          s.tagPool.push({ Item1: id, Item2: currentGameDate() });
        }
      }
    });
  }, [updateStateJson]);

  const totalActive = activeSet.size;
  const totalKnown = ALL_KNOWN_TAGS.size;

  return (
    <ModuleShell
      title="Writing Tags"
      subtitle={
        isLoaded
          ? `${totalActive} active · ${totalKnown} known tags across ${TAG_GROUPS.length} categories`
          : "Unlock and manage your studio's tag pool"
      }
      maxWidth={720}
      actions={
        isLoaded ? (
          <button
            onClick={unlockAllKnown}
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
          Upload a save file to edit writing tags.
        </p>
      ) : (
        <>
          {TAG_GROUPS.map((group) => (
            <TagGroupSection
              key={group.label}
              group={group}
              activeSet={activeSet}
              onToggle={toggleTag}
              onUnlockAll={unlockAll}
            />
          ))}

          {/* Unknown tags from save */}
          {unknownActive.length > 0 && (
            <TagGroupSection
              group={{
                label: "Other (unknown)",
                color: "#9a9280",
                tags: unknownActive,
              }}
              activeSet={activeSet}
              onToggle={toggleTag}
              onUnlockAll={unlockAll}
            />
          )}
        </>
      )}
    </ModuleShell>
  );
}
