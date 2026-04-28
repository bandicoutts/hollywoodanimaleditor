"use client";

import { useState } from "react";

export type ModuleId =
  | "resources"
  | "characters"
  | "writing-tags"
  | "research"
  | "technologies"
  | "research-speedup"
  | "competitor-studios"
  | "milestones"
  | "ai-scripts"
  | "cheats";

interface NavItem {
  id: ModuleId;
  label: string;
  icon: React.ReactNode;
}

// ── Icons (inline SVG, 16×16, stroke-based) ───────────────────────────────────

function IconResources() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="2" y="9" width="3" height="6" rx="0" />
      <rect x="6.5" y="5" width="3" height="10" rx="0" />
      <rect x="11" y="1" width="3" height="14" rx="0" />
    </svg>
  );
}

function IconCharacters() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="6" cy="4.5" r="2.5" />
      <path d="M1 14c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <circle cx="12" cy="5" r="2" opacity="0.4" />
      <path d="M10.5 14c0-1.8 1-3.3 2.5-4" opacity="0.4" />
    </svg>
  );
}

function IconWritingTags() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="2" y="1" width="12" height="14" rx="0" />
      <line x1="5" y1="5" x2="11" y2="5" />
      <line x1="5" y1="8" x2="11" y2="8" />
      <line x1="5" y1="11" x2="9" y2="11" />
    </svg>
  );
}

function IconResearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="7" cy="7" r="5" />
      <line x1="8" y1="4" x2="8" y2="10" />
      <line x1="5" y1="7" x2="11" y2="7" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </svg>
  );
}

function IconTechnologies() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="1" y="4" width="10" height="8" rx="0" />
      <circle cx="6" cy="8" r="2.5" />
      <path d="M11 6h2l1.5 2-1.5 2H11" />
    </svg>
  );
}

function IconSpeedup() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="8" cy="8" r="6" />
      <polyline points="8,4 8,8 11,10" />
      <line x1="4" y1="2" x2="3" y2="0.5" />
      <line x1="12" y1="2" x2="13" y2="0.5" />
    </svg>
  );
}

function IconCompetitors() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="1" y="5" width="6" height="10" rx="0" />
      <rect x="9" y="1" width="6" height="14" rx="0" />
      <line x1="4" y1="9" x2="4" y2="11" />
      <line x1="12" y1="5" x2="12" y2="7" />
    </svg>
  );
}

function IconMilestones() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <polyline points="2,8 5,11 9,5" />
      <rect x="1" y="1" width="14" height="14" rx="0" />
    </svg>
  );
}

function IconAIScripts() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <polygon points="8,1 14.9,4.5 14.9,11.5 8,15 1.1,11.5 1.1,4.5" />
      <line x1="8" y1="4" x2="8" y2="8" />
      <line x1="11" y1="5.5" x2="8" y2="8" />
      <line x1="5" y1="5.5" x2="8" y2="8" />
      <line x1="8" y1="8" x2="8" y2="12" />
      <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconCheats() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M8 1 L15 8 L8 15 L1 8 Z" />
      <line x1="8" y1="5" x2="8" y2="9" />
      <circle cx="8" cy="11" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { id: "resources", label: "Resources", icon: <IconResources /> },
  { id: "characters", label: "Characters", icon: <IconCharacters /> },
  { id: "writing-tags", label: "Writing Tags", icon: <IconWritingTags /> },
  { id: "research", label: "Research", icon: <IconResearch /> },
  { id: "technologies", label: "Technologies", icon: <IconTechnologies /> },
  { id: "research-speedup", label: "Research Speed", icon: <IconSpeedup /> },
  { id: "competitor-studios", label: "Competitors", icon: <IconCompetitors /> },
  { id: "milestones", label: "Milestones", icon: <IconMilestones /> },
  { id: "ai-scripts", label: "Script Workshop", icon: <IconAIScripts /> },
  { id: "cheats", label: "Cheats & Mods", icon: <IconCheats /> },
];

interface SidebarProps {
  activeModule: ModuleId;
  onNavigate: (id: ModuleId) => void;
}

export default function Sidebar({ activeModule, onNavigate }: SidebarProps) {
  const [compact, setCompact] = useState(false);

  return (
    <aside
      style={{
        width: compact ? "var(--sidebar-width-compact)" : "var(--sidebar-width)",
        background: "var(--color-bg-panel)",
        borderRight: "1px solid var(--color-border-subtle)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
        transition: "width 0.25s ease",
      }}
    >
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 0" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeModule;
          return (
            <div key={item.id}>
              <button
              onClick={() => onNavigate(item.id)}
              title={compact ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: compact ? "10px 0" : "9px 16px",
                justifyContent: compact ? "center" : "flex-start",
                background: isActive ? "#c9a44a08" : "transparent",
                borderLeft: isActive
                  ? "2px solid var(--color-gold)"
                  : "2px solid transparent",
                borderRight: "none",
                borderTop: "none",
                borderBottom: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                color: isActive
                  ? "var(--color-gold)"
                  : "var(--color-text-muted)",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  e.currentTarget.style.color = "var(--color-text-secondary)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  e.currentTarget.style.color = "var(--color-text-muted)";
              }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {!compact && (
                <span
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "11px",
                    fontWeight: isActive ? 500 : 400,
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
              )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Compact toggle */}
      <button
        onClick={() => setCompact((c) => !c)}
        title={compact ? "Expand sidebar" : "Collapse sidebar"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px",
          background: "transparent",
          border: "none",
          borderTop: "1px solid var(--color-border-subtle)",
          cursor: "pointer",
          color: "var(--color-text-muted)",
          transition: "color 0.15s ease",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--color-text-secondary)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--color-text-muted)")
        }
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{ transform: compact ? "rotate(180deg)" : "none", transition: "transform 0.25s ease" }}
        >
          <polyline points="7,2 3,6 7,10" />
        </svg>
      </button>
    </aside>
  );
}
