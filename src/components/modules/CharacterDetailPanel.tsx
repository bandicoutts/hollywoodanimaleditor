"use client";

import { useState, useRef, useId } from "react";
import type { Character } from "@/lib/save-file";
import { formatDecimalString } from "@/lib/save-file";
import { getPrimaryProfession, getProfessionColor, getProfessionLabel } from "@/data/professions";
import { resolveCharacterName } from "@/data/characterNames";
import StatBar from "./CharacterStatBar";
import ProfBadge from "./CharacterProfBadge";

// ── Constants ─────────────────────────────────────────────────────────────────

const KNOWN_LABELS = [
  "ALCOHOLIC", "ARROGANT", "CALM", "CHASTE", "CHEERY", "DEMANDING",
  "DISCIPLINED", "HARDWORKING", "HEARTBREAKER", "HOTHEADED", "IMMORTAL",
  "INDIFFERENT", "JUNKIE", "LAZY", "LEADER", "LUDOMANIAC", "MAIN_CHARACTER",
  "MELANCHOLIC", "MISOGYNIST", "MODEST", "OPEN_MINDED", "PERFECTIONIST",
  "RACIST", "SIMPLE", "STERILE", "SUPER_IMMORTAL", "TEAM_PLAYER",
  "UNDISCIPLINED", "UNTOUCHABLE", "UNWANTED_ACTOR", "XENOPHOBE",
];

