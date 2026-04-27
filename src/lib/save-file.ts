const KNOWN_VERSION = "0.8.69EA";
const UTF8_BOM = "﻿";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SaveFileMeta {
  firstSaveVersion: string;
  lastSaveVersion: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface Character {
  id: number;
  studioId: unknown | null;
  professions: Record<string, string>;
  limit: string;
  Limit: string;
  mood: string;
  attitude: string;
  selfEsteem: string;
  xp: number;
  firstNameId: string;
  lastNameId: string;
  labels: string[];
  BonusCardMoney?: number;
  BonusCardInfluencePoints?: number;
  bonusCards?: number[];
  birthDate?: string;
  [key: string]: unknown;
}

export interface Technology {
  id: number;
  configId: string;
  type: number;
  format: string;
  owned: boolean;
  created: boolean;
  releaseYear: number;
  isOutDated: boolean;
  [key: string]: unknown;
}

export interface TagPoolEntry {
  Item1: string;
  Item2: string;
  [key: string]: unknown;
}

export interface Building {
  configId: string;
  id: number;
  state: number;
  constructionDuration: number;
  constructionQuality: string;
  developerId: unknown | null;
  [key: string]: unknown;
}

export interface Milestone {
  id: string;
  group: string;
  finished: boolean;
  locked: boolean;
  progress: string;
  chains: unknown[];
  [key: string]: unknown;
}

export interface CompetitorStudio {
  isUnderRaid: boolean;
  lastBudget: number;
  aggression: string;
  isDead: boolean;
  [key: string]: unknown;
}

export interface StateJson {
  budget: number;
  cash: number;
  reputation: string;
  influence: number;
  studioName: string;
  characters: Character[];
  technologies: Technology[];
  openedPerks: string[];
  tagPool: TagPoolEntry[];
  buildings: Building[];
  milestones: Record<string, Milestone>;
  functionalities: Record<string, boolean>;
  competitorStudios: Record<string, CompetitorStudio>;
  tagResearchProcessesData: Record<string, unknown>;
  techProcessesData: Record<string, unknown>;
  trashTagResearchProcessesData: Record<string, unknown>;
  trashRecipeResearchProcessesData: Record<string, unknown>;
  partyProcessesData: Record<string, unknown>;
  overallPerkResearchSpeedup: string;
  nextCharacterId: number;
  nextBuildingId: number;
  nextTechId: number;
  tagRecipesPool: string[];
  movieScriptIdeas?: unknown[];
  [key: string]: unknown;
}

export interface SaveFile {
  currentMeta: SaveFileMeta;
  stateJson: StateJson;
  isDemoEndSave: boolean;
  isDemoTransition: boolean;
  isEmptyData: boolean;
  path: string;
  [key: string]: unknown;
}

// ── Parsing ───────────────────────────────────────────────────────────────────

export interface ParseResult {
  data: SaveFile;
  versionWarning: string | null;
}

const NOT_A_SAVE_FILE =
  "This doesn't look like a Hollywood Animal save file. Make sure you're uploading the correct .json file from your game's save folder.";

export function parseSaveFile(text: string): ParseResult {
  const stripped = text.startsWith(UTF8_BOM) ? text.slice(1) : text;

  let data: SaveFile;
  try {
    data = JSON.parse(stripped) as SaveFile;
  } catch {
    throw new Error(NOT_A_SAVE_FILE);
  }

  if (!data.stateJson || typeof data.stateJson !== "object") {
    throw new Error(NOT_A_SAVE_FILE);
  }

  let versionWarning: string | null = null;
  const version = data.currentMeta?.lastSaveVersion;
  if (version && version > KNOWN_VERSION) {
    versionWarning = `This save is from a newer game version (${version}) than this editor was built for (${KNOWN_VERSION}). Most features will still work, but some newer fields may not appear correctly. Proceed with caution and keep a backup of your original save.`;
  }

  return { data, versionWarning };
}

// ── Serialisation ─────────────────────────────────────────────────────────────

export function serialiseSaveFile(data: SaveFile): string {
  return UTF8_BOM + JSON.stringify(data);
}

export function downloadSaveFile(data: SaveFile, filename: string): void {
  const text = serialiseSaveFile(data);
  const blob = new Blob([text], { type: "application/json; charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatDecimalString(value: number): string {
  return value.toFixed(3);
}

export function hasActiveResearch(stateJson: StateJson): boolean {
  return (
    Object.keys(stateJson.tagResearchProcessesData ?? {}).length > 0 ||
    Object.keys(stateJson.techProcessesData ?? {}).length > 0 ||
    Object.keys(stateJson.trashTagResearchProcessesData ?? {}).length > 0 ||
    Object.keys(stateJson.trashRecipeResearchProcessesData ?? {}).length > 0 ||
    Object.keys(stateJson.partyProcessesData ?? {}).length > 0
  );
}

export function hasActiveConstruction(stateJson: StateJson): boolean {
  return (stateJson.buildings ?? []).some((b) => b.state === 1);
}
