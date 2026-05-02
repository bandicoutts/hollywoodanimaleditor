"use client";

import ScoreBadge from "./ScoreBadge";
import type { ScriptCombo } from "@/lib/script-suggestions";

const POLLUX_TOOLTIP = "Pollux Award score — the game's prestige prize for artistic films";

function BanTag({ pending }: { pending?: boolean }) {
  return (
    <span style={{
      fontFamily: "var(--font-ui)",
      fontSize: "8px",
      letterSpacing: "0.05em",
      color: pending ? "#a07830" : "#a05050",
      marginLeft: "4px",
      verticalAlign: "middle",
    }}>
      {pending ? "pending ban" : "banned"}
    </span>
  );
}

function Chip({ label, muted, banned, pending }: { label: string; muted?: boolean; banned?: boolean; pending?: boolean }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "10px",
        letterSpacing: "0.04em",
        color: banned || pending ? (banned ? "#a05050" : "#a07830") : muted ? "var(--color-text-muted)" : "var(--color-text-secondary)",
        background: "var(--color-bg-panel)",
        border: `1px solid ${banned ? "#a0505040" : pending ? "#a0783040" : "var(--color-border-subtle)"}`,
        padding: "2px 8px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {banned && <BanTag />}
      {!banned && pending && <BanTag pending />}
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
  bannedIds,
  pendingBannedIds,
}: {
  combo: ScriptCombo;
  index: number;
  onUse?: (combo: ScriptCombo) => void;
  bannedIds?: Set<string>;
  pendingBannedIds?: Set<string>;
}) {
  const { genre, genre2, setting, protagonist, supporting, antagonist, themesEvents, finale, scores } = combo;

  function isBanned(id: string) { return bannedIds?.has(id) ?? false; }
  function isPending(id: string) { return !isBanned(id) && (pendingBannedIds?.has(id) ?? false); }

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
            {isBanned(genre.id) && <BanTag />}
            {isPending(genre.id) && <BanTag pending />}
            {genre2 && (
              <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
                {" / "}{genre2.label}
                {isBanned(genre2.id) && <BanTag />}
                {isPending(genre2.id) && <BanTag pending />}
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
            {isBanned(setting.id) && <BanTag />}
            {isPending(setting.id) && <BanTag pending />}
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
        <Chip label={protagonist.label} banned={isBanned(protagonist.id)} pending={isPending(protagonist.id)} />
        {supporting.map(s => <Chip key={s.id} label={s.label} banned={isBanned(s.id)} pending={isPending(s.id)} />)}
        {antagonist && <Chip label={antagonist.label} banned={isBanned(antagonist.id)} pending={isPending(antagonist.id)} />}
      </div>

      {/* Themes & events */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
        <span style={ROW_LABEL}>Story</span>
        {[...themesEvents].sort((a, b) => a.label.localeCompare(b.label)).map((te) => (
          <Chip key={te.id} label={te.label} banned={isBanned(te.id)} pending={isPending(te.id)} />
        ))}
      </div>

      {/* Finale */}
      <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
        <span style={ROW_LABEL}>End</span>
        <Chip label={finale.label} banned={isBanned(finale.id)} pending={isPending(finale.id)} />
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
            Build Your Script →
          </button>
        </div>
      )}
    </div>
  );
}
