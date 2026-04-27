"use client";

export function fmt(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(2);
}

export default function ScoreBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <span
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "10px",
        letterSpacing: "0.06em",
        color,
        border: `1px solid ${color}55`,
        padding: "2px 7px",
        whiteSpace: "nowrap",
      }}
    >
      {label} {fmt(value)}
    </span>
  );
}
