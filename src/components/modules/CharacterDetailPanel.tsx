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

type LabelInfo = { desc: string; caution?: string };
const LABEL_INFO: Record<string, LabelInfo> = {
  ALCOHOLIC:      { desc: "Heavy drinker. May trigger scandal events." },
  ARROGANT:       { desc: "Causes friction with co-workers and staff." },
  CALM:           { desc: "Positive temperament; resilient to negative events." },
  CHASTE:         { desc: "Avoids romantic relationships; no heartbreaker events." },
  CHEERY:         { desc: "Higher baseline happiness; less prone to mood drops." },
  DEMANDING:      { desc: "Expects higher compensation and better conditions." },
  DISCIPLINED:    { desc: "Reliable and efficient worker." },
  HARDWORKING:    { desc: "Productive; may gain XP faster." },
  HEARTBREAKER:   { desc: "Romantic reputation; can trigger scandal events." },
  HOTHEADED:      { desc: "Prone to conflicts on set and with management." },
  IMMORTAL:       { desc: "Cannot die of old age.", caution: "Removing this will make the character mortal again." },
  INDIFFERENT:    { desc: "Low motivation; may underperform on projects." },
  JUNKIE:         { desc: "Drug use; may trigger scandal events." },
  LAZY:           { desc: "Lower productivity; slower skill progression." },
  LEADER:         { desc: "Boosts morale and performance of those around them." },
  LUDOMANIAC:     { desc: "Gambling addiction; may trigger financial events." },
  MAIN_CHARACTER: { desc: "Marks the player's own studio head character.", caution: "Do not remove — this is story-critical and cannot be safely undone." },
  MELANCHOLIC:    { desc: "Lower baseline happiness; prone to mood drops." },
  MISOGYNIST:     { desc: "Causes friction with female co-workers." },
  MODEST:         { desc: "Content with lower pay; unlikely to demand raises." },
  OPEN_MINDED:    { desc: "Flexible and collaborative; works well with others." },
  PERFECTIONIST:  { desc: "High-quality output but may slow production timelines." },
  RACIST:         { desc: "Causes conflict with diverse casts; scandal risk." },
  SIMPLE:         { desc: "Easygoing; low drama, straightforward to manage." },
  STERILE:        { desc: "Cannot have children; no family-related events.", caution: "Removing this re-enables family events for this character." },
  SUPER_IMMORTAL: { desc: "Cannot die under any circumstances.", caution: "Removing this makes the character vulnerable again." },
  TEAM_PLAYER:    { desc: "Strong positive effect on co-worker relationships." },
  UNDISCIPLINED:  { desc: "Unreliable; inconsistent effort and performance." },
  UNTOUCHABLE:    { desc: "Cannot be targeted by competitor attacks or certain events." },
  UNWANTED_ACTOR: { desc: "Blocked from being cast in any film.", caution: "Adding this will prevent this character from being cast. Only remove if you're sure." },
  XENOPHOBE:      { desc: "Causes friction with international co-workers." },
};

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

const CINE_SKILL_TIERS = [
  { label: "1",   value: 0.1 },
  { label: "2",   value: 0.2 },
  { label: "3",   value: 0.3 },
  { label: "Max (4)", value: 0.4 },
];

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

