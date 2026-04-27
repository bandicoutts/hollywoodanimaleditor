export interface CompetitorMeta {
  name: string;
  tier: string;
  qualityRange: string;
  releases: string;
}

export const COMPETITOR_META: Record<string, CompetitorMeta> = {
  GB: { name: "Gerstein Brothers", tier: "Dominant",    qualityRange: "65–77%",   releases: "8–11/yr"  },
  EM: { name: "Evergreen Movies",  tier: "High-Volume", qualityRange: "50–67%",   releases: "8–17/yr"  },
  SU: { name: "Supreme",           tier: "Art House",   qualityRange: "45–65%+",  releases: "4–5/yr"   },
  HE: { name: "Hephaestus",        tier: "Small / Teen",qualityRange: "25–50%",   releases: "2–3/yr"   },
  MA: { name: "Marginese",         tier: "Micro",       qualityRange: "23–42%",   releases: "2–3/yr"   },
};
