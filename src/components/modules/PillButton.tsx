"use client";

export default function PillButton({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "11px",
        letterSpacing: "0.06em",
        padding: "5px 12px",
        border: `1px solid ${active ? "var(--color-gold)" : "var(--color-border)"}`,
        background: active ? "var(--color-gold)18" : "transparent",
        color: active ? "var(--color-gold)" : "var(--color-text-muted)",
        cursor: "pointer",
        transition: "all 0.12s ease",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}
