"use client";

import { useCallback } from "react";
import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";
import { ACTION_BTN, SECTION_HEADER, goldHover } from "@/lib/styles";
import type { Milestone } from "@/lib/save-file";

// ── Static metadata ────────────────────────────────────────────────────────────

interface MilestoneMeta {
  label: string;
  description?: string;
}

const MILESTONE_META: Record<string, MilestoneMeta> = {
  POLICY_ENABLE_MILE_7: { label: "Policies Unlocked", description: "Studio policy system becomes available on 1 May 1933" },

  POLICY_TRASH_0: { label: "Choose Trash King", description: "Exploitation films, grotesque characters, shoestring budgets" },
  POLICY_TRASH_1: { label: "6 Sequels in One Year", description: "Unlocks: dual trash elements per script; cheap post-production contractors" },
  POLICY_TRASH_2: { label: "1,500,000 Viewers", description: "Unlocks: double feature screenings (two trash films at one screening)" },
  POLICY_TRASH_3: { label: "Pollux-winning Actor in a Trash Film", description: "Unlocks: discounted hiring for talent below Level 4" },

  POLICY_MAJOR_0: { label: "Choose Behemoth", description: "Make movies everyone will see with style and flair" },
  POLICY_MAJOR_1: { label: "8 Skilled Actors on Long-Term Contract", description: "Unlocks: commercial-status talent more willing to sign with you" },
  POLICY_MAJOR_2: { label: "Hold Top 3 Box Office Spots", description: "Unlocks: special post-production contractors" },
  POLICY_MAJOR_3: { label: "Reputation 2,000+ for a Full Year", description: "Unlocks: intensive staff holidays for morale recovery" },

  POLICY_BOUTIQUE_0: { label: "Choose Boutique", description: "Prestige filmmaking; experiment with form and content" },
  POLICY_BOUTIQUE_1: { label: "5 Artistic Actors in One Film", description: "Unlocks: artistic-status talent more willing to sign with you" },
  POLICY_BOUTIQUE_2: { label: "Sweep the Pollux Awards", description: "Win Best Picture, Director, Screenplay, Actor & Actress in one year — Unlocks: experimental training to break development ceilings" },
  POLICY_BOUTIQUE_3: { label: "Three Consecutive Best Pictures", description: "Unlocks: talent agency finds a promising young actor every 6 months" },

  POLICY_CONVEYOR_0: { label: "Choose Factory", description: "High-volume, consistent, commercially reliable product" },
  POLICY_CONVEYOR_1: { label: "3 Demands in a Row", description: "Unlocks: purchase new story elements to meet demands" },
  POLICY_CONVEYOR_2: { label: "13 Films with All-Fresh Elements", description: "Unlocks: writers periodically submit high-potential ideas" },
  POLICY_CONVEYOR_3: { label: "13 Films in a Calendar Year", description: "Unlocks: choose 5 story elements that stay permanently fresh" },

  POLICY_AVERAGE_0: { label: "Stay Open / All-Rounder", description: "Use all policies; forfeit deepening bonuses" },

  HESPRO_QUEST_1: { label: "100+ Day Shooting Period", description: "Single film shooting period exceeds 100 days" },
  HESPRO_QUEST_2: { label: "5 Films with HesPro 35", description: "Complete 5 films using HesPro 35 imaging" },

  BLUE_TERM_IRIS_QUEST_1: { label: "Level 8+ Cinematographer", description: "1 film shot with a Skill 0.8 (level 8+) cinematographer" },
  BLUE_TERM_IRIS_QUEST_2: { label: "2 On-Location Films", description: "2 films shot entirely on location (no soundstage)" },

  DUPLER_COMPACT_QUEST_1: { label: "World War II Setting", description: "1 film set in a WW2 setting (Europe, Pacific, or Africa)" },
  DUPLER_COMPACT_QUEST_2: { label: "3 Commercial Action Films", description: "3 Action films (≥50% Action) with commercial rating 5+" },

  HESPRO_70_EXTRA_QUEST_1: { label: "3 Exotic Outdoor Films", description: "3 films shot at sea, jungle, or desert locations" },
  HESPRO_70_EXTRA_QUEST_2: { label: "3 Commercial Adventure Films", description: "3 Adventure films (≥50% Adventure) with commercial rating 6+" },

  BLUE_TERM_LUCID_DELUXE_QUEST_1: { label: "2 On-Location Films", description: "2 films shot entirely on location (no soundstage)" },
  BLUE_TERM_LUCID_DELUXE_QUEST_2: { label: "16-Hour Days for 40+ Days", description: "1 film with 16-hour shooting days maintained for 40+ days" },

  DUPLER_COMPACT_CFS_QUEST_1: { label: "Film Under 40 Days", description: "1 film completed with a filming period under 40 days" },
  DUPLER_COMPACT_CFS_QUEST_2: { label: "5 Action Films", description: "5 Action films (≥50% Action) using Dupler Compact CF" },

  HESPRO_70_RAD_EXTRA_QUEST_1: { label: "5 Films with HesPro 70 Radians", description: "Complete 5 films using HesPro 70 Radians" },
  HESPRO_70_RAD_EXTRA_QUEST_2: { label: "3 Top-5 Box Office Films", description: "3 films using HesPro 70 Radians that reach top 5 box office" },

  FLUMEN_CELERE_PRO_QUEST_1: { label: "Same Cinematographer, 5 Films", description: "Same cinematographer uses Flumen Celere across 5+ unique productions" },
  FLUMEN_CELERE_PRO_QUEST_2: { label: "5+ Indoor Locations", description: "3 films with 5 or more soundstage locations" },

  FRAMETONE_QUEST_1: { label: "16-Hour Days, Full Shoot", description: "1 film shot 16 hours/day for the entire filming period" },
  FRAMETONE_QUEST_2: { label: "3 Soundstage Films", description: "3 films shot entirely on soundstage (no outdoor location)" },

  FRAMETONE_CRYSTAL_CLEAR_QUEST_1: { label: "3 On-Location Films", description: "3 films shot entirely on location (no soundstage)" },
  FRAMETONE_CRYSTAL_CLEAR_QUEST_2: { label: "3 Soundstage Films", description: "3 films shot entirely on soundstage (no outdoor)" },

  FILMSOUND_NOVUM_ORGANUM_QUEST_1: { label: "3 Films with FilmSound Organum", description: "Complete 3 films using FilmSound Organum" },
  FILMSOUND_NOVUM_ORGANUM_QUEST_2: { label: "5+ Extras in Cast", description: "1 film using FilmSound Organum with 5 or more extras" },

  FILMSOUND_PRAEALTUM_QUEST_1: { label: "16-Hour Days for 30+ Days", description: "1 film using Frametone Altum with 16-hour days for 30+ days" },
  FILMSOUND_PRAEALTUM_QUEST_2: { label: "3 Top-5 Box Office Films", description: "3 films using Frametone Altum that reach top 5 box office" },
};

