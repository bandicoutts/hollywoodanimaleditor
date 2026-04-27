"use client";

import { useCallback, useRef, useState } from "react";
import { useSaveFile } from "@/context/SaveFileContext";

function StudioMark({ size = 64 }: { size?: number }) {
  const r = size / 2;
  const hexOuter = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${r + (r - 4) * Math.cos(a)},${r + (r - 4) * Math.sin(a)}`;
  }).join(" ");
  const hexInner = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${r + (r - 18) * Math.cos(a)},${r + (r - 18) * Math.sin(a)}`;
  }).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <polygon points={hexOuter} stroke="#c9a44a" strokeWidth="1.5" />
      <polygon points={hexInner} stroke="#c9a44a" strokeWidth="1" opacity="0.5" />
      <circle cx={r} cy={r} r={r * 0.18} fill="#c9a44a" />
    </svg>
  );
}

function CornerBracket({
  position,
}: {
  position: "tl" | "tr" | "bl" | "br";
}) {
  const size = 12;
  const paths: Record<string, string> = {
    tl: "M12,0 L0,0 L0,12",
    tr: "M0,0 L12,0 L12,12",
    bl: "M0,0 L0,12 L12,12",
    br: "M0,12 L12,12 L12,0",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      style={{ position: "absolute", ...cornerPos(position) }}
    >
      <path d={paths[position]} stroke="#c9a44a" strokeWidth="1.5" />
    </svg>
  );
}

function cornerPos(p: string) {
  return {
    tl: { top: -1, left: -1 },
    tr: { top: -1, right: -1 },
    bl: { bottom: -1, left: -1 },
    br: { bottom: -1, right: -1 },
  }[p];
}

function formatDraftDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "recently";
  }
}

export default function UploadScreen() {
  const { loadFile, versionWarning, draftInfo, resumeDraft, discardDraft } = useSaveFile();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".json")) {
        setError("Please upload a .json save file.");
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          loadFile(text, file.name);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to parse save file."
          );
        }
      };
      reader.readAsText(file, "utf-8");
    },
    [loadFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg-app)",
        padding: "32px",
      }}
    >
      {/* Studio mark */}
      <StudioMark size={64} />

      <h1
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "36px",
          fontWeight: 600,
          color: "var(--color-text-primary)",
          marginTop: "20px",
          letterSpacing: "-0.01em",
        }}
      >
        Studio Archives
      </h1>

      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "11px",
          fontWeight: 400,
          color: "var(--color-gold)",
          letterSpacing: "0.45em",
          textTransform: "uppercase",
          marginTop: "8px",
          marginBottom: "40px",
        }}
      >
        Upload Save File
      </p>

      {/* Draft resume banner */}
      {draftInfo && (
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            marginBottom: "16px",
            padding: "12px 16px",
            border: "1px solid var(--color-gold-mid)",
            background: "#c9a44a0a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "11px",
                color: "var(--color-gold)",
                fontWeight: 500,
                marginBottom: "2px",
              }}
            >
              Resume unsaved session?
            </p>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                color: "var(--color-text-muted)",
              }}
            >
              {draftInfo.filename} · saved {formatDraftDate(draftInfo.timestamp)}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button
              onClick={resumeDraft}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--color-gold)",
                background: "transparent",
                border: "1px solid var(--color-gold-mid)",
                padding: "4px 10px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Resume
            </button>
            <button
              onClick={discardDraft}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
                background: "transparent",
                border: "1px solid var(--color-border)",
                padding: "4px 10px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "420px",
          padding: "48px 32px",
          border: `1px dashed ${isDragging ? "#c9a44a88" : "var(--color-border)"}`,
          background: isDragging ? "#c9a44a06" : "transparent",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          transition: "all 0.15s ease",
        }}
      >
        {/* Corner brackets */}
        <CornerBracket position="tl" />
        <CornerBracket position="tr" />
        <CornerBracket position="bl" />
        <CornerBracket position="br" />

        {/* Upload icon */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          stroke={isDragging ? "#c9a44a" : "var(--color-text-muted)"}
          strokeWidth="1.2"
          style={{ transition: "stroke 0.15s ease" }}
        >
          <path d="M16 22V10M10 16l6-6 6 6" />
          <path d="M6 26h20" />
        </svg>

        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "13px",
            color: isDragging ? "var(--color-gold)" : "var(--color-text-secondary)",
            textAlign: "center",
            transition: "color 0.15s ease",
          }}
        >
          Drop your save file here
        </p>
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "11px",
            color: "var(--color-text-muted)",
          }}
        >
          or click to browse
        </p>
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--color-text-faint)",
          }}
        >
          .json files only
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".json"
          onChange={onFileChange}
          style={{ display: "none" }}
        />
      </div>

      {/* Error */}
      {error && (
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "12px",
            color: "var(--color-danger)",
            marginTop: "16px",
            textAlign: "center",
            maxWidth: "420px",
          }}
        >
          {error}
        </p>
      )}

      {/* Version warning */}
      {versionWarning && (
        <div
          style={{
            marginTop: "16px",
            padding: "10px 16px",
            border: "1px solid var(--color-danger)",
            maxWidth: "420px",
            width: "100%",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "11px",
              color: "var(--color-danger)",
            }}
          >
            {versionWarning}
          </p>
        </div>
      )}

      {/* Help text */}
      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "11px",
          color: "var(--color-text-muted)",
          marginTop: "32px",
          textAlign: "center",
          maxWidth: "360px",
          lineHeight: 1.6,
        }}
      >
        Your save file never leaves your browser. All editing is done locally.
      </p>
    </div>
  );
}
