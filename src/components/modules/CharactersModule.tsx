"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSaveFile } from "@/context/SaveFileContext";
import type { Character } from "@/lib/save-file";
import { parseGameDate } from "@/lib/script-suggestions";
import {
  getPrimaryProfession,
  getProfessionColor,
  getProfessionLabel,
  MANAGEMENT_KEYS,
} from "@/data/professions";
import DetailPanel, { moodColor, displayName } from "./CharacterDetailPanel";
import ConfirmDialog from "./ConfirmDialog";
import { GHOST_BTN, goldHover } from "@/lib/styles";

// ── Helpers ───────────────────────────────────────────────────────────────────

function topSkill(char: Character): { prof: string; value: number } | null {
  const profs = char.professions;
  const keys = Object.keys(profs);
  if (!keys.length) return null;
  const best = keys.reduce((a, b) =>
    parseFloat(profs[a]) >= parseFloat(profs[b]) ? a : b
  );
  return { prof: best, value: parseFloat(profs[best]) };
}

// ── Character list row ────────────────────────────────────────────────────────

function CharRow({
  char,
  isActive,
  isSelected,
  selectionMode,
  onOpen,
  onToggleSelect,
}: {
  char: Character;
  isActive: boolean;
  isSelected: boolean;
  selectionMode: boolean;
  onOpen: () => void;
  onToggleSelect: (shift: boolean) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const profKey = getPrimaryProfession(char.professions);
  const profColor = profKey ? getProfessionColor(profKey) : "#9a9280";
  const skill = topSkill(char);

  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode) onToggleSelect(e.shiftKey);
    else onOpen();
  };

  const borderColor = isSelected ? "var(--color-gold-mid)" : isActive ? profColor : "transparent";

  let bg: string;
  if (hovered && selectionMode) bg = isSelected ? "#c9a44a22" : "#c9a44a0a";
  else if (hovered && !selectionMode && !isActive && !isSelected) bg = "#1d1a1580";
  else if (isSelected) bg = "#c9a44a18";
  else if (isActive) bg = "#c9a44a0d";
  else bg = "transparent";

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        padding: "8px 12px",
        background: bg,
        borderLeft: `2px solid ${borderColor}`,
        borderRight: "none",
        borderTop: "none",
        borderBottom: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s ease",
      }}
    >
      {/* Mood dot */}
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: moodColor(char.mood),
          flexShrink: 0,
        }}
      />
      {/* Name + profession */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "13px",
            color: "#c8bfae",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayName(char)}
        </p>
        {profKey && (
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              color: profColor,
              marginTop: "1px",
            }}
          >
            {getProfessionLabel(profKey)}
          </p>
        )}
      </div>
      {/* Top stat or selection tick */}
      {selectionMode ? (
        <div
          style={{
            width: 14,
            height: 14,
            flexShrink: 0,
            border: `1px solid ${isSelected ? "var(--color-gold)" : "var(--color-border)"}`,
            background: isSelected ? "var(--color-gold)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          {isSelected && (
            <span style={{ color: "#1a1612", fontSize: "9px", lineHeight: 1, fontWeight: 700 }}>✓</span>
          )}
        </div>
      ) : (
        skill && (
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "12px",
              fontWeight: 600,
              color: profColor,
              flexShrink: 0,
            }}
          >
            {(skill.value * 10).toFixed(1)}
          </span>
        )
      )}
    </button>
  );
}

// ── Bulk action button ────────────────────────────────────────────────────────

function BulkBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={GHOST_BTN}
      onMouseEnter={(e) => goldHover(e, true)}
      onMouseLeave={(e) => goldHover(e, false)}
    >
      {label}
    </button>
  );
}

// ── Miniature select-all checkbox ─────────────────────────────────────────────