interface MilestoneGroupDef {
  id: string;
  title: string;
  prefix: string;
  section: string;
}

const MILESTONE_GROUP_DEFS: MilestoneGroupDef[] = [
  { id: "policy_enable", title: "Policy Unlock",  prefix: "POLICY_ENABLE",                section: "Studio Policies" },
  { id: "trash",         title: "Trash King",      prefix: "POLICY_TRASH",                 section: "Studio Policies" },
  { id: "major",         title: "Behemoth",         prefix: "POLICY_MAJOR",                 section: "Studio Policies" },
  { id: "boutique",      title: "Boutique",         prefix: "POLICY_BOUTIQUE",              section: "Studio Policies" },
  { id: "conveyor",      title: "Factory",          prefix: "POLICY_CONVEYOR",              section: "Studio Policies" },
  { id: "average",       title: "All-Rounder",      prefix: "POLICY_AVERAGE",               section: "Studio Policies" },
  { id: "hespro",        title: "HesPro 35 Extra",                prefix: "HESPRO_QUEST",                 section: "Technology Quests" },
  { id: "bluetermIris",  title: "Blue Term Iris Deluxe",          prefix: "BLUE_TERM_IRIS_QUEST",         section: "Technology Quests" },
  { id: "duplerCompact", title: "Dupler Compact S",               prefix: "DUPLER_COMPACT_QUEST",         section: "Technology Quests" },
  { id: "hespro70extra", title: "HesPro 70 Extra",                prefix: "HESPRO_70_EXTRA_QUEST",        section: "Technology Quests" },
  { id: "bluetermLucid", title: "Blue Term Lucid Deluxe",         prefix: "BLUE_TERM_LUCID_DELUXE_QUEST", section: "Technology Quests" },
  { id: "duplerCFS",     title: "Dupler Compact CF-S",            prefix: "DUPLER_COMPACT_CFS_QUEST",     section: "Technology Quests" },
  { id: "hespro70rad",   title: "HesPro 70 Radians Extra",        prefix: "HESPRO_70_RAD_EXTRA_QUEST",    section: "Technology Quests" },
  { id: "flumenCelere",  title: "Flumen Celere Pro",              prefix: "FLUMEN_CELERE_PRO_QUEST",      section: "Technology Quests" },
  { id: "frametone",     title: "Frametone Pure",                 prefix: "FRAMETONE_QUEST",              section: "Technology Quests" },
  { id: "frametoneClear",title: "Frametone Crystal Clear",        prefix: "FRAMETONE_CRYSTAL_CLEAR_QUEST",section: "Technology Quests" },
  { id: "filmsoundNovum",title: "FilmSound Novum Organum",        prefix: "FILMSOUND_NOVUM_ORGANUM_QUEST",section: "Technology Quests" },
  { id: "filmsoundPrae", title: "Frametone Praealtum",            prefix: "FILMSOUND_PRAEALTUM_QUEST",    section: "Technology Quests" },
];

