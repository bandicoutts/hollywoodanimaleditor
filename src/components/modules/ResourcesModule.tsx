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

interface UtilityConfig {
  key: "availableWater" | "availableElectricity";
  label: string;
  description: string;
  max: number;
  color: string;
  unit: string;
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

const UTILITIES: UtilityConfig[] = [
  {
    key: "availableWater",
    label: "Water Supply",
    description: "Available water units (4 per staff/tick)",
    max: 999_999,
    color: "#5bb8d4",
    unit: "units",
  },
  {
    key: "availableElectricity",
    label: "Electricity Supply",
    description: "Available electricity units (5 per staff/tick)",
    max: 999_999,
    color: "#f0c060",
    unit: "units",
  },
];

const PRESETS = [0.25, 0.5, 0.75, 1.0];

const NEGOTIATION_ITEMS: { key: string; label: string }[] = [
  { key: "WATCH",                  label: "Watch" },
  { key: "SIGARS",                 label: "Cigars" },
  { key: "ALCOHOL",                label: "Alcohol" },
  { key: "WARDROBE_COUTURE",       label: "Couture Wardrobe" },
  { key: "EUROPEAN_SPORTCAR",      label: "European Sports Car" },
  { key: "HEROIN",                 label: "Heroin" },
  { key: "COCAINE",                label: "Cocaine" },
  { key: "ANIMAL_MURDER",          label: "Trophy Kill" },
  { key: "PORNO_TAPE",             label: "Compromising Footage" },
  { key: "MONKEY_BRAINS",          label: "Monkey Brains" },
  { key: "ILLEGAL_SAFARI",         label: "Illegal Safari" },
  { key: "CANNIBAL_DINNER",        label: "Cannibal Dinner" },
  { key: "EVENING_WITH_UNDERAGED", label: "Evening with the Underaged" },
  { key: "METH",                   label: "Meth" },
];

const ITEM_MAX = 99;

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

// ── ItemCounter ───────────────────────────────────────────────────────────────

function ItemCounter({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setInputVal(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    const n = clamp(parseInt(inputVal, 10) || 0, 0, ITEM_MAX);
    onChange(n);
    setEditing(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--color-border-subtle)" }}>
      <span style={{ fontFamily: "var(--font-ui)", fontSize: "11px", color: "var(--color-text-secondary)" }}>{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          autoFocus
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          style={{ fontFamily: "var(--font-serif)", fontSize: "13px", fontWeight: 600, color: "var(--color-gold)", background: "transparent", border: "none", borderBottom: "1px solid var(--color-gold)", outline: "none", width: "48px", textAlign: "right", padding: "0 0 1px" }}
        />
      ) : (
        <span
          onClick={startEdit}
          title="Click to edit"
          style={{ fontFamily: "var(--font-serif)", fontSize: "13px", fontWeight: 600, color: value > 0 ? "var(--color-gold)" : "var(--color-text-muted)", borderBottom: "1px dashed var(--color-border)", cursor: "text", minWidth: "28px", textAlign: "right" }}
        >
          {value}
        </span>
      )}
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

  const handleUtilityChange = useCallback(
    (key: "availableWater" | "availableElectricity", value: number) => {
      const label = key === "availableWater" ? "Water Supply" : "Electricity Supply";
      const boughtKey = key === "availableWater" ? "boughtWaterThisMonth" : "boughtElectricityThisMonth";
      updateStateJson((s) => {
        s[key] = formatDecimalString(Math.round(value));
        s[boughtKey] = "0.000";
      }, `${label} updated`);
    },
    [updateStateJson]
  );

  const handleItemChange = useCallback(
    (key: string, value: number) => {
      updateStateJson((s) => {
        if (!s.otherCountableResources) s.otherCountableResources = {};
        s.otherCountableResources[key] = value;
        if (s.requestedCountableResources) s.requestedCountableResources[key] = 0;
      }, `Item updated: ${key}`);
    },
    [updateStateJson]
  );

  const handleMaxAll = useCallback(() => {
    updateStateJson((s) => {
      s.budget = 1_000_000_000;
      s.cash = 1_000_000_000;
      s.reputation = formatDecimalString(200_000);
      s.influence = 1_000_000;
    }, "All resources maxed");
  }, [updateStateJson]);

  if (!isLoaded || !saveData) {
    return (
      <ModuleShell
        title="Resources"
        subtitle="Edit studio budget, cash, reputation, and influence"
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
      subtitle="Edit studio budget, cash, reputation, influence, water, and electricity"
    >
      {/* Max All button */}
      <div style={{ paddingTop: "16px", paddingBottom: "4px" }}>
        <button
          onClick={handleMaxAll}
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-gold)",
            background: "transparent",
            border: "1px solid var(--color-gold)",
            padding: "6px 16px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-gold)";
            e.currentTarget.style.color = "var(--color-bg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--color-gold)";
          }}
        >
          Max All Resources
        </button>
      </div>

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

      {/* Utilities section */}
      <div
        style={{
          marginTop: "28px",
          paddingTop: "20px",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
            marginBottom: "4px",
          }}
        >
          Utilities
        </p>
      </div>

      {UTILITIES.map((u) => {
        const utilVal = parseFloat(s[u.key] as string) || 0;
        return (
          <ResourceField
            key={u.key}
            label={u.label}
            description={u.description}
            value={utilVal}
            max={u.max}
            color={u.color}
            displayValue={Math.round(utilVal).toLocaleString()}
            onChange={(v) => handleUtilityChange(u.key, v)}
            parseInput={parseNumber}
            formatInput={(v) => Math.round(v).toLocaleString()}
          />
        );
      })}

      {/* Negotiation Items section */}
      <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid var(--color-border)" }}>
        <p style={{ fontFamily: "var(--font-ui)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "2px" }}>
          Negotiation Items
        </p>
        <p style={{ fontFamily: "var(--font-ui)", fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>
          Consumables used in negotiations and parties · max 99 each
        </p>
      </div>

      {NEGOTIATION_ITEMS.map((item) => {
        const itemVal = (s.otherCountableResources?.[item.key] as number) ?? 0;
        return (
          <ItemCounter
            key={item.key}
            label={item.label}
            value={itemVal}
            onChange={(v) => handleItemChange(item.key, v)}
          />
        );
      })}
    </ModuleShell>
  );
}