const APPEAL_TIERS = {
  ART: [
    { label: "Promising Talent",    value: 0.25 },
    { label: "Commanding Presence", value: 0.50 },
    { label: "True Artist",         value: 0.75 },
    { label: "Icon",                value: 1.0  },
  ],
  COM: [
    { label: "Rising Star",  value: 0.25 },
    { label: "Star",         value: 0.50 },
    { label: "Superstar",    value: 0.75 },
    { label: "Legend",       value: 1.0  },
  ],
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function moodColor(val: string): string {
  const v = parseFloat(val) || 0;
  if (v >= 0.7) return "#8fbc55";
  if (v >= 0.4) return "#c9a44a";
  return "#e08080";
}

export function displayName(char: Character): string {
  if (char.customName && typeof char.customName === "string") return char.customName;
  const resolved = resolveCharacterName(char.firstNameId as string, char.lastNameId as string);
  return resolved || `Character #${char.id}`;
}

function isAppealEligible(professions: Record<string, string>): boolean {
  return "Actor" in professions || "Director" in professions;
}

function isLieutenant(professions: Record<string, string>): boolean {
  return Object.keys(professions).some((k) => k.startsWith("Lieut"));
}

function getAppealTierLabel(value: number, type: "ART" | "COM"): string | null {
  const tiers = APPEAL_TIERS[type];
  if (value >= 1.0) return tiers[3].label;
  if (value >= 0.75) return tiers[2].label;
  if (value >= 0.50) return tiers[1].label;
  if (value >= 0.25) return tiers[0].label;
  return null;
}

// ── Age helpers ───────────────────────────────────────────────────────────────

function parseBirthDate(str: unknown): Date | null {
  if (typeof str !== "string") return null;
  const parts = str.split("-");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  return new Date(y, m - 1, d);
}

function computeAge(gameDate: Date, birthDate: Date): number {
  let age = gameDate.getFullYear() - birthDate.getFullYear();
  const md = gameDate.getMonth() - birthDate.getMonth();
  if (md < 0 || (md === 0 && gameDate.getDate() < birthDate.getDate())) age--;
  return Math.max(0, age);
}

function birthDateFromAge(age: number, existing: Date | null, gameDate: Date): string {
  const day = existing?.getDate() ?? 1;
  const month = existing ? existing.getMonth() + 1 : 1;
  const year = gameDate.getFullYear() - age;
  return `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;
}

// ── Portrait placeholder ──────────────────────────────────────────────────────

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

// ── Age editor ────────────────────────────────────────────────────────────────

function AgeEditor({
  char,
  gameDate,
  onUpdate,
}: {
  char: Character;
  gameDate: Date;
  onUpdate: (u: (c: Character) => void) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");

  const birthDate = parseBirthDate(char.birthDate);
  const age = birthDate ? computeAge(gameDate, birthDate) : null;

  const commit = () => {
    const newAge = parseInt(val.replace(/\D/g, ""), 10);
    if (!isNaN(newAge) && newAge >= 0 && newAge < 200) {
      onUpdate((c) => {
        c.birthDate = birthDateFromAge(newAge, parseBirthDate(c.birthDate), gameDate);
      });
    }
    setEditing(false);
  };

  if (age === null) return null;

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
          width: "44px",
          textAlign: "right",
          padding: "0 0 1px",
        }}
      />
    );
  }

  return (
    <span
      onClick={() => { setVal(String(age)); setEditing(true); }}
      title="Click to edit age"
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "10px",
        color: "var(--color-text-muted)",
        borderBottom: "1px dashed var(--color-border)",
        cursor: "text",
      }}
    >
      Age {age}
    </span>
  );
}

// ── XP editor ─────────────────────────────────────────────────────────────────

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

// ── Bonus editor ──────────────────────────────────────────────────────────────

function BonusEditor({ pct, onChange }: { pct: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");

  const commit = () => {
    const parsed = parseInt(val.replace(/[^\d]/g, ""), 10) || 0;
    onChange(Math.round(parsed / 10) * 10);
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
          width: "60px",
          textAlign: "right",
          padding: "0 0 1px",
        }}
      />
    );
  }

  return (
    <span
      onClick={() => { setVal(String(pct)); setEditing(true); }}
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
      {pct}%
    </span>
  );
}

// ── Upgrade bonus section ─────────────────────────────────────────────────────

const FIELD_LABEL_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "10px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
};

function UpgradeBonusSection({
  char,
  onSetBonus,
}: {
  char: Character;
  onSetBonus: (field: "BonusCardMoney" | "BonusCardInfluencePoints", pct: number) => void;
}) {
  const moneyPct = Math.round((char.BonusCardMoney ?? 0) * 10);
  const ipPct = Math.round((char.BonusCardInfluencePoints ?? 0) * 10);

  return (
    <>
      <hr className="gold-divider" style={{ margin: "8px 0 20px" }} />
      <p style={{ ...FIELD_LABEL_STYLE, marginBottom: "14px" }}>Upgrade Bonuses</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={FIELD_LABEL_STYLE}>Money</span>
        <BonusEditor pct={moneyPct} onChange={(v) => onSetBonus("BonusCardMoney", v)} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={FIELD_LABEL_STYLE}>Influence Points</span>
        <BonusEditor pct={ipPct} onChange={(v) => onSetBonus("BonusCardInfluencePoints", v)} />
      </div>
    </>
  );
}

// ── Appeal column ─────────────────────────────────────────────────────────────

function AppealColumn({
  type,
  value,
  color,
  onSetAppeal,
}: {
  type: "ART" | "COM";
  value: number;
  color: string;
  onSetAppeal: (type: "ART" | "COM", value: number) => void;
}) {
  const tiers = APPEAL_TIERS[type];
  const currentTier = getAppealTierLabel(value, type);
  const label = type === "ART" ? "Artistic Appeal" : "Commercial Appeal";

  return (
    <div>
      <StatBar
        label={label}
        value={value}
        cap={1}
        color={color}
        onChange={(v) => onSetAppeal(type, v)}
        scale={1}
        precision={3}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "-6px", marginBottom: "14px" }}>
        {tiers.map((tier) => {
          const isActive = currentTier === tier.label;
          return (
            <button
              key={tier.label}
              onClick={() => onSetAppeal(type, tier.value)}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "9px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: isActive ? color : "var(--color-text-muted)",
                background: isActive ? color + "18" : "transparent",
                border: `1px solid ${isActive ? color + "66" : "var(--color-border)"}`,
                padding: "3px 6px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = color;
                e.currentTarget.style.borderColor = color + "66";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isActive ? color : "var(--color-text-muted)";
                e.currentTarget.style.borderColor = isActive ? color + "66" : "var(--color-border)";
              }}
            >
              {tier.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Appeal section ────────────────────────────────────────────────────────────

function AppealSection({
  char,
  onSetAppeal,
}: {
  char: Character;
  onSetAppeal: (type: "ART" | "COM", value: number) => void;
}) {
  if (!isAppealEligible(char.professions)) return null;

  const wt = char.whiteTagsNEW as Record<string, Record<string, unknown>> | undefined;
  const artValue = parseFloat(String(wt?.ART?.value)) || 0;
  const comValue = parseFloat(String(wt?.COM?.value)) || 0;

  return (
    <>
      <hr className="gold-divider" style={{ margin: "8px 0 20px" }} />
      <p style={{ ...FIELD_LABEL_STYLE, marginBottom: "16px" }}>Appeal</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <AppealColumn type="ART" value={artValue} color="#a088c8" onSetAppeal={onSetAppeal} />
        <AppealColumn type="COM" value={comValue} color="#c8a040" onSetAppeal={onSetAppeal} />
      </div>
    </>
  );
}

// ── Labels editor ─────────────────────────────────────────────────────────────

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
        <p style={FIELD_LABEL_STYLE}>Traits</p>
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
      {labels.length === 0 ? (
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
          {labels.map((label) => (
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

// ── Detail panel ──────────────────────────────────────────────────────────────

export default function DetailPanel({
  char,
  gameDate,
  onUpdate,
}: {
  char: Character;
  gameDate: Date | null;
  onUpdate: (updater: (c: Character) => void) => void;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState("");

  const profKey = getPrimaryProfession(char.professions);
  const profColor = profKey ? getProfessionColor(profKey) : "#9a9280";
  const cap = parseFloat(char.limit) || 1;
  const profEntries = Object.entries(char.professions);

  const startEditName = () => {
    setNameVal(
      char.customName && typeof char.customName === "string" ? char.customName : ""
    );
    setEditingName(true);
    setTimeout(() => nameRef.current?.select(), 0);
  };

  const commitName = () => {
    const val = nameVal.trim() || null;
    onUpdate((c) => { c.customName = val; });
    setEditingName(false);
  };

  const setSkill = (pk: string, value: number) =>
    onUpdate((c) => { c.professions[pk] = formatDecimalString(value); });

  const setLimit = (value: number) =>
    onUpdate((c) => { c.limit = formatDecimalString(value); c.Limit = formatDecimalString(value); });

  const setMood = (value: number) =>
    onUpdate((c) => { c.mood = formatDecimalString(value); });

  const setAttitude = (value: number) =>
    onUpdate((c) => { c.attitude = formatDecimalString(value); });

  const setAppeal = (type: "ART" | "COM", value: number) =>
    onUpdate((c) => {
      const wt = c.whiteTagsNEW as Record<string, Record<string, unknown>> | undefined;
      if (!wt) return;
      if (!wt[type]) {
        wt[type] = {
          overallValues: [],
          id: type,
          dateAdded: "0001-01-01T00:00:00",
          movieId: 0,
          value: "0.000",
          IsOverall: false,
        };
      }
      wt[type].value = formatDecimalString(value);
    });

  const setXp = (value: number) =>
    onUpdate((c) => { c.xp = Math.max(0, Math.round(value)); });

  const setBonusCard = (field: "BonusCardMoney" | "BonusCardInfluencePoints", pct: number) =>
    onUpdate((c) => {
      const val = Math.max(0, Math.round(pct / 10));
      c[field] = val;
      const cards = Array.isArray(c.bonusCards) ? [...(c.bonusCards as number[])] : [0, 0];
      if (field === "BonusCardMoney") cards[0] = val; else cards[1] = val;
      c.bonusCards = cards;
    });

  const maxAllStats = () => {
    onUpdate((c) => {
      for (const k of Object.keys(c.professions)) c.professions[k] = "1.000";
      c.limit = "1.000";
      c.Limit = "1.000";
      c.mood = "1.000";
      c.attitude = "1.000";
      const wt = c.whiteTagsNEW as Record<string, Record<string, unknown>> | undefined;
      if (wt && isAppealEligible(c.professions)) {
        for (const type of ["ART", "COM"] as const) {
          if (!wt[type]) {
            wt[type] = {
              overallValues: [],
              id: type,
              dateAdded: "0001-01-01T00:00:00",
              movieId: 0,
              value: "0.000",
              IsOverall: false,
            };
          }
          wt[type].value = "1.000";
        }
      }
    });
  };

  return (
    <div style={{ padding: "28px 32px", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <PortraitPlaceholder color={profColor} />
        <div style={{ flex: 1, minWidth: 0 }}>
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
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "10px", color: "var(--color-text-muted)", letterSpacing: "0.06em" }}>
              ID #{char.id}
            </span>
            {gameDate && (
              <>
                <span style={{ fontFamily: "var(--font-ui)", fontSize: "10px", color: "var(--color-text-muted)" }}>·</span>
                <AgeEditor char={char} gameDate={gameDate} onUpdate={onUpdate} />
              </>
            )}
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "10px", color: "var(--color-text-muted)" }}>
              · Happiness{" "}
              <span style={{ color: moodColor(char.mood) }}>
                {Math.round(parseFloat(char.mood) * 100)}
              </span>
            </span>
          </div>
        </div>
      </div>

      <hr className="gold-divider" style={{ marginBottom: "20px" }} />

      {/* Skills */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <p style={FIELD_LABEL_STYLE}>Ratings</p>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        {profEntries.map(([key, val]) => (
          <StatBar
            key={key}
            label={getProfessionLabel(key)}
            value={parseFloat(val) || 0}
            cap={cap}
            color={getProfessionColor(key)}
            onChange={(v) => setSkill(key, v)}
            scale={10}
            precision={1}
          />
        ))}
        <StatBar
          label="Skill Cap"
          value={cap}
          cap={1}
          color={profColor + "88"}
          onChange={setLimit}
          scale={10}
          precision={1}
        />
      </div>

      <hr className="gold-divider" style={{ margin: "8px 0 20px" }} />

      {/* Morale */}
      <p style={{ ...FIELD_LABEL_STYLE, marginBottom: "16px" }}>Morale</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <StatBar
          label="Happiness"
          value={parseFloat(char.mood) || 0}
          cap={1}
          color={moodColor(char.mood)}
          onChange={setMood}
          scale={100}
          precision={0}
        />
        <StatBar
          label="Loyalty"
          value={parseFloat(char.attitude) || 0}
          cap={1}
          color="#9a9280"
          onChange={setAttitude}
          scale={100}
          precision={0}
        />
        {/* XP */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <span style={FIELD_LABEL_STYLE}>XP</span>
            <XpEditor xp={Math.max(0, char.xp)} onChange={setXp} />
          </div>
        </div>
      </div>

      {isLieutenant(char.professions) && (
        <UpgradeBonusSection char={char} onSetBonus={setBonusCard} />
      )}

      <AppealSection char={char} onSetAppeal={setAppeal} />

      <LabelsEditor
        labels={Array.isArray(char.labels) ? (char.labels as string[]) : []}
        onAdd={(label) => onUpdate((c) => { if (!Array.isArray(c.labels)) c.labels = []; (c.labels as string[]).push(label); })}
        onRemove={(label) => onUpdate((c) => { if (Array.isArray(c.labels)) c.labels = (c.labels as string[]).filter((l) => l !== label); })}
      />
    </div>
  );
}
