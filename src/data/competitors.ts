export type AttackTier = "Nuclear" | "Very Aggressive" | "None";

export interface CompetitorMeta {
  name: string;
  tier: string;
  attackTier: AttackTier;
  qualityRange: string;
  releases: string;
  defenceless: boolean;
}

export const COMPETITOR_META: Record<string, CompetitorMeta> = {
  GB: {
    name: "Gerstein Brothers",
    tier: "Dominant",
    attackTier: "Nuclear",
    qualityRange: "65–77%",
    releases: "8–11/yr",
    defenceless: false,
  },
  EM: {
    name: "Evergreen Movies",
    tier: "High-Volume",
    attackTier: "Nuclear",
    qualityRange: "50–67%",
    releases: "8–17/yr",
    defenceless: false,
  },
  SU: {
    name: "Supreme",
    tier: "Art House",
    attackTier: "Very Aggressive",
    qualityRange: "45–65%+",
    releases: "4–5/yr",
    defenceless: false,
  },
  HE: {
    name: "Hephaestus",
    tier: "Small / Teen",
    attackTier: "Very Aggressive",
    qualityRange: "25–50%",
    releases: "2–3/yr",
    defenceless: false,
  },
  MA: {
    name: "Marginese",
    tier: "Micro",
    attackTier: "None",
    qualityRange: "23–42%",
    releases: "2–3/yr",
    defenceless: true,
  },
};
