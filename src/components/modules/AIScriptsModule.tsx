"use client";

import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";

// Placeholder — AI script generation via Claude API to be assessed separately.
// The UI shell is scaffolded here to reserve the module slot.

export default function AIScriptsModule() {
  const { isLoaded, saveData } = useSaveFile();
  const tagPool = saveData?.stateJson?.tagPool ?? [];

  const genres = [
    "Drama", "Comedy", "Action", "Romance", "Detective",
    "Adventure", "Thriller", "Historical", "Horror", "Science Fiction",
  ];

  return (
    <ModuleShell
      title="AI Script Optimizer"
      subtitle="Generate script ideas based on your active tag pool"
      maxWidth={820}
    >
      {/* Genre selector */}
      <div style={{ marginBottom: "20px" }}>
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
            marginBottom: "10px",
          }}
        >
          Target Genre
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {genres.map((genre) => (
            <button
              key={genre}
              disabled
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "11px",
                letterSpacing: "0.06em",
                padding: "5px 12px",
                border: "1px solid var(--color-border)",
                background: "transparent",
                color: "var(--color-text-muted)",
                cursor: "not-allowed",
              }}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Active tags summary */}
      {isLoaded && tagPool.length > 0 && (
        <div
          style={{
            background: "var(--color-bg-panel)",
            padding: "10px 14px",
            marginBottom: "20px",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: "6px",
            }}
          >
            Active Tags ({tagPool.length})
          </p>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "11px",
              color: "var(--color-text-secondary)",
            }}
          >
            {tagPool
              .slice(0, 10)
              .map((t) => t.Item1)
              .join(", ")}
            {tagPool.length > 10 && ` +${tagPool.length - 10} more`}
          </p>
        </div>
      )}

      {/* Generate button (disabled placeholder) */}
      <button
        disabled
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
          background: "transparent",
          border: "1px solid var(--color-border)",
          padding: "10px 24px",
          cursor: "not-allowed",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        Generate Script Ideas
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "9px",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
            padding: "1px 6px",
            letterSpacing: "0.06em",
          }}
        >
          API key required
        </span>
      </button>

      {!isLoaded && (
        <div style={{ marginTop: "32px" }}>
          <EmptyState message="Upload a save file to use the AI script optimizer" />
        </div>
      )}
    </ModuleShell>
  );
}
