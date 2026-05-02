"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSaveFile } from "@/context/SaveFileContext";
import type { Character } from "@/lib/save-file";
import { parseGameDate } from "@/lib/script-suggestions";
import {
  getPrimaryProfession,
  getProfessionColor,
  getProfessionLabel,
  MANAGEMENT_KEYS,
} from "@/data/professions";
import DetailPanel, { moodColor, displayName, KNOWN_LABELS, LABEL_INFO } from "./CharacterDetailPanel";
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
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: moodColor(char.mood),
          flexShrink: 0,
        }}
      />
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

function BulkBtn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...GHOST_BTN, opacity: disabled ? 0.4 : 1, cursor: disabled ? "default" : "pointer" }}
      onMouseEnter={(e) => { if (!disabled) goldHover(e, true); }}
      onMouseLeave={(e) => { if (!disabled) goldHover(e, false); }}
    >
      {label}
    </button>
  );
}

// ── Selection summary (right panel in selection mode) ─────────────────────────

function SelectionSummary({ selectedIds, characters }: { selectedIds: Set<number>; characters: Character[] }) {
  if (selectedIds.size === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "12px",
          color: "var(--color-text-muted)",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1" opacity={0.25}>
          <rect x="4" y="4" width="28" height="28" rx="1" />
          <path d="M10 18h16M18 10v16" strokeWidth="1.5" />
        </svg>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: "16px" }}>Select characters</p>
        <p style={{ fontFamily: "var(--font-ui)", fontSize: "11px", color: "var(--color-text-muted)", lineHeight: "1.6", maxWidth: "200px" }}>
          Click rows to select · Shift+click for ranges · Use the panel on the left to apply bulk changes
        </p>
      </div>
    );
  }

  const selected = characters.filter((c) => selectedIds.has(c.id));
  const byProf: Record<string, { count: number; color: string }> = {};
  for (const c of selected) {
    const pk = getPrimaryProfession(c.professions);
    const label = pk ? getProfessionLabel(pk) : "Other";
    const color = pk ? getProfessionColor(pk) : "#9a9280";
    if (!byProf[label]) byProf[label] = { count: 0, color };
    byProf[label].count++;
  }

  return (
    <div style={{ padding: "32px 36px" }}>
      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "22px",
          fontWeight: 600,
          color: "var(--color-text-primary)",
          marginBottom: "4px",
        }}
      >
        {selectedIds.size} selected
      </h2>
      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "11px",
          color: "var(--color-text-muted)",
          marginBottom: "24px",
        }}
      >
        Use the action panel on the left to apply bulk changes.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {Object.entries(byProf)
          .sort((a, b) => b[1].count - a[1].count)
          .map(([prof, { count, color }]) => (
            <div key={prof} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: 3, height: 16, background: color, flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                  flex: 1,
                }}
              >
                {prof}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                }}
              >
                {count}
              </span>
            </div>
          ))}
      </div>
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
  const [pendingTraitAdd, setPendingTraitAdd] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastSelectedIdx, setLastSelectedIdx] = useState<number | null>(null);
  const [bulkAddTrait, setBulkAddTrait] = useState("");

  // Toast state
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Checkbox ref for indeterminate state
  const checkboxRef = useRef<HTMLInputElement>(null);

  // Ref to read current selection size inside filter-change effect without re-triggering it
  const selectedSizeRef = useRef(0);
  selectedSizeRef.current = selectedIds.size;

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

  const availableProfs = useMemo(() => {
    const base = showAll ? characters : characters.filter((c) => c.studioId !== null);
    const seen = new Set<string>();
    let hasManagement = false;
    for (const c of base) {
      const p = getPrimaryProfession(c.professions);
      if (!p) continue;
      if (MANAGEMENT_KEYS.has(p)) hasManagement = true;
      else seen.add(p);
    }
    const result = [...seen].sort();
    if (hasManagement) result.push("management");
    return result;
  }, [characters, showAll]);

  const selectedChar = useMemo(
    () => filtered.find((c) => c.id === selectedId) ?? null,
    [filtered, selectedId]
  );

  const allVisibleSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));
  const someVisibleSelected = !allVisibleSelected && filtered.some((c) => selectedIds.has(c.id));

  // ── Toast ─────────────────────────────────────────────────────────────────

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, key: Date.now() });
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // Sync indeterminate attribute on native checkbox (cannot be set via React props)
  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = someVisibleSelected;
  }, [someVisibleSelected]);

  // Clear selection when filters change; warn if selection was non-empty
  useEffect(() => {
    const size = selectedSizeRef.current;
    if (size > 0) {
      showToast(`Filter changed — ${size} character${size !== 1 ? "s" : ""} deselected`);
    }
    setSelectedIds(new Set());
    setLastSelectedIdx(null);
    // showToast is stable; only filter deps should trigger this
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll, profFilter, search, sortKey]);

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

  const handleUpdate = useCallback(
    (charId: number, updater: (c: Character) => void) => {
      updateStateJson((s) => {
        const char = s.characters.find((c) => c.id === charId);
        if (char) updater(char);
      });
    },
    [updateStateJson]
  );

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
        if ("Actor" in c.professions || "Director" in c.professions) {
          if (!wt.ART) wt.ART = { overallValues: [], id: "ART", dateAdded: "0001-01-01T00:00:00", movieId: 0, value: "0.000", IsOverall: false };
          if (!wt.COM) wt.COM = { overallValues: [], id: "COM", dateAdded: "0001-01-01T00:00:00", movieId: 0, value: "0.000", IsOverall: false };
          wt.ART.value = "1.000";
          wt.COM.value = "1.000";
        }
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

  const countEligible = useCallback(
    (predicate: (c: Character) => boolean) =>
      characters.filter((c) => selectedIds.has(c.id) && predicate(c)).length,
    [characters, selectedIds]
  );

  const n = selectedIds.size;

  const applySelMaxAll = useCallback(() => {
    applyToSelected((c) => {
      for (const k of Object.keys(c.professions)) c.professions[k] = "1.000";
      c.limit = "1.000";
      c.Limit = "1.000";
      c.mood = "1.000";
      c.attitude = "1.000";
      if (!c.whiteTagsNEW) c.whiteTagsNEW = {};
      const wt = c.whiteTagsNEW as Record<string, Record<string, unknown>>;
      if ("Actor" in c.professions || "Director" in c.professions) {
        if (!wt.ART) wt.ART = { overallValues: [], id: "ART", dateAdded: "0001-01-01T00:00:00", movieId: 0, value: "0.000", IsOverall: false };
        if (!wt.COM) wt.COM = { overallValues: [], id: "COM", dateAdded: "0001-01-01T00:00:00", movieId: 0, value: "0.000", IsOverall: false };
        wt.ART.value = "1.000";
        wt.COM.value = "1.000";
      }
      if ("Cinematographer" in c.professions) {
        for (const key of ["INDOOR", "OUTDOOR"]) {
          if (!wt[key]) wt[key] = { overallValues: [], id: key, dateAdded: "0001-01-01T00:00:00", movieId: 0, value: "0.000", IsOverall: false };
          wt[key].value = "0.400";
        }
      }
    }, `Characters — max all (${n} selected)`);
    showToast(`Max All applied to ${n} character${n !== 1 ? "s" : ""}`);
  }, [applyToSelected, n, showToast]);

  const applySelMaxSkills = useCallback(() => {
    applyToSelected((c) => {
      for (const k of Object.keys(c.professions)) c.professions[k] = "1.000";
    }, `Characters — max skills (${n} selected)`);
    showToast(`Max Skills applied to ${n} character${n !== 1 ? "s" : ""}`);
  }, [applyToSelected, n, showToast]);

  const applySelMaxCap = useCallback(() => {
    applyToSelected(
      (c) => { c.limit = "1.000"; c.Limit = "1.000"; },
      `Characters — max cap (${n} selected)`
    );
    showToast(`Max Cap applied to ${n} character${n !== 1 ? "s" : ""}`);
  }, [applyToSelected, n, showToast]);

  const applySelMaxHappiness = useCallback(() => {
    applyToSelected(
      (c) => { c.mood = "1.000"; },
      `Characters — max happiness (${n} selected)`
    );
    showToast(`Max Happiness applied to ${n} character${n !== 1 ? "s" : ""}`);
  }, [applyToSelected, n, showToast]);

  const applySelMaxLoyalty = useCallback(() => {
    applyToSelected(
      (c) => { c.attitude = "1.000"; },
      `Characters — max loyalty (${n} selected)`
    );
    showToast(`Max Loyalty applied to ${n} character${n !== 1 ? "s" : ""}`);
  }, [applyToSelected, n, showToast]);

  const applySelMaxArtistic = useCallback(() => {
    const isEligible = (c: Character) => "Actor" in c.professions || "Director" in c.professions;
    const eligible = countEligible(isEligible);
    applyToSelected((c) => {
      if (!isEligible(c)) return;
      if (!c.whiteTagsNEW) c.whiteTagsNEW = {};
      const wt = c.whiteTagsNEW as Record<string, Record<string, unknown>>;
      if (!wt.ART) wt.ART = { overallValues: [], id: "ART", dateAdded: "0001-01-01T00:00:00", movieId: 0, value: "0.000", IsOverall: false };
      wt.ART.value = "1.000";
    }, `Characters — max artistic appeal (${n} selected)`);
    const skipped = n - eligible;
    showToast(skipped > 0
      ? `Max Artistic: ${eligible} of ${n} applied — ${skipped} skipped (not Actors/Directors)`
      : `Max Artistic applied to ${eligible} character${eligible !== 1 ? "s" : ""}`
    );
  }, [applyToSelected, countEligible, n, showToast]);

  const applySelMaxCommercial = useCallback(() => {
    const isEligible = (c: Character) => "Actor" in c.professions || "Director" in c.professions;
    const eligible = countEligible(isEligible);
    applyToSelected((c) => {
      if (!isEligible(c)) return;
      if (!c.whiteTagsNEW) c.whiteTagsNEW = {};
      const wt = c.whiteTagsNEW as Record<string, Record<string, unknown>>;
      if (!wt.COM) wt.COM = { overallValues: [], id: "COM", dateAdded: "0001-01-01T00:00:00", movieId: 0, value: "0.000", IsOverall: false };
      wt.COM.value = "1.000";
    }, `Characters — max commercial appeal (${n} selected)`);
    const skipped = n - eligible;
    showToast(skipped > 0
      ? `Max Commercial: ${eligible} of ${n} applied — ${skipped} skipped (not Actors/Directors)`
      : `Max Commercial applied to ${eligible} character${eligible !== 1 ? "s" : ""}`
    );
  }, [applyToSelected, countEligible, n, showToast]);

  const applySelMaxFilmingSkills = useCallback(() => {
    const isEligible = (c: Character) => "Cinematographer" in c.professions;
    const eligible = countEligible(isEligible);
    applyToSelected((c) => {
      if (!isEligible(c)) return;
      if (!c.whiteTagsNEW) c.whiteTagsNEW = {};
      const wt = c.whiteTagsNEW as Record<string, Record<string, unknown>>;
      for (const key of ["INDOOR", "OUTDOOR"]) {
        if (!wt[key]) wt[key] = { overallValues: [], id: key, dateAdded: "0001-01-01T00:00:00", movieId: 0, value: "0.000", IsOverall: false };
        wt[key].value = "0.400";
      }
    }, `Characters — max filming skills (${n} selected)`);
    const skipped = n - eligible;
    showToast(skipped > 0
      ? `Max Filming Skills: ${eligible} of ${n} applied — ${skipped} skipped (not Cinematographers)`
      : `Max Filming Skills applied to ${eligible} character${eligible !== 1 ? "s" : ""}`
    );
  }, [applyToSelected, countEligible, n, showToast]);

  const applySelAddTrait = useCallback((label: string) => {
    const doIt = () => {
      applyToSelected((c) => {
        if (!Array.isArray(c.labels)) c.labels = [];
        if (!(c.labels as string[]).includes(label))
          (c.labels as string[]).push(label);
      }, `Characters — add trait ${label} (${n} selected)`);
      showToast(`Trait "${label}" added to ${n} character${n !== 1 ? "s" : ""}`);
      setBulkAddTrait("");
    };
    const addCaution = LABEL_INFO[label]?.addCaution;
    if (addCaution) {
      setPendingTraitAdd({ message: `${addCaution} Add to ${n} selected character${n !== 1 ? "s" : ""}?`, onConfirm: doIt });
    } else {
      doIt();
    }
  }, [applyToSelected, n, showToast]);

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
      {pendingTraitAdd && (
        <ConfirmDialog
          message={pendingTraitAdd.message}
          onConfirm={() => { pendingTraitAdd.onConfirm(); setPendingTraitAdd(null); }}
          onCancel={() => setPendingTraitAdd(null)}
        />
      )}
      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
        {/* ── List panel ── */}
        <div
          style={{
            width: "clamp(360px, 35%, 500px)",
            flexShrink: 0,
            borderRight: "1px solid var(--color-border-subtle)",
            borderTop: `2px solid ${selectionMode ? "var(--color-gold)" : "transparent"}`,
            transition: "border-top-color 0.2s ease",
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
            {/* Segmented Employed/All + profession filter + Select/Done */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {/* Segmented control */}
              <div style={{ display: "flex", flexShrink: 0 }}>
                <button
                  onClick={() => setShowAll(false)}
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "10px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: !showAll ? "var(--color-gold)" : "var(--color-text-muted)",
                    background: "transparent",
                    border: `1px solid ${!showAll ? "var(--color-gold-mid)" : "var(--color-border)"}`,
                    borderRight: "none",
                    padding: "3px 8px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                >
                  Employed
                </button>
                <button
                  onClick={() => setShowAll(true)}
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "10px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: showAll ? "var(--color-gold)" : "var(--color-text-muted)",
                    background: "transparent",
                    border: `1px solid ${showAll ? "var(--color-gold-mid)" : "var(--color-border)"}`,
                    padding: "3px 8px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                >
                  All
                </button>
              </div>
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
              {/* Select / Done toggle — prominent entry to selection mode */}
              <button
                onClick={selectionMode ? exitSelectionMode : enterSelectionMode}
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "10px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: selectionMode ? "var(--color-gold)" : "var(--color-text-muted)",
                  background: "transparent",
                  border: `1px solid ${selectionMode ? "var(--color-gold-mid)" : "var(--color-border)"}`,
                  padding: "3px 8px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                  minWidth: "46px",
                }}
                onMouseEnter={(e) => {
                  if (!selectionMode) goldHover(e, true);
                }}
                onMouseLeave={(e) => {
                  if (!selectionMode) goldHover(e, false);
                }}
              >
                {selectionMode ? "Done" : "Select"}
              </button>
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

          {/* Bulk actions — fixed height prevents list from jumping on mode switch */}
          <div
            style={{
              padding: "6px 12px",
              borderBottom: "1px solid var(--color-border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              flexShrink: 0,
              background: "var(--color-bg-raised)",
              height: selectionMode ? "218px" : "88px",
              overflow: "hidden",
              transition: "height 0.2s ease",
            }}
          >
            {selectionMode ? (
              <>
                {/* Header: selection count + Clear */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "9px",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: n > 0 ? "var(--color-gold)" : "var(--color-text-muted)",
                    }}
                  >
                    {n > 0 ? `${n} selected` : "Select characters"}
                  </span>
                  {n > 0 && (
                    <button
                      onClick={() => { setSelectedIds(new Set()); setLastSelectedIdx(null); }}
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "9px",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color: "var(--color-text-muted)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-primary)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Max All — primary action, gold-filled */}
                <button
                  disabled={n === 0}
                  onClick={applySelMaxAll}
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "10px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: n === 0 ? "var(--color-text-muted)" : "#1a1612",
                    background: n === 0 ? "transparent" : "var(--color-gold)",
                    border: `1px solid ${n === 0 ? "var(--color-border)" : "var(--color-gold)"}`,
                    padding: "3px 8px",
                    cursor: n === 0 ? "default" : "pointer",
                    opacity: n === 0 ? 0.4 : 1,
                    transition: "all 0.15s ease",
                    width: "100%",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (n > 0) { e.currentTarget.style.background = "#d4af5a"; e.currentTarget.style.borderColor = "#d4af5a"; }
                  }}
                  onMouseLeave={(e) => {
                    if (n > 0) { e.currentTarget.style.background = "var(--color-gold)"; e.currentTarget.style.borderColor = "var(--color-gold)"; }
                  }}
                >
                  Max All
                </button>

                {/* Separator between primary and specific actions */}
                <div style={{ borderBottom: "1px solid var(--color-border-subtle)", margin: "2px 0" }} />

                {/* Grid of specific bulk actions */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                  <BulkBtn label="Max Skills" disabled={n === 0} onClick={applySelMaxSkills} />
                  <BulkBtn label="Max Cap" disabled={n === 0} onClick={applySelMaxCap} />
                  <BulkBtn label="Max Happiness" disabled={n === 0} onClick={applySelMaxHappiness} />
                  <BulkBtn label="Max Loyalty" disabled={n === 0} onClick={applySelMaxLoyalty} />
                  <BulkBtn label="Max Artistic" disabled={n === 0} onClick={applySelMaxArtistic} />
                  <BulkBtn label="Max Commercial" disabled={n === 0} onClick={applySelMaxCommercial} />
                  <BulkBtn label="Max Filming Skills" disabled={n === 0} onClick={applySelMaxFilmingSkills} />
                </div>

                {/* Add trait row */}
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <select
                    value={bulkAddTrait}
                    onChange={(e) => setBulkAddTrait(e.target.value)}
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "10px",
                      color: bulkAddTrait ? "var(--color-text-primary)" : "var(--color-text-muted)",
                      background: "var(--color-bg-raised)",
                      border: "1px solid var(--color-border)",
                      padding: "3px 6px",
                      flex: 1,
                      minWidth: 0,
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="">Add trait…</option>
                    {KNOWN_LABELS.map((l) => (
                      <option key={l} value={l}>
                        {LABEL_INFO[l]?.addCaution ? `⚠ ${l}` : l}
                      </option>
                    ))}
                  </select>
                  <BulkBtn
                    label="Apply"
                    disabled={!bulkAddTrait || n === 0}
                    onClick={() => { if (bulkAddTrait) applySelAddTrait(bulkAddTrait); }}
                  />
                </div>
              </>
            ) : (
              <>
                <span
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "9px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Bulk actions
                </span>
                <BulkBtn label="Max All Stats" onClick={() => setPendingBulk("maxAll")} />
                <BulkBtn label="Uncap All Skills" onClick={() => setPendingBulk("removeCaps")} />
              </>
            )}
          </div>

          {/* Select-all row — only in selection mode; full row is the click target */}
          {selectionMode && (
            <label
              style={{
                padding: "5px 12px",
                borderBottom: "1px solid var(--color-border-subtle)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexShrink: 0,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <div style={{ position: "relative", width: 14, height: 14, flexShrink: 0 }}>
                <input
                  ref={checkboxRef}
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={handleSelectAll}
                  style={{
                    position: "absolute",
                    opacity: 0,
                    width: 14,
                    height: 14,
                    margin: 0,
                    cursor: "pointer",
                  }}
                />
                {/* Custom checkbox face */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    border: `1px solid ${allVisibleSelected || someVisibleSelected ? "var(--color-gold)" : "var(--color-border)"}`,
                    background: allVisibleSelected ? "var(--color-gold)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s ease",
                    pointerEvents: "none",
                  }}
                >
                  {allVisibleSelected && (
                    <span style={{ color: "#1a1612", fontSize: "9px", fontWeight: 700, lineHeight: 1 }}>✓</span>
                  )}
                  {!allVisibleSelected && someVisibleSelected && (
                    <span style={{ color: "var(--color-gold)", fontSize: "10px", lineHeight: 1 }}>−</span>
                  )}
                </div>
              </div>
              <span style={{ fontFamily: "var(--font-ui)", fontSize: "10px", color: "var(--color-text-muted)" }}>
                Select all visible
              </span>
            </label>
          )}

          {/* Character list */}
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

          {/* Toast notification */}
          {toast && (
            <div
              key={toast.key}
              style={{
                flexShrink: 0,
                padding: "6px 12px",
                borderTop: "1px solid var(--color-gold-mid)",
                background: "var(--color-bg-raised)",
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                color: "var(--color-gold)",
                letterSpacing: "0.02em",
              }}
            >
              {toast.msg}
            </div>
          )}
        </div>

        {/* ── Detail / selection summary panel ── */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {selectionMode ? (
            <SelectionSummary selectedIds={selectedIds} characters={characters} />
          ) : selectedChar ? (
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
