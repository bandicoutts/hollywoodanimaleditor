"use client";

import type { ReactNode } from "react";

interface ModuleShellProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: number | string;
}

export default function ModuleShell({
  title,
  subtitle,
  actions,
  children,
  maxWidth,
}: ModuleShellProps) {
  return (
    <div
      style={{
        padding: "32px 36px",
        maxWidth: maxWidth ?? "none",
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "12px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "22px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "12px",
              color: "var(--color-text-muted)",
              marginTop: "4px",
            }}
          >
            {subtitle}
          </p>
        </div>
        {actions && (
          <div style={{ display: "flex", gap: "8px", flexShrink: 0, paddingTop: "2px" }}>
            {actions}
          </div>
        )}
      </div>

      {/* Gold divider */}
      <hr className="gold-divider" style={{ marginBottom: "24px" }} />

      {children}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        gap: "12px",
      }}
    >
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        style={{ color: "var(--color-text-muted)", opacity: 0.25 }}
      >
        <rect x="4" y="2" width="28" height="32" rx="0" />
        <line x1="10" y1="11" x2="26" y2="11" />
        <line x1="10" y1="17" x2="26" y2="17" />
        <line x1="10" y1="23" x2="20" y2="23" />
      </svg>
      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "16px",
          color: "var(--color-text-muted)",
          textAlign: "center",
        }}
      >
        {message}
      </p>
    </div>
  );
}
