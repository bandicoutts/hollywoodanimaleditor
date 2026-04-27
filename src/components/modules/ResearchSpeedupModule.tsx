"use client";

import { useCallback } from "react";
import ModuleShell from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";
import { GHOST_BTN, goldHover } from "@/lib/styles";
import {
  formatDecimalString,
  hasActiveResearch,
  hasActiveConstruction,
} from "@/lib/save-file";

function ActionCard({
  title,
  description,
  available,
  buttonLabel,
  onAction,
  color,
}: {
  title: string;
  description: string;
  available: boolean;
  buttonLabel: string;
  onAction: () => void;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "20px",
        border: `1px solid ${available ? color + "55" : "var(--color-border-subtle)"}`,
        background: available ? color + "08" : "transparent",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "all 0.15s ease",
      }}
    >
      <div>
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "15px",
            fontWeight: 600,
            color: available ? "var(--color-text-primary)" : "var(--color-text-muted)",
            marginBottom: "4px",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "11px",
            color: "var(--color-text-secondary)",
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>
      <button
        onClick={onAction}
        disabled={!available}
        style={{
          alignSelf: "flex-start",
          fontFamily: "var(--font-ui)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: available ? color : "var(--color-text-muted)",
          background: "transparent",
          border: `1px solid ${available ? color + "66" : "var(--color-border)"}`,
          padding: "6px 16px",
          cursor: available ? "pointer" : "not-allowed",
          transition: "all 0.15s ease",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          if (available) {
            e.currentTarget.style.background = color + "18";
            e.currentTarget.style.borderColor = color;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = available ? color + "66" : "var(--color-border)";
        }}
      >
        {buttonLabel}
      </button>
      {!available && (
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            color: "var(--color-text-muted)",
            letterSpacing: "0.04em",
          }}
        >
          No active {title.toLowerCase()} detected
        </p>
      )}
    </div>
  );
}

export default function ResearchSpeedupModule() {
  const { isLoaded, saveData, updateStateJson } = useSaveFile();

  const stateJson = saveData?.stateJson;
  const speedup = stateJson ? parseFloat(stateJson.overallPerkResearchSpeedup) || 0 : 0;
  const activeResearch = stateJson ? hasActiveResearch(stateJson) : false;
  const activeConstruction = stateJson ? hasActiveConstruction(stateJson) : false;

  const setSpeedup = useCallback(
    (value: number) => {
      updateStateJson((s) => {
        s.overallPerkResearchSpeedup = formatDecimalString(value);
      });
    },
    [updateStateJson]
  );

  const completeResearch = useCallback(() => {
    updateStateJson((s) => {
      // Zero out remaining-time fields in all active research process objects
      const processFields = [
        "tagResearchProcessesData",
        "techProcessesData",
        "trashTagResearchProcessesData",
        "trashRecipeResearchProcessesData",
        "partyProcessesData",
      ] as const;

      for (const field of processFields) {
        const procs = s[field] as Record<string, Record<string, unknown>>;
        for (const key of Object.keys(procs)) {
          const proc = procs[key];
          if (proc && typeof proc === "object") {
            // Zero any duration/remaining time fields
            for (const k of Object.keys(proc)) {
              if (
                k.toLowerCase().includes("duration") ||
                k.toLowerCase().includes("remaining") ||
                k.toLowerCase().includes("time") ||
                k.toLowerCase().includes("progress") && typeof proc[k] === "number"
              ) {
                if (typeof proc[k] === "number") proc[k] = 0;
              }
            }
          }
        }
      }
    });
  }, [updateStateJson]);

  const completeConstruction = useCallback(() => {
    updateStateJson((s) => {
      for (const b of s.buildings) {
        if (b.state === 1) {
          b.state = 2;
          b.constructionDuration = 0;
          b.constructionQuality = "1.000";
        }
      }
    });
  }, [updateStateJson]);

  return (
    <ModuleShell
      title="Research Speed & Construction"
      subtitle="Speed up research, complete active processes, and finish construction"
      maxWidth={720}
    >
      {!isLoaded ? (
        <p style={{ fontFamily: "var(--font-ui)", fontSize: "12px", color: "var(--color-text-muted)" }}>
          Upload a save file to manage research and construction.
        </p>
      ) : (
        <>
          {/* Research speedup slider */}
          <div
            style={{
              padding: "20px",
              border: "1px solid var(--color-border-subtle)",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "16px",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    marginBottom: "4px",
                  }}
                >
                  Research Speedup
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "11px",
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  Globally multiplies research speed. Stored as a float string.
                </p>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "var(--color-gold)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {speedup.toFixed(3)}
              </span>
            </div>

            {/* Track */}
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <div
                style={{
                  height: "6px",
                  background: "var(--color-bg-raised)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${Math.min(speedup / 5, 1) * 100}%`,
                    background: "var(--color-gold)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={5}
                step={0.001}
                value={Math.min(speedup, 5)}
                onChange={(e) => setSpeedup(parseFloat(e.target.value))}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                  margin: 0,
                }}
              />
            </div>

            {/* Presets */}
            <div style={{ display: "flex", gap: "6px" }}>
              {[0, 1, 2, 3, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setSpeedup(v)}
                  style={GHOST_BTN}
                  onMouseEnter={(e) => goldHover(e, true)}
                  onMouseLeave={(e) => goldHover(e, false)}
                >
                  ×{v}
                </button>
              ))}
            </div>
          </div>

          {/* Action cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <ActionCard
              title="Complete Research"
              description="Instantly finishes all active tag, technology, recipe, and party research processes."
              available={activeResearch}
              buttonLabel="Complete Now"
              onAction={completeResearch}
              color="var(--color-success)"
            />
            <ActionCard
              title="Complete Construction"
              description="Sets all buildings currently under construction to built with 100% quality."
              available={activeConstruction}
              buttonLabel="Complete Now"
              onAction={completeConstruction}
              color="var(--color-gold)"
            />
          </div>
        </>
      )}
    </ModuleShell>
  );
}
