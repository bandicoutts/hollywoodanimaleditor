"use client";

import ScoreBadge from "./ScoreBadge";
import type { ScriptCombo } from "@/lib/script-suggestions";

const POLLUX_TOOLTIP = "Pollux Award score — the game's prestige prize for artistic films";

function Chip({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "10px",
        letterSpacing: "0.04em",
        color: muted ? "var(--color-text-muted)" : "var(--color-text-secondary)",
        background: "var(--color-bg-panel)",
        border: "1px solid var(--color-border-subtle)",
        padding: "2px 8px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

const ROW_LABEL: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "9px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
  marginRight: "2px",
};

export default function ScriptCard({
  combo,
  index,
  onUse,
}: {
  combo: ScriptCombo;
  index: number;
  onUse?: (combo: ScriptCombo) => void;
}) {
  const { genre, genre2, setting, protagonist, supporting, antagonist, themesEvents, finale, scores } = combo;

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        background: "var(--color-bg-panel)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "9px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
            minWidth: "20px",
            paddingTop: "2px",
            flexShrink: 0,
          }}
        >
          #{index + 1}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "var(--color-gold)",
            }}
          >
            {genre.label}
            {genre2 && (
              <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
                {" / "}{genre2.label}
              </span>
            )}
          </span>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              color: "var(--color-text-muted)",
              letterSpacing: "0.04em",
            }}
          >
            {setting.label}
          </span>
        </div>
      </div>

      {/* Score badges */}
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
        <ScoreBadge label="Art" value={scores.art} color="#7ec8a0" />
        <ScoreBadge label="Com" value={scores.com} color="#7ab4d4" />
        {scores.synergy > 0 && (
          <ScoreBadge label="Compat" value={scores.synergy} color="var(--color-gold)" />
        )}
        {scores.pollux > 0 && (
          <ScoreBadge label="Pol" value={scores.pollux} color="#b8a0d4" title={POLLUX_TOOLTIP} />
        )}
      </div>

      {/* Cast row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
        <span style={ROW_LABEL}>Cast</span>
        <Chip label={protagonist.label} />
        <Chip label={supporting.label} />
        <Chip label={antagonist.label} />
      </div>

      {/* Themes & events */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
        <span style={ROW_LABEL}>Story</span>
        {themesEvents.map((te) => (
          <Chip key={te.id} label={te.label} />
        ))}
      </div>

      {/* Finale */}
      <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
        <span style={ROW_LABEL}>End</span>
        <Chip label={finale.label} />
      </div>

      {onUse && (
        <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: "8px" }}>
          <button
            onClick={() => onUse(combo)}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-gold)",
              background: "transparent",
              border: "1px solid var(--color-gold-mid)",
              padding: "4px 12px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(184,156,84,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            Refine & Score →
          </button>
        </div>
      )}
    </div>
  );
}
