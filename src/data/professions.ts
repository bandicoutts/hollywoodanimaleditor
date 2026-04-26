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
  { key: "CptLawyer", label: "Lawyer (Cpt)", color: "#9a9280" },
  { key: "CptHR", label: "HR (Cpt)", color: "#9a9280" },
  { key: "CptPR", label: "PR (Cpt)", color: "#9a9280" },
  { key: "CptFinancier", label: "Financier (Cpt)", color: "#9a9280" },
  { key: "LieutProd", label: "Lt. Production", color: "#9a9280" },
  { key: "LieutPrep", label: "Lt. Prep", color: "#9a9280" },
  { key: "LieutTech", label: "Lt. Tech", color: "#9a9280" },
  { key: "LieutScript", label: "Lt. Script", color: "#9a9280" },
  { key: "LieutRelease", label: "Lt. Release", color: "#9a9280" },
  { key: "LieutPost", label: "Lt. Post", color: "#9a9280" },
  { key: "LieutSecurity", label: "Lt. Security", color: "#9a9280" },
  { key: "LieutEscort", label: "Lt. Escort", color: "#9a9280" },
  { key: "LieutMuseum", label: "Lt. Museum", color: "#9a9280" },
  { key: "LieutInfrastructure", label: "Lt. Infrastructure", color: "#9a9280" },
  { key: "LieutProducers", label: "Lt. Producers", color: "#9a9280" },
];

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
