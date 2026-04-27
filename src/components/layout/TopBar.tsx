"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSaveFile } from "@/context/SaveFileContext";

function StudioMark({ size = 24 }: { size?: number }) {
  const r = size / 2;
  const hex = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${r + (r - 3) * Math.cos(angle)},${r + (r - 3) * Math.sin(angle)}`;
  }).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <polygon points={hex} stroke="#c9a44a" strokeWidth="1.2" />
      <circle cx={r} cy={r} r={r * 0.35} stroke="#c9a44a" strokeWidth="1" />
      <circle cx={r} cy={r} r={r * 0.12} fill="#c9a44a" />
    </svg>
  );
}

function StatChip({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "9px",
          letterSpacing: "0.08em",
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--color-gold)",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000)
    return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function TopBar() {
  const { saveData, isLoaded, download, versionWarning, unsavedCount, changeLog } = useSaveFile();
  const stateJson = saveData?.stateJson;
  const version = saveData?.currentMeta?.lastSaveVersion;
  const studioName = stateJson?.studioName;
  const [downloaded, setDownloaded] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    download();
    setDownloaded(true);
    setLogOpen(false);
    setTimeout(() => setDownloaded(false), 2000);
  }, [download]);

  // Close log popover on outside click
  useEffect(() => {
    if (!logOpen) return;
    const handler = (e: MouseEvent) => {
      if (logRef.current && !logRef.current.contains(e.target as Node)) {
        setLogOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [logOpen]);

  return (
    <header
      style={{
        height: "var(--topbar-height)",
        background: "var(--color-bg-panel)",
        borderBottom: "1px solid var(--color-border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        flexShrink: 0,
        gap: "16px",
      }}
    >
      {/* Left: logo + studio name */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
        <StudioMark size={22} />
        <span
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "200px",
          }}
        >
          {studioName ?? "Studio Archives"}
        </span>
        {version && (
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "9px",
              letterSpacing: "0.08em",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              border: "1px solid var(--color-border)",
              padding: "1px 6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            v{version}
          </span>
        )}
        {versionWarning && (
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "9px",
              letterSpacing: "0.06em",
              color: "var(--color-danger)",
              textTransform: "uppercase",
              border: "1px solid var(--color-danger)",
              padding: "1px 6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            title={versionWarning}
          >
            Unknown version
          </span>
        )}
      </div>

      {/* Right: quick stats + download */}
      {isLoaded && stateJson && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexShrink: 0,
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <StatChip label="Budget" value={formatNumber(stateJson.budget)} />
          <StatChip label="Cash" value={formatNumber(stateJson.cash)} />
          <StatChip
            label="Reputation"
            value={parseFloat(stateJson.reputation).toFixed(0)}
          />
          <div
            style={{ width: "1px", height: "20px", background: "var(--color-border)" }}
          />
          <div ref={logRef} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", position: "relative" }}>
            {unsavedCount > 0 && !downloaded && (
              <button
                onClick={() => setLogOpen((o) => !o)}
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "9px",
                  letterSpacing: "0.06em",
                  color: "#c9a44a",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "0",
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                  textUnderlineOffset: "2px",
                }}
              >
                {unsavedCount} unsaved {unsavedCount === 1 ? "change" : "changes"}
              </button>
            )}
            {/* Change log popover */}
            {logOpen && changeLog.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "6px",
                  background: "var(--color-bg-panel)",
                  border: "1px solid var(--color-border)",
                  minWidth: "240px",
                  maxWidth: "320px",
                  zIndex: 100,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--color-border-subtle)",
                    fontFamily: "var(--font-ui)",
                    fontSize: "9px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Changes since last download
                </div>
                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {[...changeLog].reverse().map((entry, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "6px 12px",
                        borderBottom: i < changeLog.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
                        fontFamily: "var(--font-ui)",
                        fontSize: "11px",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {entry.description}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {logOpen && changeLog.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "6px",
                  background: "var(--color-bg-panel)",
                  border: "1px solid var(--color-border)",
                  minWidth: "200px",
                  zIndex: 100,
                  padding: "10px 12px",
                  fontFamily: "var(--font-ui)",
                  fontSize: "11px",
                  color: "var(--color-text-muted)",
                }}
              >
                No described changes yet
              </div>
            )}
            <button
              onClick={handleDownload}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: downloaded ? "var(--color-text-secondary)" : "var(--color-gold)",
                background: "transparent",
                border: `1px solid ${downloaded ? "var(--color-border)" : "var(--color-gold-mid)"}`,
                padding: "5px 14px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!downloaded) {
                  e.currentTarget.style.borderColor = "var(--color-gold)";
                  e.currentTarget.style.background = "var(--color-gold-dim)";
                }
              }}
              onMouseLeave={(e) => {
                if (!downloaded) {
                  e.currentTarget.style.borderColor = "var(--color-gold-mid)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {downloaded ? "Downloaded ✓" : "Download Modified Save"}
            </button>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "8px",
                letterSpacing: "0.06em",
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Replace a save slot in-game
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