interface FuncMeta {
  label: string;
  category: string;
}

const FUNC_META: Record<string, FuncMeta> = {
  MapNavigation:                { label: "Map Navigation",            category: "UI" },
  BirdView:                     { label: "Studio Overview",           category: "UI" },
  InfoButton:                   { label: "Info Tooltips",             category: "UI" },
  TimeFlow:                     { label: "Time Flow",                 category: "UI" },
  FullTimeControls:             { label: "Full Time Controls",        category: "UI" },
  ShowTopBarElements:           { label: "Top Bar",                   category: "UI" },
  ShowBottomBarProgress:        { label: "Bottom Bar Progress",       category: "UI" },
  ShowBottomBarButtons:         { label: "Bottom Bar Buttons",        category: "UI" },
  ShowBottomConstructorButton:  { label: "Construction Button",       category: "UI" },
  ShowBottomStartProjectButton: { label: "Start Project Button",      category: "UI" },
  UnblockUI:                    { label: "UI Access",                 category: "UI" },
  QualitySelection:             { label: "Post-Production Quality",   category: "Management" },
  Lieutenants:                  { label: "Lieutenants",               category: "Management" },
  Captains:                     { label: "Captains",                  category: "Management" },
  Building:                     { label: "Building Construction",     category: "Management" },
  FreezeBuilding:               { label: "Mothball Buildings",        category: "Management" },
  Staff:                        { label: "Staff Management",          category: "Management" },
  HRSelection:                  { label: "HR Department",             category: "Management" },
  Cash:                         { label: "Cash Balance",              category: "Management" },
  Influence:                    { label: "Influence Points",          category: "Management" },
  Upgrades:                     { label: "Technology Upgrades",       category: "Management" },
  Policy:                       { label: "Studio Policy",             category: "Management" },
  PerksEnabled:                 { label: "Perks System",              category: "Management" },
  Secrets:                      { label: "Secrets",                   category: "Management" },
  ProductionEvents:             { label: "Production Events",         category: "Events & Competition" },
  CharacterEvents:              { label: "Character Events",          category: "Events & Competition" },
  Scandals:                     { label: "Scandals",                  category: "Events & Competition" },
  StaffRaises:                  { label: "Staff Raises",              category: "Events & Competition" },
  StaffRequests:                { label: "Staff Requests",            category: "Events & Competition" },
  AttackByCompetitors:          { label: "Competitor Attacks",        category: "Events & Competition" },
  Fire:                         { label: "Fire Staff",                category: "Events & Competition" },
  PoliceRaidDefense:            { label: "Police Raid Defense",       category: "Events & Competition" },
  PoliceDefence:                { label: "Police Defence",            category: "Events & Competition" },
};