function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  return (
    <div
      onClick={onChange}
      title={checked ? "Deselect all visible" : "Select all visible"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 14,
        height: 14,
        border: `1px solid ${checked || indeterminate ? "var(--color-gold)" : "var(--color-border)"}`,
        background: checked ? "var(--color-gold)" : "transparent",
        cursor: "pointer",
        flexShrink: 0,
        transition: "all 0.15s ease",
      }}
    >
      {checked && <span style={{ color: "#1a1612", fontSize: "9px", fontWeight: 700, lineHeight: 1 }}>✓</span>}
      {!checked && indeterminate && <span style={{ color: "var(--color-gold)", fontSize: "10px", lineHeight: 1 }}>−</span>}
    </div>
  );
}

// ── Main module ───────────────────────────────────────────────────────────────

export default function CharactersModule() {
  const { isLoaded, saveData, updateStateJson } = useSaveFile();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [profFilter, setProfFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"default" | "name" | "skill-desc" | "mood-asc">("default");
  const [pendingBulk, setPendingBulk] = useState<"maxAll" | "removeCaps" | null>(null);

  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastSelectedIdx, setLastSelectedIdx] = useState<number | null>(null);

  const characters = saveData?.stateJson?.characters ?? [];
  const gameDate = useMemo(
    () => (saveData?.stateJson ? parseGameDate(saveData.stateJson) : null),
    [saveData]
  );

  const filtered = useMemo(() => {
    let list = showAll ? characters : characters.filter((c) => c.studioId !== null);
    if (profFilter !== "all") {
      list = list.filter((c) => {
        const p = getPrimaryProfession(c.professions);
        if (profFilter === "management") return p !== null && MANAGEMENT_KEYS.has(p);
        return p === profFilter;
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => {
        const name = displayName(c).toLowerCase();
        return name.includes(q) || String(c.id).includes(q);
      });
    }
    if (sortKey === "name") {
      list = [...list].sort((a, b) => displayName(a).localeCompare(displayName(b)));
    } else if (sortKey === "skill-desc") {
      list = [...list].sort((a, b) => (topSkill(b)?.value ?? 0) - (topSkill(a)?.value ?? 0));
    } else if (sortKey === "mood-asc") {
      list = [...list].sort((a, b) => parseFloat(a.mood) - parseFloat(b.mood));
    }
    return list;
  }, [characters, showAll, profFilter, search, sortKey]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
    setLastSelectedIdx(null);
  }, [showAll, profFilter, search, sortKey]);

  const availableProfs = useMemo(() => {
    const base = showAll ? characters : characters.filter((c) => c.studioId !== null);
    const seen = new Set<string>();
    let hasManagement = false;
    for (const c of base) {
      const p = getPrimaryProfession(c.professions);
      if (!p) continue;
      if (MANAGEMENT_KEYS.has(p)) {
        hasManagement = true;
      } else {
        seen.add(p);
      }
    }
    const result = [...seen].sort();
    if (hasManagement) result.push("management");
    return result;
  }, [characters, showAll]);

  const selectedChar = useMemo(
    () => filtered.find((c) => c.id === selectedId) ?? null,
    [filtered, selectedId]
  );

  const handleUpdate = useCallback(
    (charId: number, updater: (c: Character) => void) => {
      updateStateJson((s) => {
        const char = s.characters.find((c) => c.id === charId);
        if (char) updater(char);
      });
    },
    [updateStateJson]
  );

  // ── Selection mode ────────────────────────────────────────────────────────

  const enterSelectionMode = () => {
    setSelectedIds(new Set());
    setLastSelectedIdx(null);
    setSelectionMode(true);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setLastSelectedIdx(null);
  };

  const handleToggleSelect = useCallback(
    (charId: number, charIdx: number, shift: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (shift && lastSelectedIdx !== null) {
          const start = Math.min(lastSelectedIdx, charIdx);
          const end = Math.max(lastSelectedIdx, charIdx);
          for (let i = start; i <= end; i++) next.add(filtered[i].id);
        } else {
          if (next.has(charId)) next.delete(charId);
          else next.add(charId);
        }
        return next;
      });
      if (!shift) setLastSelectedIdx(charIdx);
    },
    [filtered, lastSelectedIdx]
  );

  const handleSelectAll = useCallback(() => {
    const allSelected = filtered.every((c) => selectedIds.has(c.id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const c of filtered) next.delete(c.id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const c of filtered) next.add(c.id);
        return next;
      });
    }
  }, [filtered, selectedIds]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));
  const someVisibleSelected = !allVisibleSelected && filtered.some((c) => selectedIds.has(c.id));

  // ── Global bulk actions ───────────────────────────────────────────────────

  const confirmBulkMaxAll = useCallback(() => {
    const scope = showAll ? "all characters" : "employed characters";
    updateStateJson((s) => {
      for (const c of s.characters) {
        if (!showAll && c.studioId === null) continue;
        for (const k of Object.keys(c.professions)) c.professions[k] = "1.000";
        c.limit = "1.000";
        c.Limit = "1.000";
        c.mood = "1.000";
        c.attitude = "1.000";
        if (!c.whiteTagsNEW) c.whiteTagsNEW = {};
        const wt = c.whiteTagsNEW as Record<string, Record<string, unknown>>;
        if (wt?.ART) wt.ART.value = "1.000";
        if (wt?.COM) wt.COM.value = "1.000";
        if ("Cinematographer" in c.professions) {
          for (const key of ["INDOOR", "OUTDOOR"]) {
            if (!wt[key]) wt[key] = { overallValues: [], id: key, dateAdded: "0001-01-01T00:00:00", movieId: 0, value: "0.000", IsOverall: false };
            wt[key].value = "0.400";
          }
        }
      }
    }, `Characters — max all stats (${scope})`);
    setPendingBulk(null);
  }, [updateStateJson, showAll]);

  const confirmBulkRemoveCaps = useCallback(() => {
    const scope = showAll ? "all characters" : "employed characters";
    updateStateJson((s) => {
      for (const c of s.characters) {
        if (!showAll && c.studioId === null) continue;
        c.limit = "1.000";
        c.Limit = "1.000";
      }
    }, `Characters — remove caps (${scope})`);
    setPendingBulk(null);
  }, [updateStateJson, showAll]);

  // ── Selection-scoped bulk actions ─────────────────────────────────────────

  const applyToSelected = useCallback(
    (updater: (c: Character) => void, label: string) => {
      updateStateJson((s) => {
        for (const c of s.characters) {
          if (selectedIds.has(c.id)) updater(c);
        }
      }, label);
    },
    [updateStateJson, selectedIds]
  );

  const n = selectedIds.size;

  const applySelMaxAll = useCallback(() =>
    applyToSelected((c) => {
      for (const k of Object.keys(c.professions)) c.professions[k] = "1.000";
      c.limit = "1.000";
      c.Limit = "1.000";
      c.mood = "1.000";
      c.attitude = "1.000";
      if (!c.whiteTagsNEW) c.whiteTagsNEW = {};
      const wt = c.whiteTagsNEW as Record<string, Record<string, unknown>>;
      if (wt?.ART) wt.ART.value = "1.000";
      if (wt?.COM) wt.COM.value = "1.000";
      if ("Cinematographer" in c.professions) {
        for (const key of ["INDOOR", "OUTDOOR"]) {
          if (!wt[key]) wt[key] = { overallValues: [], id: key, dateAdded: "0001-01-01T00:00:00", movieId: 0, value: "0.000", IsOverall: false };
          wt[key].value = "0.400";
        }
      }
    }, `Characters — max all (${n} selected)`),
  [applyToSelected, n]);

  const applySelMaxFilmingSkills = useCallback(() =>
    applyToSelected((c) => {
      if (!("Cinematographer" in c.professions)) return;
      if (!c.whiteTagsNEW) c.whiteTagsNEW = {};
      const wt = c.whiteTagsNEW as Record<string, Record<string, unknown>>;
      for (const key of ["INDOOR", "OUTDOOR"]) {
        if (!wt[key]) wt[key] = { overallValues: [], id: key, dateAdded: "0001-01-01T00:00:00", movieId: 0, value: "0.000", IsOverall: false };
        wt[key].value = "0.400";
      }
    }, `Characters — max filming skills (${n} selected)`),
  [applyToSelected, n]);

  const applySelMaxSkills = useCallback(() =>
    applyToSelected((c) => {
      for (const k of Object.keys(c.professions)) c.professions[k] = "1.000";
    }, `Characters — max skills (${n} selected)`),
  [applyToSelected, n]);

  const applySelMaxCap = useCallback(() =>
    applyToSelected(
      (c) => { c.limit = "1.000"; c.Limit = "1.000"; },
      `Characters — max cap (${n} selected)`
    ),
  [applyToSelected, n]);

  const applySelMaxHappiness = useCallback(() =>
    applyToSelected(
      (c) => { c.mood = "1.000"; },
      `Characters — max happiness (${n} selected)`
    ),
  [applyToSelected, n]);

  const applySelMaxLoyalty = useCallback(() =>
    applyToSelected(
      (c) => { c.attitude = "1.000"; },
      `Characters — max loyalty (${n} selected)`
    ),
  [applyToSelected, n]);

  const applySelMaxAppeal = useCallback(() =>
    applyToSelected((c) => {
      const wt = c.whiteTagsNEW as Record<string, Record<string, unknown>> | undefined;
      if (wt?.ART) wt.ART.value = "1.000";
      if (wt?.COM) wt.COM.value = "1.000";
    }, `Characters — max appeal (${n} selected)`),
  [applyToSelected, n]);

  if (!isLoaded) {
    return (
      <div style={{ padding: "32px 36px" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "12px" }}>
          Characters
        </h1>
        <p style={{ fontFamily: "var(--font-ui)", fontSize: "12px", color: "var(--color-text-muted)" }}>
          Upload a save file to edit characters
        </p>
      </div>
    );
  }

  return (
    <>
    {pendingBulk === "maxAll" && (
      <ConfirmDialog
        message={`This will set all skills, morale, and appeal to maximum for ${filtered.length} ${showAll ? "" : "employed "}character${filtered.length !== 1 ? "s" : ""}. This cannot be undone without re-uploading your original save.`}
        onConfirm={confirmBulkMaxAll}
        onCancel={() => setPendingBulk(null)}
      />
    )}
    {pendingBulk === "removeCaps" && (
      <ConfirmDialog
        message={`This will remove skill caps for ${filtered.length} ${showAll ? "" : "employed "}character${filtered.length !== 1 ? "s" : ""}. This cannot be undone without re-uploading your original save.`}
        onConfirm={confirmBulkRemoveCaps}
        onCancel={() => setPendingBulk(null)}
      />
    )}
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* ── List panel ── */}
      <div
        style={{
          width: "clamp(360px, 35%, 500px)",
          flexShrink: 0,
          borderRight: "1px solid var(--color-border-subtle)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Filter bar */}
        <div
          style={{
            padding: "12px",
            borderBottom: "1px solid var(--color-border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <input
            type="text"
            placeholder="Search name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "11px",
              color: "var(--color-text-primary)",
              background: "var(--color-bg-raised)",
              border: "1px solid var(--color-border)",
              padding: "6px 10px",
              outline: "none",
              width: "100%",
            }}
          />
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => setShowAll((a) => !a)}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: showAll ? "var(--color-text-muted)" : "var(--color-gold)",
                background: "transparent",
                border: showAll
                  ? "1px solid var(--color-border)"
                  : "1px solid var(--color-gold-mid)",
                padding: "3px 8px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
            >
              {showAll ? "All (incl. fired)" : "Employed"}
            </button>
            <select
              value={profFilter}
              onChange={(e) => setProfFilter(e.target.value)}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                color: "var(--color-text-secondary)",
                background: "var(--color-bg-raised)",
                border: "1px solid var(--color-border)",
                padding: "3px 6px",
                flex: 1,
                minWidth: 0,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="all">All professions</option>
              {availableProfs.map((p) => (
                <option key={p} value={p}>
                  {p === "management" ? "Management" : getProfessionLabel(p)}
                </option>
              ))}
            </select>
          </div>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              color: "var(--color-text-secondary)",
              background: "var(--color-bg-raised)",
              border: "1px solid var(--color-border)",
              padding: "3px 6px",
              width: "100%",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="default">Sort: hire order</option>
            <option value="name">Sort: name A–Z</option>
            <option value="skill-desc">Sort: top skill ↓</option>
            <option value="mood-asc">Sort: mood ↑ (triage)</option>
          </select>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "10px", color: "var(--color-text-muted)" }}>
            {filtered.length} character{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Bulk actions — context-sensitive */}
        <div
          style={{
            padding: "6px 12px",
            borderBottom: "1px solid var(--color-border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            flexShrink: 0,
            background: "var(--color-bg-raised)",
          }}
        >
          {selectionMode ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-ui)", fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", color: selectedIds.size > 0 ? "var(--color-gold)" : "var(--color-text-muted)" }}>
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select characters"}
                </span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {selectedIds.size > 0 && (
                    <button
                      onClick={() => { setSelectedIds(new Set()); setLastSelectedIdx(null); }}
                      style={{ fontFamily: "var(--font-ui)", fontSize: "9px", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-text-muted)", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-primary)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; }}
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={exitSelectionMode}
                    style={{ fontFamily: "var(--font-ui)", fontSize: "9px", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-gold)", background: "transparent", border: "1px solid var(--color-gold-mid)", padding: "1px 6px", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gold-mid)"; e.currentTarget.style.color = "#1a1612"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-gold)"; }}
                  >
                    Done
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                <BulkBtn label="Max All" onClick={applySelMaxAll} />
                <BulkBtn label="Max Skills" onClick={applySelMaxSkills} />
                <BulkBtn label="Max Cap" onClick={applySelMaxCap} />
                <BulkBtn label="Max Happiness" onClick={applySelMaxHappiness} />
                <BulkBtn label="Max Loyalty" onClick={applySelMaxLoyalty} />
                <BulkBtn label="Max Appeal" onClick={applySelMaxAppeal} />
                <BulkBtn label="Max Filming Skills" onClick={applySelMaxFilmingSkills} />
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-ui)", fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                  Bulk actions
                </span>
                <button
                  onClick={enterSelectionMode}
                  style={{ fontFamily: "var(--font-ui)", fontSize: "9px", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-text-muted)", background: "transparent", border: "1px solid var(--color-border)", padding: "1px 6px", cursor: "pointer", transition: "all 0.15s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-gold)"; e.currentTarget.style.borderColor = "var(--color-gold-mid)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.borderColor = "var(--color-border)"; }}
                >
                  Select
                </button>
              </div>
              <BulkBtn label="Max All Stats" onClick={() => setPendingBulk("maxAll")} />
              <BulkBtn label="Uncap All Skills" onClick={() => setPendingBulk("removeCaps")} />
            </>
          )}
        </div>

        {/* Select-all row — only in selection mode */}
        {selectionMode && (
          <div
            style={{
              padding: "5px 12px",
              borderBottom: "1px solid var(--color-border-subtle)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <SelectAllCheckbox
              checked={allVisibleSelected}
              indeterminate={someVisibleSelected}
              onChange={handleSelectAll}
            />
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "10px", color: "var(--color-text-muted)", userSelect: "none" }}>
              Select all visible
            </span>
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.map((char, idx) => (
            <CharRow
              key={char.id}
              char={char}
              isActive={char.id === selectedId}
              isSelected={selectedIds.has(char.id)}
              selectionMode={selectionMode}
              onOpen={() => setSelectedId(char.id)}
              onToggleSelect={(shift) => handleToggleSelect(char.id, idx, shift)}
            />
          ))}
          {filtered.length === 0 && (
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "11px",
                color: "var(--color-text-muted)",
                padding: "24px 12px",
                textAlign: "center",
              }}
            >
              No characters found
            </p>
          )}
        </div>
      </div>

      {/* ── Detail panel ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {selectedChar ? (
          <DetailPanel
            key={selectedChar.id}
            char={selectedChar}
            gameDate={gameDate}
            onUpdate={(updater) => handleUpdate(selectedChar.id, updater)}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "12px",
              color: "var(--color-text-muted)",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1" opacity={0.25}>
              <circle cx="18" cy="13" r="7" />
              <path d="M4 34c0-7.7 6.3-14 14-14s14 6.3 14 14" />
            </svg>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "16px" }}>
              Select a character
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
