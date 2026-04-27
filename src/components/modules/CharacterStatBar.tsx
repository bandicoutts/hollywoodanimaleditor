"use client";

import { useState } from "react";

export default function StatBar({
  label,
  value,
  cap,
  color,
  onChange,
  scale = 1,
  precision = 3,
}: {
  label: string;
  value: number;
  cap: number;
  color: string;
  onChange: (v: number) => void;
  scale?: number;
  precision?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");

  const displayValue = value * scale;

  const startEdit = () => {
    setInputVal(displayValue.toFixed(precision));
    setEditing(true);
  };
  const commit = () => {
    const v = Math.max(0, Math.min(scale, parseFloat(inputVal) || 0));
    onChange(v / scale);
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
            {displayValue.toFixed(precision)}
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
