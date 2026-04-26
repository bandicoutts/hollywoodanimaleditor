export interface ProfessionDef {
  key: string;
  label: string;
  color: string;
}

export const PROFESSIONS: ProfessionDef[] = [
  { key: "Actor", label: "Actor", color: "#c9a44a" },
  { key: "Director", label: "Director", color: "#4ec9a0" },
  { key: "Scriptwriter", label: "Scriptwriter", color: "#a9a4e8" },
  { key: "Cinematographer", label: "Cinematographer", color: "#7ab0e0" },
  { key: "Composer", label: "Composer", color: "#e09090" },
  { key: "FilmEditor", label: "Film Editor", color: "#8fbc55" },
  { key: "Producer", label: "Producer", color: "#c9a44a" },
  { key: "Agent", label: "Agent", color: "#9a9280" },
  { key: "CptHR", label: "Human Resources Executive", color: "#9a9280" },
  { key: "CptPR", label: "Public Relations Executive", color: "#9a9280" },
  { key: "CptLawyer", label: "Legal Executive", color: "#9a9280" },
  { key: "CptFinancier", label: "Financial Executive", color: "#9a9280" },
  { key: "LieutProd", label: "Head of Production", color: "#9a9280" },
  { key: "LieutPrep", label: "Head of Pre-Production", color: "#9a9280" },
  { key: "LieutTech", label: "Head of Technology", color: "#9a9280" },
  { key: "LieutScript", label: "Head of Screenwriting", color: "#9a9280" },
  { key: "LieutRelease", label: "Head of Release", color: "#9a9280" },
  { key: "LieutPost", label: "Head of Post-Production", color: "#9a9280" },
  { key: "LieutSecurity", label: "Head of Security", color: "#9a9280" },
  { key: "LieutEscort", label: "Head of Escort", color: "#9a9280" },
  { key: "LieutMuseum", label: "Head of Museum", color: "#9a9280" },
  { key: "LieutInfrastructure", label: "Head of Infrastructure", color: "#9a9280" },
  { key: "LieutProducers", label: "Head of Producers", color: "#9a9280" },
];

export const MANAGEMENT_KEYS = new Set([
  "CptHR", "CptPR", "CptLawyer", "CptFinancier",
  "LieutProd", "LieutPrep", "LieutTech", "LieutScript",
  "LieutRelease", "LieutPost", "LieutSecurity", "LieutEscort",
  "LieutMuseum", "LieutInfrastructure", "LieutProducers",
]);

const PROF_MAP = new Map<string, ProfessionDef>(
  PROFESSIONS.map((p) => [p.key, p])
);

export function getProfessionColor(key: string): string {
  return PROF_MAP.get(key)?.color ?? "#9a9280";
}

export function getProfessionLabel(key: string): string {
  return PROF_MAP.get(key)?.label ?? key;
}

export function getPrimaryProfession(
  professions: Record<string, string>
): string | null {
  const keys = Object.keys(professions);
  if (keys.length === 0) return null;
  // Return the profession with the highest skill value
  return keys.reduce((best, key) =>
    parseFloat(professions[key]) > parseFloat(professions[best] ?? "0")
      ? key
      : best
  );
}
