"use client";

import { useState, useMemo, useCallback, useRef, useId } from "react";
import { useSaveFile } from "@/context/SaveFileContext";
import type { Character } from "@/lib/save-file";
import { formatDecimalString } from "@/lib/save-file";
import {
  getPrimaryProfession,
  getProfessionColor,
  getProfessionLabel,
  PROFESSIONS,
} from "@/data/professions";
import { resolveCharacterName } from "@/data/characterNames";

// ── Known labels ──────────────────────────────────────────────────────────────

const KNOWN_LABELS = [
  "ALCOHOLIC", "ARROGANT", "CALM", "CHASTE", "CHEERY", "DEMANDING",
  "DISCIPLINED", "HARDWORKING", "HEARTBREAKER", "HOTHEADED", "IMMORTAL",
  "INDIFFERENT", "JUNKIE", "LAZY", "LEADER", "LUDOMANIAC", "MAIN_CHARACTER",
  "MELANCHOLIC", "MISOGYNIST", "MODEST", "OPEN_MINDED", "PERFECTIONIST",
  "RACIST", "SIMPLE", "STERILE", "SUPER_IMMORTAL", "TEAM_PLAYER",
  "UNDISCIPLINED", "UNTOUCHABLE", "UNWANTED_ACTOR", "XENOPHOBE",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function moodColor(val: string): string {
  const v = parseFloat(val) || 0;
  if (v >= 0.7) return "#8fbc55";
  if (v >= 0.4) return "#c9a44a";
  return "#e08080";
}

function displayName(char: Character): string {
  if (char.customName && typeof char.customName === "string")
    return char.customName;
  const resolved = resolveCharacterName(
    char.firstNameId as string,
    char.lastNameId as string,
  );
  return resolved || `Character #${char.id}`;
}

function topSkill(char: Character): { prof: string; value: number } | null {
  const profs = char.professions;
  const keys = Object.keys(profs);
  if (!keys.length) return null;
  const best = keys.reduce((a, b) =>
    parseFloat(profs[a]) >= parseFloat(profs[b]) ? a : b
  );
  return { prof: best, value: parseFloat(profs[best]) };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProfBadge({ profKey, size = "md" }: { profKey: string; size?: "sm" | "md" }) {
  const color = getProfessionColor(profKey);
  const label = getProfessionLabel(profKey);
  const pad = size === "sm" ? "1px 7px" : "2px 10px";
  const fs = size === "sm" ? "10px" : "11px";
  return (
    <span
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: fs,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color,
        background: color + "18",
        border: `1px solid ${color}40`,
        padding: pad,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

function StatBar({
  label,
  value,
  cap,
  color,
  onChange,
}: {
  label: string;
  value: number;
  cap: number;
  color: string;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");

  const startEdit = () => {
    setInputVal(value.toFixed(3));
    setEditing(true);
  };
  const commit = () => {
    const v = Math.max(0, Math.min(1, parseFloat(inputVal) || 0));
    onChange(v);
    setEditing(false);
  };

  return (
    <div style={{ marginBottom: "14px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "5px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
          }}
        >
          {label}
        </span>
        {editing ? (
          <input
            autoFocus
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "13px",
              fontWeight: 600,
              color,
              background: "transparent",
              border: "none",
              borderBottom: `1px solid ${color}`,
              outline: "none",
              width: "60px",
              textAlign: "right",
              padding: "0 0 1px",
            }}
          />
        ) : (
          <span
            onClick={startEdit}
            title="Click to edit"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "13px",
              fontWeight: 600,
              color,
              borderBottom: "1px dashed var(--color-border)",
              cursor: "text",
            }}
          >
            {value.toFixed(3)}
          </span>
        )}
      </div>
      <div style={{ position: "relative" }}>
        <div
          style={{
            height: "6px",
            background: "var(--color-bg-raised)",
            position: "relative",
            overflow: "visible",
          }}
        >
          {/* Cap marker */}
          <div
            style={{
              position: "absolute",
              left: `${cap * 100}%`,
              top: -2,
              bottom: -2,
              width: "2px",
              background: color + "60",
              zIndex: 1,
            }}
          />
          {/* Skill fill */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${value * 100}%`,
              background: color,
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            margin: 0,
          }}
        />
      </div>
    </div>
  );
}

function PortraitPlaceholder({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 80,
        height: 100,
        flexShrink: 0,
        background: `linear-gradient(to bottom, ${color}18, #1d1a15)`,
        border: `1px solid ${color}40`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
      }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity={0.3}
      >
        <circle cx="14" cy="10" r="5" />
        <path d="M4 26c0-5.5 4.5-10 10-10s10 4.5 10 10" />
      </svg>
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "8px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: color,
          opacity: 0.4,
        }}
      >
        Portrait
      </span>
    </div>
  );
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
  const mood = parseFloat(char.mood) || 0;

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
          {skill.value.toFixed(2)}
        </span>
      )}
    </button>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  char,
  onUpdate,
}: {
  char: Character;
  onUpdate: (updater: (c: Character) => void) => void;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState("");

  const profKey = getPrimaryProfession(char.professions);
  const profColor = profKey ? getProfessionColor(profKey) : "#9a9280";
  const mood = parseFloat(char.mood) || 0;

  const startEditName = () => {
    setNameVal(
      char.customName && typeof char.customName === "string"
        ? char.customName
        : ""
    );
    setEditingName(true);
    setTimeout(() => nameRef.current?.select(), 0);
  };

  const commitName = () => {
    const val = nameVal.trim() || null;
    onUpdate((c) => { c.customName = val; });
    setEditingName(false);
  };

  const setSkill = (profKey: string, value: number) => {
    onUpdate((c) => {
      c.professions[profKey] = formatDecimalString(value);
    });
  };

  const setLimit = (value: number) => {
    onUpdate((c) => {
      c.limit = formatDecimalString(value);
      c.Limit = formatDecimalString(value);
    });
  };

  const setMood = (value: number) =>
    onUpdate((c) => { c.mood = formatDecimalString(value); });
  const setAttitude = (value: number) =>
    onUpdate((c) => { c.attitude = formatDecimalString(value); });
  const setSelfEsteem = (value: number) =>
    onUpdate((c) => { c.selfEsteem = formatDecimalString(value); });

  const setXp = (value: number) =>
    onUpdate((c) => { c.xp = Math.max(0, Math.round(value)); });

  const maxAllStats = () => {
    onUpdate((c) => {
      for (const k of Object.keys(c.professions)) c.professions[k] = "1.000";
      c.limit = "1.000";
      c.Limit = "1.000";
      c.mood = "1.000";
      c.attitude = "1.000";
      c.selfEsteem = "1.000";
    });
  };

  const cap = parseFloat(char.limit) || 1;
  const profEntries = Object.entries(char.professions);

  return (
    <div style={{ padding: "28px 32px", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <PortraitPlaceholder color={profColor} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name */}
          {editingName ? (
            <input
              ref={nameRef}
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                if (e.key === "Escape") setEditingName(false);
              }}
              placeholder={`Character #${char.id}`}
              autoFocus
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: "22px",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${profColor}`,
                outline: "none",
                width: "100%",
                padding: "0 0 2px",
                marginBottom: "8px",
              }}
            />
          ) : (
            <p
              onClick={startEditName}
              title="Click to set custom name"
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: "22px",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                borderBottom: "1px dashed var(--color-border)",
                cursor: "text",
                display: "inline-block",
                marginBottom: "8px",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayName(char)}
            </p>
          )}

          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {profKey && <ProfBadge profKey={profKey} />}
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                color: "var(--color-text-muted)",
                letterSpacing: "0.06em",
              }}
            >
              ID #{char.id}
            </span>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                color: "var(--color-text-muted)",
              }}
            >
              · Mood{" "}
              <span style={{ color: moodColor(char.mood) }}>
                {parseFloat(char.mood).toFixed(2)}
              </span>
            </span>
          </div>
        </div>
      </div>

      <hr className="gold-divider" style={{ marginBottom: "20px" }} />

      {/* Skills */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
          }}
        >
          Ratings
        </p>
        <button
          onClick={maxAllStats}
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            letterSpacing: "0.07em",
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
            e.currentTarget.style.color = "var(--color-gold)";
            e.currentTarget.style.borderColor = "var(--color-gold-mid)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-text-muted)";
            e.currentTarget.style.borderColor = "var(--color-border)";
          }}
        >
          Max All Stats
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0 24px",
        }}
      >
        {profEntries.map(([key, val]) => (
          <StatBar
            key={key}
            label={getProfessionLabel(key)}
            value={parseFloat(val) || 0}
            cap={cap}
            color={getProfessionColor(key)}
            onChange={(v) => setSkill(key, v)}
          />
        ))}
        <StatBar
          label="Skill Cap"
          value={cap}
          cap={1}
          color={profColor + "88"}
          onChange={setLimit}
        />
      </div>

      <hr className="gold-divider" style={{ margin: "8px 0 20px" }} />

      {/* Morale */}
      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "10px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
          marginBottom: "16px",
        }}
      >
        Morale
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <StatBar
          label="Mood"
          value={parseFloat(char.mood) || 0}
          cap={1}
          color={moodColor(char.mood)}
          onChange={setMood}
        />
        <StatBar
          label="Attitude"
          value={parseFloat(char.attitude) || 0}
          cap={1}
          color="#9a9280"
          onChange={setAttitude}
        />
        <StatBar
          label="Self-Esteem"
          value={parseFloat(char.selfEsteem) || 0}
          cap={1}
          color="#9a9280"
          onChange={setSelfEsteem}
        />
        {/* XP */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
              }}
            >
              XP
            </span>
            <XpEditor xp={Math.max(0, char.xp)} onChange={setXp} />
          </div>
        </div>
      </div>

      {/* Labels */}
      <LabelsEditor
        labels={Array.isArray(char.labels) ? (char.labels as string[]) : []}
        onAdd={(label) => onUpdate((c) => { if (!Array.isArray(c.labels)) c.labels = []; (c.labels as string[]).push(label); })}
        onRemove={(label) => onUpdate((c) => { if (Array.isArray(c.labels)) c.labels = (c.labels as string[]).filter((l) => l !== label); })}
      />
    </div>
  );
}

function LabelsEditor({
  labels,
  onAdd,
  onRemove,
}: {
  labels: string[];
  onAdd: (label: string) => void;
  onRemove: (label: string) => void;
}) {
  const selectId = useId();
  const currentSet = new Set(labels);
  const available = KNOWN_LABELS.filter((l) => !currentSet.has(l));

  const unknownLabels = labels.filter((l) => !KNOWN_LABELS.includes(l));
  const allLabels = [...labels];

  return (
    <>
      <hr className="gold-divider" style={{ margin: "8px 0 20px" }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
          }}
        >
          Traits
        </p>
        {/* Add from known list */}
        <select
          id={selectId}
          value=""
          onChange={(e) => { if (e.target.value) onAdd(e.target.value); }}
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            color: "var(--color-text-muted)",
            background: "var(--color-bg-raised)",
            border: "1px solid var(--color-border)",
            padding: "2px 6px",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="">+ Add trait</option>
          {available.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      {allLabels.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "11px",
            color: "var(--color-text-muted)",
            fontStyle: "italic",
          }}
        >
          No traits
        </p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {allLabels.map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: unknownLabels.includes(label) ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
                padding: "2px 6px 2px 8px",
              }}
            >
              {label}
              <button
                onClick={() => onRemove(label)}
                title={`Remove ${label}`}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  fontSize: "12px",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-danger)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function XpEditor({ xp, onChange }: { xp: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");

  const commit = () => {
    onChange(parseInt(val.replace(/\D/g, ""), 10) || 0);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--color-text-primary)",
          background: "transparent",
          border: "none",
          borderBottom: "1px solid var(--color-gold)",
          outline: "none",
          width: "80px",
          textAlign: "right",
          padding: "0 0 1px",
        }}
      />
    );
  }

  return (
    <span
      onClick={() => { setVal(String(xp)); setEditing(true); }}
      title="Click to edit"
      style={{
        fontFamily: "var(--font-serif)",
        fontSize: "13px",
        fontWeight: 600,
        color: "var(--color-text-primary)",
        borderBottom: "1px dashed var(--color-border)",
        cursor: "text",
      }}
    >
      {xp.toLocaleString()}
    </span>
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

  const filtered = useMemo(() => {
    let list = showAll ? characters : characters.filter((c) => c.studioId !== null);
    if (profFilter !== "all") {
      list = list.filter((c) => {
        const p = getPrimaryProfession(c.professions);
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
    for (const c of base) {
      const p = getPrimaryProfession(c.professions);
      if (p) seen.add(p);
    }
    return [...seen].sort();
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
        c.selfEsteem = "1.000";
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
          {/* Search */}
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
          {/* Employed toggle + profession filter */}
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
                  {getProfessionLabel(p)}
                </option>
              ))}
            </select>
          </div>
          {/* Count */}
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              color: "var(--color-text-muted)",
            }}
          >
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

function BulkBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "10px",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--color-text-muted)",
        background: "transparent",
        border: "1px solid var(--color-border)",
        padding: "3px 8px",
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
      {label}
    </button>
  );
}
