"use client";

import React from "react";
import ScoreBadge from "./ScoreBadge";
import type { ScriptCombo } from "@/lib/script-suggestions";
import { scoreAudience, rankAgencies, SEGMENT_IDS } from "@/lib/audience-scoring";
import { SEGMENT_LABELS } from "@/data/audienceData";

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

// ── Audience appeal section ───────────────────────────────────────────────────

function AudienceSection({ combo }: { combo: ScriptCombo }) {
  const allElements = [
    combo.genre, combo.genre2,
    combo.setting, combo.protagonist,
    ...combo.supporting,
    combo.antagonist,
    combo.finale,
    ...combo.themesEvents,
  ].filter((e): e is NonNullable<typeof e> => e != null);

  const scores = scoreAudience(allElements);
  const maxAbs = Math.max(1, ...SEGMENT_IDS.map(s => Math.abs(scores[s])));

  // Pairs: [female, male] per age group
  const pairs: [keyof typeof scores, keyof typeof scores][] = [
    ["TF", "TM"],
    ["YF", "YM"],
    ["AF", "AM"],
  ];

  function SegBar({ seg }: { seg: keyof typeof scores }) {
    const val = scores[seg];
    const pct = Math.abs(val) / maxAbs;
    const isPos = val >= 0;
    const barColor = val > 0 ? "#7ec8a0" : val < 0 ? "#c87e7e" : "var(--color-border)";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
        <span style={{
          fontFamily: "var(--font-ui)",
          fontSize: "9px",
          color: "var(--color-text-muted)",
          width: "68px",
          flexShrink: 0,
          textAlign: "right",
        }}>
          {SEGMENT_LABELS[seg]}
        </span>
        <div style={{
          flex: 1,
          height: "4px",
          background: "var(--color-border-subtle)",
          position: "relative",
          minWidth: "40px",
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: isPos ? 0 : `${(1 - pct) * 100}%`,
            width: `${pct * 100}%`,
            height: "100%",
            background: barColor,
          }} />
        </div>
        <span style={{
          fontFamily: "var(--font-ui)",
          fontSize: "9px",
          color: val > 0 ? "#7ec8a0" : val < 0 ? "#c87e7e" : "var(--color-text-muted)",
          width: "24px",
          flexShrink: 0,
          textAlign: "left",
        }}>
          {val > 0 ? `+${val}` : val}
        </span>
      </div>
    );
  }

  return (
    <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: "8px" }}>
      <span style={{ ...ROW_LABEL, display: "block", marginBottom: "6px" }}>Audience</span>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px" }}>
        {pairs.map(([female, male]) => (
          <React.Fragment key={female}>
            <SegBar seg={female} />
            <SegBar seg={male} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ── Advertiser section ────────────────────────────────────────────────────────

function AdvertiserSection({ combo, openedAgentIds }: { combo: ScriptCombo; openedAgentIds: Set<string> }) {
  const allElements = [
    combo.genre, combo.genre2,
    combo.setting, combo.protagonist,
    ...combo.supporting,
    combo.antagonist,
    combo.finale,
    ...combo.themesEvents,
  ].filter((e): e is NonNullable<typeof e> => e != null);

  const scores = scoreAudience(allElements);
  const ranked = rankAgencies(scores, openedAgentIds);
  const maxFit = Math.max(1, ...ranked.map(r => r.fit));

  return (
    <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: "8px" }}>
      <span style={{ ...ROW_LABEL, display: "block", marginBottom: "6px" }}>Advertisers</span>
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        {ranked.map(({ agency, fit, available }) => {
          const pct = Math.max(0, fit) / maxFit;
          const locked = !available;
          return (
            <div
              key={agency.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                opacity: locked ? 0.4 : 1,
              }}
            >
              <span style={{
                fontFamily: "var(--font-ui)",
                fontSize: "9px",
                color: "var(--color-text-secondary)",
                width: "110px",
                flexShrink: 0,
                letterSpacing: "0.03em",
              }}>
                {locked && <span style={{ marginRight: "4px", fontSize: "8px" }}>🔒</span>}
                {agency.label}
              </span>
              {/* Segment dots */}
              <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                {agency.targetSegments.map(seg => (
                  <span
                    key={seg}
                    title={SEGMENT_LABELS[seg]}
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "7px",
                      padding: "1px 3px",
                      background: "var(--color-bg-sunken, rgba(0,0,0,0.2))",
                      color: "var(--color-text-muted)",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {seg}
                  </span>
                ))}
              </div>
              {/* Fit bar */}
              <div style={{
                flex: 1,
                height: "3px",
                background: "var(--color-border-subtle)",
                position: "relative",
                minWidth: "30px",
              }}>
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: `${pct * 100}%`,
                  height: "100%",
                  background: fit <= 0 ? "var(--color-border)" : "var(--color-gold)",
                }} />
              </div>
              <span style={{
                fontFamily: "var(--font-ui)",
                fontSize: "9px",
                color: fit > 0 ? "var(--color-gold)" : "var(--color-text-muted)",
                width: "24px",
                flexShrink: 0,
                textAlign: "right",
              }}>
                {fit > 0 ? `+${fit}` : fit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

export default function ScriptCard({
  combo,
  index,
  onUse,
  bannedIds,
  pendingBannedIds,
  openedAgentIds,
}: {
  combo: ScriptCombo;
  index: number;
  onUse?: (combo: ScriptCombo) => void;
  bannedIds?: Set<string>;
  pendingBannedIds?: Set<string>;
  openedAgentIds?: Set<string>;
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

      {/* Audience appeal */}
      {openedAgentIds !== undefined && <AudienceSection combo={combo} />}

      {/* Advertiser recommendations */}
      {openedAgentIds !== undefined && <AdvertiserSection combo={combo} openedAgentIds={openedAgentIds} />}

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
