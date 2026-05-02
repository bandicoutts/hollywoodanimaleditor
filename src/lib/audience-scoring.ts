import type { ScriptElement } from "@/data/scriptElements";
import { TAG_AUDIENCE_WEIGHTS, AD_AGENCIES, type SegmentId, type AdAgency } from "@/data/audienceData";

export type { SegmentId };

export const SEGMENT_IDS: SegmentId[] = ["TF", "TM", "YF", "YM", "AF", "AM"];

export interface AudienceScores {
  TF: number; TM: number;
  YF: number; YM: number;
  AF: number; AM: number;
}

export interface RankedAgency {
  agency: AdAgency;
  fit: number;
  available: boolean;
}

export function scoreAudience(elements: ScriptElement[]): AudienceScores {
  const scores: AudienceScores = { TF: 0, TM: 0, YF: 0, YM: 0, AF: 0, AM: 0 };
  for (const el of elements) {
    const w = TAG_AUDIENCE_WEIGHTS[el.id];
    if (!w) continue;
    for (const seg of SEGMENT_IDS) {
      scores[seg] += w[seg] ?? 0;
    }
  }
  return scores;
}

export function rankAgencies(
  scores: AudienceScores,
  unlockedIds: Set<string>,
): RankedAgency[] {
  return AD_AGENCIES.map((agency) => {
    const fit = agency.targetSegments.reduce((sum, seg) => sum + scores[seg], 0);
    const available = agency.alwaysAvailable || unlockedIds.has(agency.id);
    return { agency, fit, available };
  }).sort((a, b) => b.fit - a.fit);
}