const FUNC_CATEGORY_ORDER = ["UI", "Management", "Events & Competition"];

// ── Grouping helpers ───────────────────────────────────────────────────────────

interface MilestoneGroup {
  groupId: string;
  title: string;
  section: string;
  items: [string, Milestone][];
}

function groupMilestones(entries: [string, Milestone][]): MilestoneGroup[] {
  const grouped = new Map<string, [string, Milestone][]>();
  const ungrouped: [string, Milestone][] = [];

  for (const entry of entries) {
    const [id] = entry;
    const def = MILESTONE_GROUP_DEFS.find(
      (g) => id === g.prefix || id.startsWith(g.prefix + "_")
    );
    if (def) {
      if (!grouped.has(def.id)) grouped.set(def.id, []);
      grouped.get(def.id)!.push(entry);
    } else {
      ungrouped.push(entry);
    }
  }

  const result: MilestoneGroup[] = MILESTONE_GROUP_DEFS
    .filter((g) => grouped.has(g.id))
    .map((g) => ({ groupId: g.id, title: g.title, section: g.section, items: grouped.get(g.id)! }));

  if (ungrouped.length > 0) {
    result.push({ groupId: "other", title: "Other", section: "", items: ungrouped });
  }

  return result;
}

interface FuncGroup {
  category: string;
  items: [string, boolean][];
}

function groupFunctionalities(entries: [string, boolean][]): FuncGroup[] {
  const grouped = new Map<string, [string, boolean][]>();

  for (const entry of entries) {
    const category = FUNC_META[entry[0]]?.category ?? "Other";
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category)!.push(entry);
  }

  const result: FuncGroup[] = FUNC_CATEGORY_ORDER
    .filter((c) => grouped.has(c))
    .map((c) => ({ category: c, items: grouped.get(c)! }));

  for (const [cat, items] of grouped) {
    if (!FUNC_CATEGORY_ORDER.includes(cat)) result.push({ category: cat, items });
  }

  return result;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function formatMilestoneLabel(id: string): string {
  return id
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function GroupHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginTop: "14px",
        marginBottom: "5px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>
      <div style={{ flex: 1, height: "1px", background: "var(--color-border-subtle)" }} />
    </div>
  );
}

function SuperSectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--color-text-secondary)",
        marginTop: "20px",
        marginBottom: "2px",
        paddingBottom: "6px",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {title}
    </div>
  );
}