function isCinematographer(professions: Record<string, string>): boolean {
  return "Cinematographer" in professions;
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

// ── Cinematographer filming skills ────────────────────────────────────────────

function CineSkillColumn({
  label,
  skillKey,
  value,
  color,
  onSet,
}: {
  label: string;
  skillKey: "INDOOR" | "OUTDOOR";
  value: number;
  color: string;
  onSet: (key: "INDOOR" | "OUTDOOR", v: number) => void;
}) {
  return (
    <div>
      <StatBar
        label={label}
        value={value}
        cap={0.4}
        color={color}
        onChange={(v) => onSet(skillKey, Math.min(0.4, Math.max(0, v)))}
        scale={1}
        precision={3}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", marginTop: "-6px", marginBottom: "14px" }}>
        {CINE_SKILL_TIERS.map((tier, i) => {
          const isActive = Math.abs(value - tier.value) < 0.005;
          const isFirst = i === 0;
          const isLast = i === CINE_SKILL_TIERS.length - 1;
          return (
            <button
              key={tier.label}
              onClick={() => onSet(skillKey, tier.value)}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "9px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: isActive ? color : "var(--color-text-muted)",
                background: isActive ? color + "22" : "transparent",
                border: `1px solid ${isActive ? color + "88" : "var(--color-border)"}`,
                marginLeft: isFirst ? 0 : "-1px",
                borderRadius: isFirst ? "2px 0 0 2px" : isLast ? "0 2px 2px 0" : 0,
                padding: "4px 2px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                position: "relative",
                zIndex: isActive ? 1 : 0,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = color;
                  e.currentTarget.style.borderColor = color + "66";
                  e.currentTarget.style.zIndex = "1";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--color-text-muted)";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.zIndex = "0";
                }
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

function CinematographerSection({
  char,
  onSet,
}: {
  char: Character;
  onSet: (key: "INDOOR" | "OUTDOOR", value: number) => void;
}) {
  if (!isCinematographer(char.professions)) return null;

  const wt = char.whiteTagsNEW as Record<string, Record<string, unknown>> | undefined;
  const indoorValue = parseFloat(String(wt?.INDOOR?.value)) || 0;
  const outdoorValue = parseFloat(String(wt?.OUTDOOR?.value)) || 0;

  return (
    <>
      <hr className="gold-divider" style={{ margin: "8px 0 20px" }} />
      <p style={{ ...FIELD_LABEL_STYLE, marginBottom: "16px" }}>Filming Skills</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <CineSkillColumn label="Indoor (Soundstage)" skillKey="INDOOR" value={indoorValue} color="#5bb8d4" onSet={onSet} />
        <CineSkillColumn label="Outdoor (Location)" skillKey="OUTDOOR" value={outdoorValue} color="#8fbc55" onSet={onSet} />
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", marginTop: "-6px", marginBottom: "14px" }}>
        {tiers.map((tier, i) => {
          const isActive = currentTier === tier.label;
          const isFirst = i === 0;
          const isLast = i === tiers.length - 1;
          return (
            <button
              key={tier.label}
              onClick={() => onSetAppeal(type, tier.value)}
              title={tier.label}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "9px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: isActive ? color : "var(--color-text-muted)",
                background: isActive ? color + "22" : "transparent",
                border: `1px solid ${isActive ? color + "88" : "var(--color-border)"}`,
                marginLeft: isFirst ? 0 : "-1px",
                borderRadius: isFirst ? "2px 0 0 2px" : isLast ? "0 2px 2px 0" : 0,
                padding: "4px 2px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                position: "relative",
                zIndex: isActive ? 1 : 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = color;
                  e.currentTarget.style.borderColor = color + "66";
                  e.currentTarget.style.zIndex = "1";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--color-text-muted)";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.zIndex = "0";
                }
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
  const [guideOpen, setGuideOpen] = useState(false);
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <p style={FIELD_LABEL_STYLE}>Traits</p>
          <button
            onClick={() => setGuideOpen((o) => !o)}
            title="Trait reference guide"
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "9px",
              lineHeight: 1,
              color: guideOpen ? "var(--color-gold)" : "var(--color-text-muted)",
              background: "transparent",
              border: `1px solid ${guideOpen ? "var(--color-gold-mid)" : "var(--color-border)"}`,
              borderRadius: "50%",
              width: "14px",
              height: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-gold)"; e.currentTarget.style.borderColor = "var(--color-gold-mid)"; }}
            onMouseLeave={(e) => { if (!guideOpen) { e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.borderColor = "var(--color-border)"; } }}
          >
            ?
          </button>
        </div>
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
          {available.map((l) => {
            const caution = LABEL_INFO[l]?.caution;
            return <option key={l} value={l}>{caution ? `⚠ ${l}` : l}</option>;
          })}
        </select>
      </div>

      {guideOpen && (
        <div
          style={{
            marginBottom: "16px",
            border: "1px solid var(--color-border-subtle)",
            background: "var(--color-bg-raised)",
          }}
        >
          <div
            style={{
              padding: "6px 10px",
              borderBottom: "1px solid var(--color-border-subtle)",
              fontFamily: "var(--font-ui)",
              fontSize: "9px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
            }}
          >
            Trait reference — ⚠ = handle with care
          </div>
          <div style={{ maxHeight: "240px", overflowY: "auto" }}>
            {KNOWN_LABELS.map((l) => {
              const info = LABEL_INFO[l];
              return (
                <div
                  key={l}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr",
                    gap: "8px",
                    padding: "5px 10px",
                    borderBottom: "1px solid var(--color-border-subtle)",
                    alignItems: "start",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "9px",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: info?.caution ? "var(--color-gold)" : "var(--color-text-secondary)",
                      paddingTop: "1px",
                    }}
                  >
                    {info?.caution ? "⚠ " : ""}{l.replace(/_/g, " ")}
                  </span>
                  <div>
                    <span
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "10px",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {info?.desc ?? "No description available."}
                    </span>
                    {info?.caution && (
                      <span
                        style={{
                          display: "block",
                          fontFamily: "var(--font-ui)",
                          fontSize: "9px",
                          color: "var(--color-gold)",
                          marginTop: "2px",
                        }}
                      >
                        {info.caution}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
          {labels.map((label) => {
            const info = LABEL_INFO[label];
            const isUnknown = unknownLabels.includes(label);
            const isCaution = !!info?.caution;
            const tooltipText = info?.caution ? `${info.desc}\n⚠ ${info.caution}` : info?.desc;
            return (
              <div
                key={label}
                title={tooltipText}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontFamily: "var(--font-ui)",
                  fontSize: "10px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: isUnknown ? "var(--color-text-muted)" : isCaution ? "var(--color-gold)" : "var(--color-text-secondary)",
                  border: `1px solid ${isCaution ? "var(--color-gold-mid)" : "var(--color-border)"}`,
                  padding: "2px 6px 2px 8px",
                }}
              >
                {isCaution && <span style={{ fontSize: "9px" }}>⚠</span>}
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
            );
          })}
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

  const setCineSkill = (key: "INDOOR" | "OUTDOOR", value: number) =>
    onUpdate((c) => {
      if (!c.whiteTagsNEW) c.whiteTagsNEW = {};
      const wt = c.whiteTagsNEW as Record<string, Record<string, unknown>>;
      if (!wt[key]) {
        wt[key] = {
          overallValues: [],
          id: key,
          dateAdded: "0001-01-01T00:00:00",
          movieId: 0,
          value: "0.000",
          IsOverall: false,
        };
      }
      wt[key].value = formatDecimalString(Math.min(0.4, Math.max(0, value)));
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
      if (!c.whiteTagsNEW) c.whiteTagsNEW = {};
      const wt = c.whiteTagsNEW as Record<string, Record<string, unknown>>;
      if (isAppealEligible(c.professions)) {
        for (const type of ["ART", "COM"] as const) {
          if (!wt[type]) wt[type] = { overallValues: [], id: type, dateAdded: "0001-01-01T00:00:00", movieId: 0, value: "0.000", IsOverall: false };
          wt[type].value = "1.000";
        }
      }
      if (isCinematographer(c.professions)) {
        for (const key of ["INDOOR", "OUTDOOR"] as const) {
          if (!wt[key]) wt[key] = { overallValues: [], id: key, dateAdded: "0001-01-01T00:00:00", movieId: 0, value: "0.000", IsOverall: false };
          wt[key].value = "0.400";
        }
      }
    });
  };

  return (
    <div style={{ padding: "28px 32px", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }}>
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
            flexShrink: 0,
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
          Max All
        </button>
      </div>

      <hr className="gold-divider" style={{ marginBottom: "20px" }} />

      {/* Skills */}
      <p style={{ ...FIELD_LABEL_STYLE, marginBottom: "16px" }}>Ratings</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        {profEntries.map(([key, val]) => {
          const skillVal = parseFloat(val) || 0;
          return (
            <StatBar
              key={key}
              label={getProfessionLabel(key)}
              value={skillVal}
              cap={cap}
              color={getProfessionColor(key)}
              onChange={(v) => setSkill(key, v)}
              onMax={skillVal < 1 ? () => setSkill(key, 1) : undefined}
              scale={10}
              precision={1}
            />
          );
        })}
        <StatBar
          label="Skill Cap"
          value={cap}
          cap={1}
          color={profColor + "88"}
          onChange={setLimit}
          onMax={cap < 1 ? () => setLimit(1) : undefined}
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
          onMax={(parseFloat(char.mood) || 0) < 1 ? () => setMood(1) : undefined}
          scale={100}
          precision={0}
        />
        <StatBar
          label="Loyalty"
          value={parseFloat(char.attitude) || 0}
          cap={1}
          color="#9a9280"
          onChange={setAttitude}
          onMax={(parseFloat(char.attitude) || 0) < 1 ? () => setAttitude(1) : undefined}
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

      <CinematographerSection char={char} onSet={setCineSkill} />

      <AppealSection char={char} onSetAppeal={setAppeal} />

      <LabelsEditor
        labels={Array.isArray(char.labels) ? (char.labels as string[]) : []}
        onAdd={(label) => onUpdate((c) => { if (!Array.isArray(c.labels)) c.labels = []; (c.labels as string[]).push(label); })}
        onRemove={(label) => onUpdate((c) => { if (Array.isArray(c.labels)) c.labels = (c.labels as string[]).filter((l) => l !== label); })}
      />
    </div>
  );
}
