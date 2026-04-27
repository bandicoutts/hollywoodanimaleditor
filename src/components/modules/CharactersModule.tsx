"use client";

import { useState, useMemo, useCallback } from "react";
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
  onClick,
}: {
  char: Character;
  isActive: boolean;
  onClick: () => void;
}) {
  const profKey = getPrimaryProfession(char.professions);
  const profColor = profKey ? getProfessionColor(profKey) : "#9a9280";
  const skill = topSkill(char);

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        padding: "8px 12px",
        background: isActive ? "#c9a44a0d" : "transparent",
        borderLeft: isActive ? `2px solid ${profColor}` : "2px solid transparent",
        borderRight: "none",
        borderTop: "none",
        borderBottom: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "#1d1a1580";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
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
      {/* Top stat */}
      {skill && (
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

// ── Main module ───────────────────────────────────────────────────────────────

export default function CharactersModule() {
  const { isLoaded, saveData, updateStateJson } = useSaveFile();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [profFilter, setProfFilter] = useState("all");
  const [search, setSearch] = useState("");

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
    return list;
  }, [characters, showAll, profFilter, search]);

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

  const bulkMaxAll = useCallback(() => {
    updateStateJson((s) => {
      for (const c of s.characters) {
        if (!showAll && c.studioId === null) continue;
        for (const k of Object.keys(c.professions)) c.professions[k] = "1.000";
        c.limit = "1.000";
        c.Limit = "1.000";
        c.mood = "1.000";
        c.attitude = "1.000";
        const wt = c.whiteTagsNEW as Record<string, Record<string, unknown>> | undefined;
        if (wt?.ART) wt.ART.value = "1.000";
        if (wt?.COM) wt.COM.value = "1.000";
      }
    });
  }, [updateStateJson, showAll]);

  const bulkRemoveCaps = useCallback(() => {
    updateStateJson((s) => {
      for (const c of s.characters) {
        if (!showAll && c.studioId === null) continue;
        c.limit = "1.000";
        c.Limit = "1.000";
      }
    });
  }, [updateStateJson, showAll]);

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
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* ── List panel ── */}
      <div
        style={{
          width: 280,
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
              }}
            >
              {showAll ? "All" : "Employed"}
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
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "10px", color: "var(--color-text-muted)" }}>
            {filtered.length} character{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Bulk actions */}
        <div
          style={{
            padding: "8px 12px",
            borderBottom: "1px solid var(--color-border-subtle)",
            display: "flex",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          <BulkBtn label="Max All Stats" onClick={bulkMaxAll} />
          <BulkBtn label="Remove Caps" onClick={bulkRemoveCaps} />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.map((char) => (
            <CharRow
              key={char.id}
              char={char}
              isActive={char.id === selectedId}
              onClick={() => setSelectedId(char.id)}
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
  );
}
