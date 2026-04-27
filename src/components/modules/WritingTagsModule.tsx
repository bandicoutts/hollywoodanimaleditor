"use client";

import { useCallback, useMemo, useRef } from "react";
import ModuleShell from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";
import { ACTION_BTN, goldHover } from "@/lib/styles";
import { TAG_GROUPS, TAG_LABELS, ALL_KNOWN_TAGS, type TagGroup } from "@/data/tags";
import type { TagPoolEntry } from "@/lib/save-file";
import { parseGameDate, getLockHint } from "@/lib/script-suggestions";
import { ELEMENT_BY_ID } from "@/data/scriptElements";

// Maps tag ID prefixes to the label of the known group they belong to
const PREFIX_TO_GROUP: [string, string][] = [
  ["PROTAGONIST_", "Protagonist"],
  ["SUPPORTINGCHARACTER_", "Supporting Character"],
  ["ANTAGONIST_", "Antagonist"],
  ["THEME_", "Theme"],
  ["EVENTS_", "Events"],
  ["EVENT_", "Events"],
  ["FINALE_", "Finale"],
];

function groupLabelByPrefix(tagId: string): string | null {
  for (const [prefix, label] of PREFIX_TO_GROUP) {
    if (tagId.startsWith(prefix)) return label;
  }
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTagLabel(id: string): string {
  if (id in TAG_LABELS) return TAG_LABELS[id];
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

// ── Tag pill ──────────────────────────────────────────────────────────────────

function TagPill({
  id,
  active,
  color,
  lockHint,
  onToggle,
}: {
  id: string;
  active: boolean;
  color: string;
  lockHint?: string | null;
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
        opacity: lockHint ? 0.45 : 1,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--color-text-secondary)";
          e.currentTarget.style.borderColor = "var(--color-border)";
        }
        if (lockHint) e.currentTarget.style.opacity = "0.75";
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--color-text-muted)";
          e.currentTarget.style.borderColor = "var(--color-border-subtle)";
        }
        if (lockHint) e.currentTarget.style.opacity = "0.45";
      }}
    >
      {formatTagLabel(id)}
      {lockHint && (
        <span style={{
          fontSize: "9px",
          letterSpacing: "0.05em",
          opacity: 0.8,
          marginLeft: "5px",
          fontStyle: "italic",
        }}>
          {lockHint}
        </span>
      )}
    </button>
  );
}

// ── Tag group section ─────────────────────────────────────────────────────────

function TagGroupSection({
  group,
  activeSet,
  onToggle,
  onUnlockAll,
  lockHintFor,
}: {
  group: TagGroup & { tags: string[] };
  activeSet: Set<string>;
  onToggle: (id: string) => void;
  onUnlockAll: (ids: string[], groupLabel?: string) => void;
  lockHintFor: (id: string) => string | null;
}) {
  const activeCount = group.tags.filter((id) => activeSet.has(id)).length;
  const lockedCount = group.tags.filter((id) => !!lockHintFor(id)).length;

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
          onClick={() => onUnlockAll(group.tags, group.label)}
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
          {activeCount === group.tags.length
            ? "All unlocked"
            : lockedCount > 0
            ? `Unlock all (${lockedCount} locked)`
            : "Unlock all"}
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
            lockHint={activeSet.has(id) ? null : lockHintFor(id)}
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

  const gameDate = useMemo(
    () => (saveData ? parseGameDate(saveData.stateJson) : new Date(1929, 0, 1)),
    [saveData]
  );
  const recipesPool = useMemo(
    () => (saveData?.stateJson?.tagRecipesPool as string[]) ?? [],
    [saveData]
  );
  const lockHintFor = useCallback(
    (id: string): string | null => {
      const el = ELEMENT_BY_ID[id];
      return el ? getLockHint(el, gameDate, recipesPool) : null;
    },
    [gameDate, recipesPool]
  );

  // Accumulate all unknown tags ever seen — so deactivating one doesn't make it disappear
  const seenUnknownRef = useRef<Set<string>>(new Set());
  useMemo(() => {
    for (const t of tagPool) {
      if (!ALL_KNOWN_TAGS.has(t.Item1)) seenUnknownRef.current.add(t.Item1);
    }
  }, [tagPool]);

  // Split seen unknowns into prefix-matched groups vs truly unknown
  const extraByGroup = useMemo<Map<string, string[]>>(() => {
    const map = new Map<string, string[]>();
    for (const id of seenUnknownRef.current) {
      const label = groupLabelByPrefix(id);
      if (label) {
        if (!map.has(label)) map.set(label, []);
        map.get(label)!.push(id);
      }
    }
    return map;
  }, [tagPool]); // tagPool dep triggers recalc when seenUnknownRef grows

  const trulyUnknown = useMemo(
    () => [...seenUnknownRef.current].filter((id) => !groupLabelByPrefix(id)),
    [tagPool]
  );

  const toggleTag = useCallback(
    (id: string) => {
      updateStateJson((s) => {
        const idx = s.tagPool.findIndex((t) => t.Item1 === id);
        if (idx !== -1) {
          s.tagPool.splice(idx, 1);
        } else {
          s.tagPool.push({ Item1: id, Item2: gameDate.toISOString().replace("Z", "") });
        }
      });
    },
    [updateStateJson, gameDate]
  );

  const unlockAll = useCallback(
    (ids: string[], groupLabel?: string) => {
      updateStateJson((s) => {
        const existing = new Set(s.tagPool.map((t) => t.Item1));
        for (const id of ids) {
          if (!existing.has(id)) {
            s.tagPool.push({ Item1: id, Item2: gameDate.toISOString().replace("Z", "") });
          }
        }
      }, groupLabel ? `Writing Tags — unlocked all in ${groupLabel}` : undefined);
    },
    [updateStateJson, gameDate]
  );

  const unlockAllKnown = useCallback(() => {
    updateStateJson((s) => {
      const existing = new Set(s.tagPool.map((t) => t.Item1));
      for (const id of ALL_KNOWN_TAGS) {
        if (!existing.has(id)) {
          s.tagPool.push({ Item1: id, Item2: gameDate.toISOString().replace("Z", "") });
        }
      }
    }, "Writing Tags — unlocked all known tags");
  }, [updateStateJson, gameDate]);

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
            style={ACTION_BTN}
            onMouseEnter={(e) => goldHover(e, true)}
            onMouseLeave={(e) => goldHover(e, false)}
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
          {TAG_GROUPS.map((group) => {
            const extra = extraByGroup.get(group.label) ?? [];
            const merged = extra.length > 0
              ? { ...group, tags: [...group.tags, ...extra] }
              : group;
            return (
              <TagGroupSection
                key={group.label}
                group={merged}
                activeSet={activeSet}
                onToggle={toggleTag}
                onUnlockAll={unlockAll}
                lockHintFor={lockHintFor}
              />
            );
          })}

          {/* Truly unknown tags — no prefix match */}
          {trulyUnknown.length > 0 && (
            <TagGroupSection
              group={{
                label: "Other (unknown)",
                color: "#9a9280",
                tags: trulyUnknown,
              }}
              activeSet={activeSet}
              onToggle={toggleTag}
              onUnlockAll={unlockAll}
              lockHintFor={lockHintFor}
            />
          )}
        </>
      )}
    </ModuleShell>
  );
}