function MilestoneRow({
  milestone,
  onToggleFinished,
  onToggleLocked,
}: {
  milestone: Milestone;
  onToggleFinished: () => void;
  onToggleLocked: () => void;
}) {
  const progress = parseFloat(milestone.progress) || 0;
  const meta = MILESTONE_META[milestone.id];
  const label = meta?.label ?? formatMilestoneLabel(milestone.id);
  const description = meta?.description;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto",
        alignItems: "center",
        gap: "16px",
        padding: "10px 16px",
        border: "1px solid var(--color-border-subtle)",
        background: milestone.finished ? "#3a5a3a18" : "transparent",
        marginBottom: "4px",
        transition: "background 0.15s ease",
      }}
    >
      {/* Label + description + progress */}
      <div style={{ minWidth: 0 }}>
        <p
          title={label}
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "12px",
            color: milestone.finished ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </p>
        {description && (
          <p
            title={description}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              color: "var(--color-text-muted)",
              letterSpacing: "0.02em",
              marginTop: "2px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {description}
          </p>
        )}
        {!milestone.finished && progress > 0 && (
          <div
            style={{
              marginTop: "5px",
              height: "2px",
              background: "var(--color-bg-raised)",
              overflow: "hidden",
              width: "120px",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress * 100}%`,
                background: "var(--color-gold)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        )}
      </div>

      {/* Locked toggle */}
      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", userSelect: "none" }}>
        <div
          onClick={onToggleLocked}
          style={{
            width: 13,
            height: 13,
            flexShrink: 0,
            border: `1px solid ${milestone.locked ? "var(--color-warning)" : "var(--color-border)"}`,
            background: milestone.locked ? "var(--color-warning)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
            cursor: "pointer",
          }}
        >
          {milestone.locked && (
            <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
              <polyline points="1,3.5 3,5.5 6.5,2" stroke="#111009" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "10px", color: milestone.locked ? "var(--color-warning)" : "var(--color-text-muted)", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
          Locked
        </span>
      </label>

      {/* Finished toggle */}
      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", userSelect: "none" }}>
        <div
          onClick={onToggleFinished}
          style={{
            width: 13,
            height: 13,
            flexShrink: 0,
            border: `1px solid ${milestone.finished ? "var(--color-success)" : "var(--color-border)"}`,
            background: milestone.finished ? "var(--color-success)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
            cursor: "pointer",
          }}
        >
          {milestone.finished && (
            <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
              <polyline points="1,3.5 3,5.5 6.5,2" stroke="#111009" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "10px", color: milestone.finished ? "var(--color-success)" : "var(--color-text-muted)", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
          Finished
        </span>
      </label>
    </div>
  );
}

function FunctionalityToggle({
  id,
  label,
  enabled,
  onToggle,
}: {
  id: string;
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        padding: "8px 12px",
        border: `1px solid ${enabled ? "var(--color-border)" : "var(--color-border-subtle)"}`,
        background: enabled ? "#c9a44a08" : "transparent",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
      onClick={onToggle}
    >
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "11px",
          color: enabled ? "var(--color-text-primary)" : "var(--color-text-muted)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      {/* Toggle pill */}
      <div
        style={{
          width: 28,
          height: 14,
          flexShrink: 0,
          background: enabled ? "var(--color-gold)" : "var(--color-bg-raised)",
          border: `1px solid ${enabled ? "var(--color-gold)" : "var(--color-border)"}`,
          position: "relative",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: enabled ? 14 : 2,
            width: 8,
            height: 8,
            background: enabled ? "#111009" : "var(--color-text-muted)",
            transition: "left 0.2s ease",
          }}
        />
      </div>
    </div>
  );
}

// ── Main module ───────────────────────────────────────────────────────────────

export default function MilestonesModule() {
  const { isLoaded, saveData, updateStateJson } = useSaveFile();

  const milestones = saveData?.stateJson?.milestones ?? {};
  const functionalities = saveData?.stateJson?.functionalities ?? {};

  const milestoneEntries = Object.entries(milestones) as [string, Milestone][];
  const functionalityEntries = Object.entries(functionalities) as [string, boolean][];

  const finishedCount = milestoneEntries.filter(([, m]) => m.finished).length;
  const enabledCount = functionalityEntries.filter(([, v]) => v).length;

  const toggleMilestoneFinished = useCallback(
    (id: string) => {
      updateStateJson((s) => {
        const m = s.milestones[id] as Milestone | undefined;
        if (m) {
          m.finished = !m.finished;
          if (m.finished) {
            m.progress = "1.000";
            m.locked = false;
          }
        }
      });
    },
    [updateStateJson]
  );

  const toggleMilestoneLocked = useCallback(
    (id: string) => {
      updateStateJson((s) => {
        const m = s.milestones[id] as Milestone | undefined;
        if (m) m.locked = !m.locked;
      });
    },
    [updateStateJson]
  );

  const unlockAllMilestones = useCallback(() => {
    updateStateJson((s) => {
      for (const key of Object.keys(s.milestones)) {
        const m = s.milestones[key] as Milestone;
        m.finished = true;
        m.locked = false;
        m.progress = "1.000";
      }
    });
  }, [updateStateJson]);

  const toggleFunctionality = useCallback(
    (key: string) => {
      updateStateJson((s) => {
        s.functionalities[key] = !s.functionalities[key];
      });
    },
    [updateStateJson]
  );

  const enableAllFunctionalities = useCallback(() => {
    updateStateJson((s) => {
      for (const key of Object.keys(s.functionalities)) {
        s.functionalities[key] = true;
      }
    });
  }, [updateStateJson]);

  const milestoneGroups = groupMilestones(milestoneEntries);
  const funcGroups = groupFunctionalities(functionalityEntries);

  return (
    <ModuleShell
      title="Milestones & Features"
      subtitle={
        isLoaded
          ? `${finishedCount}/${milestoneEntries.length} milestones finished · ${enabledCount}/${functionalityEntries.length} features enabled`
          : "Manage milestones and game feature flags"
      }
      maxWidth={860}
      actions={
        isLoaded ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={enableAllFunctionalities}
              style={ACTION_BTN}
              onMouseEnter={(e) => goldHover(e, true)}
              onMouseLeave={(e) => goldHover(e, false)}
            >
              Enable All Features
            </button>
            <button
              onClick={unlockAllMilestones}
              style={ACTION_BTN}
              onMouseEnter={(e) => goldHover(e, true)}
              onMouseLeave={(e) => goldHover(e, false)}
            >
              Unlock All Milestones
            </button>
          </div>
        ) : undefined
      }
    >
      {!isLoaded ? (
        <EmptyState message="Upload a save file to edit milestones and features" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
          {/* Milestones column */}
          <div>
            <p style={{ ...SECTION_HEADER, marginBottom: "10px" }}>
              Milestones
              <span style={{ color: "var(--color-text-muted)", fontWeight: 400, marginLeft: "6px" }}>
                {finishedCount}/{milestoneEntries.length}
              </span>
            </p>
            {milestoneGroups.length === 0 ? (
              <EmptyState message="No milestones found" />
            ) : (
              (() => {
                let lastSection = "";
                return milestoneGroups.map((group) => {
                  const showSuperSection = group.section && group.section !== lastSection;
                  if (showSuperSection) lastSection = group.section;
                  return (
                    <div key={group.groupId}>
                      {showSuperSection && <SuperSectionHeader title={group.section} />}
                      <GroupHeader title={group.title} />
                      {group.items.map(([id, milestone]) => (
                        <MilestoneRow
                          key={id}
                          milestone={milestone}
                          onToggleFinished={() => toggleMilestoneFinished(id)}
                          onToggleLocked={() => toggleMilestoneLocked(id)}
                        />
                      ))}
                    </div>
                  );
                });
              })()
            )}
          </div>

          {/* Functionalities column */}
          <div>
            <p style={{ ...SECTION_HEADER, marginBottom: "10px" }}>
              Game Features
              <span style={{ color: "var(--color-text-muted)", fontWeight: 400, marginLeft: "6px" }}>
                {enabledCount}/{functionalityEntries.length}
              </span>
            </p>
            {funcGroups.length === 0 ? (
              <EmptyState message="No features found" />
            ) : (
              funcGroups.map((group) => (
                <div key={group.category}>
                  <GroupHeader title={group.category} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {group.items.map(([key, enabled]) => (
                      <FunctionalityToggle
                        key={key}
                        id={key}
                        label={FUNC_META[key]?.label ?? key}
                        enabled={enabled}
                        onToggle={() => toggleFunctionality(key)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </ModuleShell>
  );
}
