"use client";

import { useCallback, useRef, useState } from "react";
import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";
import { formatDecimalString } from "@/lib/save-file";

// ── Config ────────────────────────────────────────────────────────────────────

interface ResourceConfig {
  key: "budget" | "cash" | "influence";
  label: string;
  description: string;
  max: number;
  color: string;
  format: (v: number) => string;
  parse: (s: string) => number;
}

interface ReputationConfig {
  label: string;
  description: string;
  max: number;
  color: string;
}

const RESOURCES: ResourceConfig[] = [
  {
    key: "budget",
    label: "Budget",
    description: "Studio operating budget",
    max: 1_000_000_000,
    color: "#c9a44a",
    format: formatMoney,
    parse: parseNumber,
  },
  {
    key: "cash",
    label: "Cash",
    description: "Liquid cash on hand",
    max: 1_000_000_000,
    color: "#8fbc55",
    format: formatMoney,
    parse: parseNumber,
  },
  {
    key: "influence",
    label: "Influence",
    description: "Influence points",
    max: 1_000_000,
    color: "#7ab0e0",
    format: (v) => v.toLocaleString(),
    parse: parseNumber,
  },
];

const REPUTATION: ReputationConfig = {
  label: "Reputation",
  description: "Studio reputation score",
  max: 200_000,
  color: "#a9a4e8",
};

const PRESETS = [0.25, 0.5, 0.75, 1.0];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMoney(v: number): string {
  return "$" + Math.round(v).toLocaleString();
}

function parseNumber(s: string): number {
  return parseFloat(s.replace(/[^0-9.-]/g, "")) || 0;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// ── ResourceField ─────────────────────────────────────────────────────────────

interface ResourceFieldProps {
  label: string;
  description: string;
  value: number;
  max: number;
  color: string;
  displayValue: string;
  onChange: (v: number) => void;
  parseInput: (s: string) => number;
  formatInput: (v: number) => string;
}

function ResourceField({
  label,
  description,
  value,
  max,
  color,
  displayValue,
  onChange,
  parseInput,
  formatInput,
}: ResourceFieldProps) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const pct = clamp(value / max, 0, 1) * 100;

  const startEdit = () => {
    setInputVal(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    const parsed = clamp(parseInput(inputVal), 0, max);
    onChange(parsed);
    setEditing(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditing(false);
  };

  return (
    <div
      style={{
        padding: "20px 0",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      {/* Label row */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "12px",
          gap: "16px",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: "2px",
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "11px",
              color: "var(--color-text-secondary)",
            }}
          >
            {description}
          </p>
        </div>

        {/* Click-to-edit value */}
        {editing ? (
          <input
            ref={inputRef}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={onKeyDown}
            autoFocus
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "20px",
              fontWeight: 600,
              color,
              background: "transparent",
              border: "none",
              borderBottom: `1px solid ${color}`,
              outline: "none",
              width: "160px",
              textAlign: "right",
              padding: "0 0 2px",
            }}
          />
        ) : (
          <span
            onClick={startEdit}
            title="Click to edit"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "20px",
              fontWeight: 600,
              color,
              borderBottom: "1px dashed var(--color-border)",
              cursor: "text",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {displayValue}
          </span>
        )}
      </div>

      {/* Slider track */}
      <div style={{ position: "relative", marginBottom: "10px" }}>
        {/* Visual track */}
        <div
          style={{
            height: "6px",
            background: "var(--color-bg-raised)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${pct}%`,
              background: color,
              transition: "width 0.3s ease",
            }}
          />
        </div>
        {/* Invisible range input overlay */}
        <input
          type="range"
          min={0}
          max={max}
          step={Math.max(1, Math.floor(max / 10000))}
          value={clamp(value, 0, max)}
          onChange={(e) => onChange(Number(e.target.value))}
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

      {/* Preset buttons */}
      <div style={{ display: "flex", gap: "6px" }}>
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => onChange(Math.round(max * p))}
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
              e.currentTarget.style.color = color;
              e.currentTarget.style.borderColor = color + "88";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-text-muted)";
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          >
            {p * 100}%
          </button>
        ))}
        <button
          onClick={startEdit}
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
            marginLeft: "auto",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-text-secondary)";
            e.currentTarget.style.borderColor = "var(--color-border)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-text-muted)";
          }}
        >
          Enter value
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ResourcesModule() {
  const { isLoaded, saveData, updateStateJson } = useSaveFile();

  const handleNumberChange = useCallback(
    (key: "budget" | "cash" | "influence", value: number) => {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      updateStateJson((s) => {
        s[key] = Math.round(value);
      }, `${label} updated`);
    },
    [updateStateJson]
  );

  const handleReputationChange = useCallback(
    (value: number) => {
      updateStateJson((s) => {
        s.reputation = formatDecimalString(value);
      }, "Reputation updated");
    },
    [updateStateJson]
  );

  if (!isLoaded || !saveData) {
    return (
      <ModuleShell
        title="Resources"
        subtitle="Edit studio budget, cash, reputation, and influence"
        maxWidth={720}
      >
        <EmptyState message="Upload a save file to edit resources" />
      </ModuleShell>
    );
  }

  const s = saveData.stateJson;
  const repValue = parseFloat(s.reputation) || 0;

  return (
    <ModuleShell
      title="Resources"
      subtitle="Edit studio budget, cash, reputation, and influence"
      maxWidth={720}
    >
      {RESOURCES.map((r) => (
        <ResourceField
          key={r.key}
          label={r.label}
          description={r.description}
          value={s[r.key] as number}
          max={r.max}
          color={r.color}
          displayValue={r.format(s[r.key] as number)}
          onChange={(v) => handleNumberChange(r.key, v)}
          parseInput={r.parse}
          formatInput={r.format}
        />
      ))}

      {/* Reputation — string type, handled separately */}
      <ResourceField
        label={REPUTATION.label}
        description={REPUTATION.description}
        value={repValue}
        max={REPUTATION.max}
        color={REPUTATION.color}
        displayValue={parseFloat(s.reputation).toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
        onChange={handleReputationChange}
        parseInput={(str) => clamp(parseFloat(str) || 0, 0, REPUTATION.max)}
        formatInput={(v) => v.toLocaleString()}
      />
    </ModuleShell>
  );
}
