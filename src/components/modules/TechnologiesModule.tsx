"use client";

import { useCallback, useMemo } from "react";
import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";
import type { Technology } from "@/lib/save-file";

// ── Static tech catalogue ─────────────────────────────────────────────────────

interface TechInfo {
  name: string;
  manufacturer: string;
  format: string;
  isColor: boolean;
  q: number;
  p: number;
  e: number;
  isQuest: boolean;
}

const TECH_INFO: Record<string, TechInfo> = {
  // Dupler
  DUPLER: { name: "Dupler", manufacturer: "Dupler", format: "35-mm", isColor: false, q: 1, p: 1, e: 2, isQuest: false },
  DUPLER_COMPACT_STANDART: { name: "Dupler Compact", manufacturer: "Dupler", format: "16-mm", isColor: false, q: 2, p: 4, e: 4, isQuest: false },
  DUPLER_COMPACT_QUEST: { name: "Dupler Compact S", manufacturer: "Dupler", format: "16-mm", isColor: false, q: 3, p: 5, e: 3, isQuest: true },
  DUPLER_COMPACT_CF_STANDART: { name: "Dupler Compact CF", manufacturer: "Dupler", format: "16-mm", isColor: true, q: 3, p: 5, e: 4, isQuest: false },
  DUPLER_COMPACT_CFS_QUEST: { name: "Dupler Compact CF-S", manufacturer: "Dupler", format: "16-mm", isColor: true, q: 4, p: 5, e: 5, isQuest: true },
  // Hespro
  HESPRO_STANDART: { name: "HesPro 35", manufacturer: "Hespro", format: "35-mm", isColor: false, q: 2, p: 1, e: 1, isQuest: false },
  HESPRO_QUEST: { name: "HesPro 35 Extra", manufacturer: "Hespro", format: "35-mm", isColor: false, q: 4, p: 2, e: 2, isQuest: true },
  HESPRO_70_STANDART: { name: "HesPro 70", manufacturer: "Hespro", format: "70-mm", isColor: false, q: 5, p: 3, e: 2, isQuest: false },
  HESPRO_70_EXTRA_QUEST: { name: "HesPro 70 Extra", manufacturer: "Hespro", format: "70-mm", isColor: false, q: 6, p: 4, e: 3, isQuest: true },
  HESPRO_70_RAD_STANDART: { name: "HesPro 70 Radians", manufacturer: "Hespro", format: "70-mm", isColor: true, q: 7, p: 4, e: 4, isQuest: false },
  HESPRO_70_RAD_EXTRA_QUEST: { name: "HesPro 70 Radians Extra", manufacturer: "Hespro", format: "70-mm", isColor: true, q: 8, p: 5, e: 4, isQuest: true },
  // Blue Term
  BLUE_TERM_IRIS_STANDART: { name: "Blue Term Iris", manufacturer: "Blue Term", format: "35-mm", isColor: false, q: 4, p: 3, e: 1, isQuest: false },
  BLUE_TERM_IRIS_QUEST: { name: "Blue Term Iris Deluxe", manufacturer: "Blue Term", format: "35-mm", isColor: false, q: 5, p: 3, e: 2, isQuest: true },
  BLUE_TERM_VIVID: { name: "Blue Term Vivid", manufacturer: "Blue Term", format: "35-mm", isColor: true, q: 4, p: 2, e: 2, isQuest: false },
  BLUE_TERM_LUCID_STANDART: { name: "Blue Term Lucid", manufacturer: "Blue Term", format: "35-mm", isColor: true, q: 5, p: 4, e: 3, isQuest: false },
  BLUE_TERM_LUCID_DELUXE_QUEST: { name: "Blue Term Lucid Deluxe", manufacturer: "Blue Term", format: "35-mm", isColor: true, q: 6, p: 4, e: 5, isQuest: true },
  // Flumen
  FLUMEN_STANDART: { name: "Flumen", manufacturer: "Flumen", format: "16-mm", isColor: false, q: 4, p: 5, e: 1, isQuest: false },
  FLUMEN_CELERE_STANDART: { name: "Flumen Celere", manufacturer: "Flumen", format: "8-mm", isColor: false, q: 4, p: 7, e: 5, isQuest: false },
  FLUMEN_CELERE_PRO_QUEST: { name: "Flumen Celere Pro", manufacturer: "Flumen", format: "8-mm", isColor: false, q: 5, p: 7, e: 6, isQuest: true },
  // Sonatone
  SONATONE: { name: "Sonatone", manufacturer: "Sonatone", format: "Mono On-Disk", isColor: false, q: 1, p: 2, e: 1, isQuest: false },
  DOMINUS: { name: "Sonatone Dominus", manufacturer: "Sonatone", format: "Mono On-Disk", isColor: false, q: 2, p: 2, e: 1, isQuest: false },
  // Frametone
  FRAMETONE_STANDART: { name: "Frametone", manufacturer: "Frametone", format: "Mono On-Film", isColor: false, q: 3, p: 2, e: 1, isQuest: false },
  FRAMETONE_QUEST: { name: "Frametone Pure", manufacturer: "Frametone", format: "Mono On-Film", isColor: false, q: 5, p: 3, e: 3, isQuest: true },
  FRAMETONE_CLEAR_STANDART: { name: "Frametone Clear", manufacturer: "Frametone", format: "Mono On-Film", isColor: false, q: 7, p: 5, e: 6, isQuest: false },
  FRAMETONE_CRYSTAL_CLEAR_QUEST: { name: "Frametone Crystal Clear", manufacturer: "Frametone", format: "Mono On-Film", isColor: false, q: 7, p: 6, e: 7, isQuest: true },
  FRAMETONE_ALTUM_STANDART: { name: "Frametone Altum", manufacturer: "Frametone", format: "Mono On-Film", isColor: false, q: 9, p: 8, e: 7, isQuest: false },
  FRAMETONE_PRAEALTUM_QUEST: { name: "Frametone Praealtum", manufacturer: "Frametone", format: "Mono On-Film", isColor: false, q: 9, p: 8, e: 8, isQuest: true },
  // FilmSound
  FILMSOUND_STANDART: { name: "FilmSound", manufacturer: "FilmSound", format: "Mono On-Film", isColor: false, q: 4, p: 5, e: 2, isQuest: false },
  FILMSOUND_ORGANUM_STANDART: { name: "FilmSound Organum", manufacturer: "FilmSound", format: "Stereo", isColor: false, q: 7, p: 3, e: 4, isQuest: false },
  FILMSOUND_NOVUM_ORGANUM_QUEST: { name: "FilmSound Novum Organum", manufacturer: "FilmSound", format: "Stereo", isColor: false, q: 7, p: 4, e: 5, isQuest: true },
};

