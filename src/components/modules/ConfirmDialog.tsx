"use client";

export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,16,9,0.85)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 380,
          background: "var(--color-bg-panel)",
          borderTop: "2px solid var(--color-danger)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          padding: "24px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            marginBottom: "12px",
          }}
        >
          Confirm destructive action
        </p>
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "12px",
            color: "var(--color-text-secondary)",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "11px",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              background: "transparent",
              border: "1px solid var(--color-border)",
              padding: "6px 16px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "11px",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "var(--color-danger)",
              background: "transparent",
              border: "1px solid var(--color-danger)",
              padding: "6px 16px",
              cursor: "pointer",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
