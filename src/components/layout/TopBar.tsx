"use client";

import { useSaveFile } from "@/context/SaveFileContext";

function StudioMark({ size = 24 }: { size?: number }) {
  const r = size / 2;
  const hex = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${r + (r - 3) * Math.cos(angle)},${r + (r - 3) * Math.sin(angle)}`;
  }).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <polygon points={hex} stroke="#c9a44a" strokeWidth="1.2" />
      <circle cx={r} cy={r} r={r * 0.35} stroke="#c9a44a" strokeWidth="1" />
      <circle cx={r} cy={r} r={r * 0.12} fill="#c9a44a" />
    </svg>
  );
}

function StatChip({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "9px",
          letterSpacing: "0.08em",
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--color-gold)",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000)
    return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function TopBar() {
  const { saveData, isLoaded, download, versionWarning } = useSaveFile();
  const stateJson = saveData?.stateJson;
  const version = saveData?.currentMeta?.lastSaveVersion;
  const studioName = stateJson?.studioName;

  return (
    <header
      style={{
        height: "var(--topbar-height)",
        background: "var(--color-bg-panel)",
        borderBottom: "1px solid var(--color-border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        flexShrink: 0,
        gap: "16px",
      }}
    >
      {/* Left: logo + studio name */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
        <StudioMark size={22} />
        <span
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "200px",
          }}
        >
          {studioName ?? "Studio Archives"}
        </span>
        {version && (
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "9px",
              letterSpacing: "0.08em",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              border: "1px solid var(--color-border)",
              padding: "1px 6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            v{version}
          </span>
        )}
        {versionWarning && (
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "9px",
              letterSpacing: "0.06em",
              color: "var(--color-danger)",
              textTransform: "uppercase",
              border: "1px solid var(--color-danger)",
              padding: "1px 6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            title={versionWarning}
          >
            Unknown version
          </span>
        )}
      </div>

      {/* Right: quick stats + download */}
      {isLoaded && stateJson && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            flexShrink: 0,
          }}
        >
          <StatChip label="Budget" value={formatNumber(stateJson.budget)} />
          <StatChip label="Cash" value={formatNumber(stateJson.cash)} />
          <StatChip
            label="Reputation"
            value={parseFloat(stateJson.reputation).toFixed(0)}
          />
          <div
            style={{ width: "1px", height: "20px", background: "var(--color-border)" }}
          />
          <button
            onClick={download}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-gold)",
              background: "transparent",
              border: "1px solid var(--color-gold-mid)",
              padding: "5px 14px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-gold)";
              e.currentTarget.style.background = "var(--color-gold-dim)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-gold-mid)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Download Save
          </button>
        </div>
      )}
    </header>
  );
}
