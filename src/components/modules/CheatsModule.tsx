"use client";

import { useCallback, useMemo } from "react";
import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";
import { formatDecimalString } from "@/lib/save-file";

// ── Config ────────────────────────────────────────────────────────────────────

const NEGOTIATION_PERKS = ["NEGOTIATION_SCALE_50", "NEGOTIATION_SCALE_75"] as const;

const AD_AGENCY_IDS = [
  "B1RADIO",  // NBG
  "B1BLBRD",  // Ross & Ross Bros.
  "ARTMAG",   // Vien Pascal
  "TYC1",     // Spice Mice
  "COMMAG",   // Spark
  "B3PRINT",  // Nate Sparrow Press
  "FC2",      // Velvet Gloss
  "MCA1",     // Pierre Zola Company
] as const;

const AD_AGENCY_NAMES: Record<string, string> = {
  B1RADIO: "NBG",
  B1BLBRD: "Ross & Ross Bros.",
  ARTMAG: "Vien Pascal",
  TYC1: "Spice Mice",
  COMMAG: "Spark",
  B3PRINT: "Nate Sparrow Press",
  FC2: "Velvet Gloss",
  MCA1: "Pierre Zola Company",
};

const POLICIES = [
  { id: "",               label: "None" },
  { id: "TRASH_DOMINION", label: "Trash King" },
  { id: "MAJOR_DOMINION", label: "Behemoth" },
  { id: "BOUTIQUE_DOMINION", label: "Boutique" },
] as const;

const RESEARCH_PRESETS = [
  { label: "1×",   value: "1.000" },
  { label: "5×",   value: "5.000" },
  { label: "10×",  value: "10.000" },
  { label: "Max (99×)", value: "99.000" },
] as const;

// ── Shared styles ─────────────────────────────────────────────────────────────

const SECTION_LABEL: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "10px",
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
};

const HINT: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "11px",
  color: "var(--color-text-muted)",
  marginTop: "2px",
};

const STATUS_OK: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "10px",
  letterSpacing: "0.06em",
  color: "#8fbc55",
};

const STATUS_WARN: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "10px",
  letterSpacing: "0.06em",
  color: "var(--color-gold)",
};