const CAMERA_MANUFACTURER_ORDER = ["Dupler", "Hespro", "Blue Term", "Flumen"];
const SOUND_MANUFACTURER_ORDER = ["Sonatone", "Frametone", "FilmSound"];

// ── QPE dots ──────────────────────────────────────────────────────────────────

function StatDots({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "9px",
          color: "var(--color-text-muted)",
          letterSpacing: "0.04em",
          minWidth: "60px",
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", gap: "2px" }}>
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: 4,
              background: i < value ? color : "var(--color-border)",
              opacity: i < value ? 1 : 0.4,
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "9px",
          color: "var(--color-text-muted)",
          marginLeft: "3px",
          minWidth: "12px",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Tech card ─────────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<number, string> = {
  0: "#7ab0e0",
  1: "#e09090",
};

function TechCard({
  tech,
  onToggle,
}: {
  tech: Technology;
  onToggle: () => void;
}) {
  const isReadOnly = !tech.configId;
  const typeColor = TYPE_COLOR[tech.type] ?? "#9a9280";
  const checked = tech.owned;
  const info = tech.configId ? TECH_INFO[tech.configId] : undefined;
  const displayName = info?.name ?? tech.configId ?? `Custom Tech #${tech.id}`;
  const displayFormat = info?.format ?? tech.format ?? "—";

  return (
    <div
      onClick={isReadOnly ? undefined : onToggle}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "9px 14px",
        border: `1px solid ${checked ? typeColor + "55" : "var(--color-border-subtle)"}`,
        background: checked ? typeColor + "0e" : "transparent",
        cursor: isReadOnly ? "default" : "pointer",
        transition: "all 0.15s ease",
        opacity: isReadOnly ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isReadOnly && !checked)
          e.currentTarget.style.background = "#1d1a1560";
      }}
      onMouseLeave={(e) => {
        if (!isReadOnly && !checked)
          e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Checkbox */}
      <div
        style={{
          width: 15,
          height: 15,
          flexShrink: 0,
          marginTop: "1px",
          border: `1px solid ${checked ? typeColor : "var(--color-border)"}`,
          background: checked ? typeColor : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
        }}
      >
        {checked && (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <polyline
              points="1.5,4.5 3.5,6.5 7.5,2.5"
              stroke="#111009"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name row */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "12px",
              color: checked ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {displayName}
          </p>
          {info?.isQuest && (
            <span
              title="Unlocked through a quest, not purchased directly"
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "9px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#c8a84b",
                border: "1px solid #c8a84b55",
                padding: "0px 4px",
                flexShrink: 0,
              }}
            >
              Quest
            </span>
          )}
          {info?.isColor && (
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "9px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#b07ad4",
                border: "1px solid #b07ad455",
                padding: "0px 4px",
                flexShrink: 0,
              }}
            >
              Color
            </span>
          )}
          {tech.isOutDated && (
            <span
              title="An upgraded version of this technology is available"
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "9px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
                padding: "0px 4px",
                flexShrink: 0,
              }}
            >
              Outdated
            </span>
          )}
        </div>

        {/* Format + year */}
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            color: "var(--color-text-muted)",
            marginTop: "1px",
            marginBottom: info ? "5px" : "0",
          }}
        >
          {displayFormat}
          {tech.releaseYear != null && tech.releaseYear !== 0 && ` · ${tech.releaseYear}`}
          {isReadOnly && " · read-only"}
        </p>

        {/* QPE stats */}
        {info && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <StatDots label="Quality" value={info.q} color={typeColor} />
            <StatDots label="Practicality" value={info.p} color={typeColor} />
            <StatDots label="Economy" value={info.e} color={typeColor} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Manufacturer group ────────────────────────────────────────────────────────

function ManufacturerGroup({
  manufacturer,
  techs,
  onToggle,
}: {
  manufacturer: string;
  techs: Technology[];
  onToggle: (id: number) => void;
}) {
  if (techs.length === 0) return null;
  return (
    <div>
      <div
        style={{
          padding: "4px 14px",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
          }}
        >
          {manufacturer}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "8px" }}>
        {techs.map((t) => (
          <TechCard key={t.id} tech={t} onToggle={() => onToggle(t.id)} />
        ))}
      </div>
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────

function TechColumn({
  label,
  color,
  techs,
  manufacturerOrder,
  onToggle,
  onToggleAll,
}: {
  label: string;
  color: string;
  techs: Technology[];
  manufacturerOrder: string[];
  onToggle: (id: number) => void;
  onToggleAll: (ids: number[]) => void;
}) {
  const editableTechs = techs.filter((t) => t.configId);
  const ownedCount = editableTechs.filter((t) => t.owned).length;

  const byManufacturer = useMemo(() => {
    const map = new Map<string, Technology[]>();
    for (const m of manufacturerOrder) map.set(m, []);
    for (const t of techs) {
      const info = t.configId ? TECH_INFO[t.configId] : undefined;
      const mfr = info?.manufacturer ?? "Other";
      if (!map.has(mfr)) map.set(mfr, []);
      map.get(mfr)!.push(t);
    }
    return map;
  }, [techs, manufacturerOrder]);

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Column header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid var(--color-border-subtle)",
          borderTop: `2px solid ${color}`,
          background: "var(--color-bg-panel)",
          marginBottom: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color,
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              color: "var(--color-text-muted)",
            }}
          >
            {ownedCount}/{editableTechs.length}
          </span>
        </div>
        <button
          onClick={() => onToggleAll(editableTechs.map((t) => t.id))}
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: ownedCount === editableTechs.length ? "var(--color-text-muted)" : color,
            background: "transparent",
            border: `1px solid ${ownedCount === editableTechs.length ? "var(--color-border)" : color + "55"}`,
            padding: "2px 8px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {ownedCount === editableTechs.length ? "All owned" : "Own all"}
        </button>
      </div>

      <div>
        {manufacturerOrder.map((mfr) => {
          const mfrTechs = byManufacturer.get(mfr) ?? [];
          return (
            <ManufacturerGroup
              key={mfr}
              manufacturer={mfr}
              techs={mfrTechs}
              onToggle={onToggle}
            />
          );
        })}
        <ManufacturerGroup
          manufacturer="Custom"
          techs={byManufacturer.get("Other") ?? []}
          onToggle={onToggle}
        />
      </div>
    </div>
  );
}

