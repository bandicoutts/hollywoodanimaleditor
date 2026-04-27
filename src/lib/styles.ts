import type { CSSProperties, MouseEvent } from "react";

// Uppercase muted section label (10px, font-ui, 0.08em tracking)
export const LABEL_STYLE: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "10px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
};

// Bold uppercase section header (11px, font-ui, secondary colour)
export const SECTION_HEADER: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--color-text-secondary)",
};

// Small ghost button for inline section-level actions (3px/8px padding)
export const GHOST_BTN: CSSProperties = {
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
};

// Larger action button for ModuleShell header-level actions (5px/14px padding)
export const ACTION_BTN: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "11px",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
  background: "transparent",
  border: "1px solid var(--color-border)",
  padding: "5px 14px",
  cursor: "pointer",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
};

// Standard gold hover for ghost/action buttons
export function goldHover(
  e: MouseEvent<HTMLButtonElement>,
  active: boolean
): void {
  if (active) {
    e.currentTarget.style.color = "var(--color-gold)";
    e.currentTarget.style.borderColor = "var(--color-gold-mid)";
  } else {
    e.currentTarget.style.color = "var(--color-text-muted)";
    e.currentTarget.style.borderColor = "var(--color-border)";
  }
}