function CheatButton({
  label,
  onClick,
  color = "var(--color-gold)",
}: {
  label: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color,
        background: "transparent",
        border: `1px solid ${color}88`,
        padding: "5px 14px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = color + "22";
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = color + "88";
      }}
    >
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "20px 0",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <p style={{ ...SECTION_LABEL, marginBottom: "12px" }}>{title}</p>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CheatsModule() {
  const { isLoaded, saveData, updateStateJson } = useSaveFile();

  // ── Derived state ─────────────────────────────────────────────────────────

  const openedPerks: string[] = useMemo(
    () => saveData?.stateJson?.openedPerks ?? [],
    [saveData]
  );

  const openedAgencies: string[] = useMemo(
    () => (saveData?.stateJson?.openedAdsAgents as string[] | undefined) ?? [],
    [saveData]
  );

  const currentPolicy: string = useMemo(
    () => (saveData?.stateJson?.mainPolicyId as string | undefined) ?? "",
    [saveData]
  );

  const currentSpeedup: string = useMemo(
    () => saveData?.stateJson?.overallPerkResearchSpeedup ?? "1.000",
    [saveData]
  );

  const negPerkStatus = useMemo(() => ({
    scale50: openedPerks.includes("NEGOTIATION_SCALE_50"),
    scale75: openedPerks.includes("NEGOTIATION_SCALE_75"),
  }), [openedPerks]);

  const unlockedAgencyCount = useMemo(
    () => AD_AGENCY_IDS.filter((id) => openedAgencies.includes(id)).length,
    [openedAgencies]
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  const applyNegotiationBonus = useCallback(() => {
    updateStateJson((s) => {
      for (const perkId of NEGOTIATION_PERKS) {
        if (!s.openedPerks.includes(perkId)) s.openedPerks.push(perkId);
      }
      for (const c of s.characters) {
        if (typeof c.BonusCardMoney === "number") c.BonusCardMoney = 4;
        if (typeof c.BonusCardInfluencePoints === "number") c.BonusCardInfluencePoints = 4;
        if (Array.isArray(c.bonusCards)) {
          const cards = c.bonusCards as number[];
          if (cards.length >= 1 && typeof c.BonusCardMoney === "number") cards[0] = 4;
          if (cards.length >= 2 && typeof c.BonusCardInfluencePoints === "number") cards[1] = 4;
        }
      }
    }, "Cheats — max negotiation bonus");
  }, [updateStateJson]);

  const unlockAllAgencies = useCallback(() => {
    updateStateJson((s) => {
      if (!Array.isArray(s.openedAdsAgents)) s.openedAdsAgents = [];
      const existing = new Set(s.openedAdsAgents as string[]);
      for (const id of AD_AGENCY_IDS) {
        if (!existing.has(id)) (s.openedAdsAgents as string[]).push(id);
      }
    }, "Cheats — unlock all ad agencies");
  }, [updateStateJson]);

  const setPolicy = useCallback((policyId: string) => {
    updateStateJson((s) => {
      s.mainPolicyId = policyId;
    }, `Cheats — set policy: ${policyId || "None"}`);
  }, [updateStateJson]);

  const setResearchSpeedup = useCallback((value: string) => {
    updateStateJson((s) => {
      s.overallPerkResearchSpeedup = value;
    }, `Cheats — research speedup ${value}x`);
  }, [updateStateJson]);

  const maxXpAll = useCallback(() => {
    updateStateJson((s) => {
      for (const c of s.characters) {
        c.xp = 9_999_999;
      }
    }, "Cheats — max XP all characters");
  }, [updateStateJson]);

  const maxAllResources = useCallback(() => {
    updateStateJson((s) => {
      s.budget = 1_000_000_000;
      s.cash = 1_000_000_000;
      s.reputation = formatDecimalString(200_000);
      s.influence = 1_000_000;
    }, "Cheats — max all resources");
  }, [updateStateJson]);

  if (!isLoaded || !saveData) {
    return (
      <ModuleShell title="Cheats & Mods" subtitle="One-click save file modifications">
        <EmptyState message="Upload a save file to use cheats" />
      </ModuleShell>
    );
  }

  const _foundPolicy = POLICIES.find((p) => p.id === currentPolicy);
  const policyLabel = _foundPolicy ? _foundPolicy.label : (currentPolicy || "None");
  const speedupDisplay = parseFloat(currentSpeedup).toFixed(0) + "×";

  return (
    <ModuleShell title="Cheats & Mods" subtitle="One-click save file modifications">

      {/* ── Resources ─────────────────────────────────────────────────────── */}
      <Section title="Resources">
        <CheatButton label="Max All Resources" onClick={maxAllResources} />
        <p style={HINT}>Budget $1B · Cash $1B · Influence 1M · Reputation 200K</p>
      </Section>

      {/* ── Negotiation ───────────────────────────────────────────────────── */}
      <Section title="Negotiation">
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px", flexWrap: "wrap" }}>
          <CheatButton label="Max Negotiation Bonus" onClick={applyNegotiationBonus} />
          <div style={{ display: "flex", gap: "12px" }}>
            <span style={negPerkStatus.scale50 ? STATUS_OK : STATUS_WARN}>
              {negPerkStatus.scale50 ? "✓" : "✗"} Scale 50
            </span>
            <span style={negPerkStatus.scale75 ? STATUS_OK : STATUS_WARN}>
              {negPerkStatus.scale75 ? "✓" : "✗"} Scale 75
            </span>
          </div>
        </div>
        <p style={HINT}>Adds both negotiation scale perks and maxes lieutenant bonus cards</p>
      </Section>

      {/* ── Studio Policy ─────────────────────────────────────────────────── */}
      <Section title="Studio Policy">
        <div style={{ marginBottom: "10px" }}>
          <span style={{ ...HINT, color: "var(--color-text-secondary)" }}>
            Active: <strong style={{ color: "var(--color-gold)" }}>{policyLabel}</strong>
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {POLICIES.map((p) => {
            const isActive = currentPolicy === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPolicy(p.id)}
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "10px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: isActive ? "var(--color-gold)" : "var(--color-text-muted)",
                  background: isActive ? "var(--color-gold)18" : "transparent",
                  border: `1px solid ${isActive ? "var(--color-gold)88" : "var(--color-border)"}`,
                  padding: "4px 12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  position: "relative",
                  zIndex: isActive ? 1 : 0,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                    e.currentTarget.style.borderColor = "var(--color-border)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--color-text-muted)";
                    e.currentTarget.style.borderColor = "var(--color-border)";
                  }
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <p style={{ ...HINT, marginTop: "8px" }}>
          Setting "Trash King" also makes policy-locked writing tags usable in-game
        </p>
      </Section>

      {/* ── Advertising Agencies ──────────────────────────────────────────── */}
      <Section title="Advertising Agencies">
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px", flexWrap: "wrap" }}>
          <CheatButton
            label={unlockedAgencyCount === AD_AGENCY_IDS.length ? "All Unlocked" : "Unlock All Agencies"}
            onClick={unlockAllAgencies}
            color={unlockedAgencyCount === AD_AGENCY_IDS.length ? "#8fbc55" : "var(--color-gold)"}
          />
          <span style={unlockedAgencyCount === AD_AGENCY_IDS.length ? STATUS_OK : STATUS_WARN}>
            {unlockedAgencyCount} / {AD_AGENCY_IDS.length} unlocked
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {AD_AGENCY_IDS.map((id) => {
            const unlocked = openedAgencies.includes(id);
            return (
              <span
                key={id}
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "10px",
                  letterSpacing: "0.04em",
                  color: unlocked ? "#8fbc55" : "var(--color-text-muted)",
                  border: `1px solid ${unlocked ? "#8fbc5544" : "var(--color-border-subtle)"}`,
                  padding: "2px 8px",
                }}
              >
                {AD_AGENCY_NAMES[id]}
              </span>
            );
          })}
        </div>
      </Section>

      {/* ── Research Speed ────────────────────────────────────────────────── */}
      <Section title="Research Speed">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {RESEARCH_PRESETS.map((p, i) => {
              const isActive = currentSpeedup === p.value;
              const isFirst = i === 0;
              const isLast = i === RESEARCH_PRESETS.length - 1;
              return (
                <button
                  key={p.label}
                  onClick={() => setResearchSpeedup(p.value)}
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "10px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: isActive ? "var(--color-gold)" : "var(--color-text-muted)",
                    background: isActive ? "var(--color-gold)18" : "transparent",
                    border: `1px solid ${isActive ? "var(--color-gold)88" : "var(--color-border)"}`,
                    marginLeft: isFirst ? 0 : "-1px",
                    borderRadius: isFirst ? "2px 0 0 2px" : isLast ? "0 2px 2px 0" : 0,
                    padding: "4px 10px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    position: "relative",
                    zIndex: isActive ? 1 : 0,
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "var(--color-text-secondary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "var(--color-text-muted)";
                    }
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <span style={{ ...HINT, color: "var(--color-text-secondary)" }}>
            Current: <strong style={{ color: "var(--color-gold)" }}>{speedupDisplay}</strong>
          </span>
        </div>
        <p style={HINT}>Multiplies the speed of all future research in the perk tree</p>
      </Section>

      {/* ── XP ────────────────────────────────────────────────────────────── */}
      <Section title="Experience">
        <CheatButton label="Max XP — All Characters" onClick={maxXpAll} />
        <p style={HINT}>Sets XP to 9,999,999 on every character (employed and fired)</p>
      </Section>

    </ModuleShell>
  );
}