// ── Main module ───────────────────────────────────────────────────────────────

export default function TechnologiesModule() {
  const { isLoaded, saveData, updateStateJson } = useSaveFile();

  const technologies: Technology[] = saveData?.stateJson?.technologies ?? [];

  const { cameras, sound } = useMemo(
    () => ({
      cameras: technologies.filter((t) => t.type === 0),
      sound: technologies.filter((t) => t.type === 1),
    }),
    [technologies]
  );

  const toggleTech = useCallback(
    (id: number) => {
      updateStateJson((s) => {
        const t = s.technologies.find((t) => t.id === id);
        if (t && t.configId) t.owned = !t.owned;
      });
    },
    [updateStateJson]
  );

  const ownAll = useCallback(
    (ids: number[]) => {
      updateStateJson((s) => {
        for (const id of ids) {
          const t = s.technologies.find((t) => t.id === id);
          if (t && t.configId) t.owned = true;
        }
      });
    },
    [updateStateJson]
  );

  return (
    <ModuleShell
      title="Technologies"
      subtitle="Toggle camera and sound technology ownership"
      maxWidth={860}
    >
      {!isLoaded ? (
        <EmptyState message="Upload a save file to edit technologies" />
      ) : technologies.length === 0 ? (
        <EmptyState message="No technologies found in this save" />
      ) : (
        <div style={{ display: "flex", gap: "16px" }}>
          <TechColumn
            label="Camera"
            color={TYPE_COLOR[0]}
            techs={cameras}
            manufacturerOrder={CAMERA_MANUFACTURER_ORDER}
            onToggle={toggleTech}
            onToggleAll={ownAll}
          />
          <TechColumn
            label="Sound"
            color={TYPE_COLOR[1]}
            techs={sound}
            manufacturerOrder={SOUND_MANUFACTURER_ORDER}
            onToggle={toggleTech}
            onToggleAll={ownAll}
          />
        </div>
      )}
    </ModuleShell>
  );
}
