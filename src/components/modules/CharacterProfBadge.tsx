"use client";

import { getProfessionColor, getProfessionLabel } from "@/data/professions";

export default function ProfBadge({
  profKey,
  size = "md",
}: {
  profKey: string;
  size?: "sm" | "md";
}) {
  const color = getProfessionColor(profKey);
  const label = getProfessionLabel(profKey);
  const pad = size === "sm" ? "1px 7px" : "2px 10px";
  const fs = size === "sm" ? "10px" : "11px";
  return (
    <span
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: fs,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color,
        background: color + "18",
        border: `1px solid ${color}40`,
        padding: pad,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}
