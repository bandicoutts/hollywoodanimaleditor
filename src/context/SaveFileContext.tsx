"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  downloadSaveFile,
  parseSaveFile,
  type SaveFile,
  type StateJson,
} from "@/lib/save-file";

const DRAFT_KEY = "hae_draft";
const MAX_LOG_ENTRIES = 50;

interface DraftData {
  saveData: SaveFile;
  filename: string;
  timestamp: string;
}

export interface ChangeEntry {
  description: string;
  timestamp: number;
}

interface SaveFileContextValue {
  saveData: SaveFile | null;
  filename: string;
  versionWarning: string | null;
  isLoaded: boolean;
  unsavedCount: number;
  changeLog: ChangeEntry[];
  draftInfo: { filename: string; timestamp: string } | null;
  loadFile: (text: string, filename: string) => void;
  updateStateJson: (updater: (state: StateJson) => void, description?: string) => void;
  download: () => void;
  resumeDraft: () => void;
  discardDraft: () => void;
}

const SaveFileContext = createContext<SaveFileContextValue | null>(null);

export function SaveFileProvider({ children }: { children: ReactNode }) {
  const [saveData, setSaveData] = useState<SaveFile | null>(null);
  const [filename, setFilename] = useState<string>("save.json");
  const [versionWarning, setVersionWarning] = useState<string | null>(null);
  const [unsavedCount, setUnsavedCount] = useState(0);
  const [changeLog, setChangeLog] = useState<ChangeEntry[]>([]);
  // Set once on mount from localStorage — only used to drive the resume banner
  const [draftInfo, setDraftInfo] = useState<{ filename: string; timestamp: string } | null>(null);

  // Check for a saved draft on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as DraftData;
      if (parsed.saveData?.stateJson && parsed.filename && parsed.timestamp) {
        setDraftInfo({ filename: parsed.filename, timestamp: parsed.timestamp });
      }
    } catch {
      // corrupt draft — ignore
    }
  }, []);

  // Auto-save draft to localStorage on every state change (debounced 500ms).
  // Silently skips if the file exceeds the localStorage quota.
  useEffect(() => {
    if (!saveData) return;
    const timer = setTimeout(() => {
      try {
        const draft: DraftData = {
          saveData,
          filename,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // Quota exceeded for large saves — beforeunload warning still works
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [saveData, filename]);

  // Warn on tab close when there are unsaved changes
  const hasUnsaved = unsavedCount > 0;
  useEffect(() => {
    if (!hasUnsaved) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  const loadFile = useCallback((text: string, name: string) => {
    const { data, versionWarning: warning } = parseSaveFile(text);
    setSaveData(data);
    setFilename(name);
    setVersionWarning(warning);
    setUnsavedCount(0);
    setChangeLog([]);
    setDraftInfo(null);
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  const updateStateJson = useCallback(
    (updater: (state: StateJson) => void, description?: string) => {
      setSaveData((prev) => {
        if (!prev) return prev;
        const next = structuredClone(prev);
        updater(next.stateJson);
        return next;
      });
      setUnsavedCount((c) => c + 1);
      if (description) {
        setChangeLog((prev) => [
          ...prev.slice(-(MAX_LOG_ENTRIES - 1)),
          { description, timestamp: Date.now() },
        ]);
      }
    },
    []
  );

  const download = useCallback(() => {
    if (!saveData) return;
    downloadSaveFile(saveData, filename);
    setUnsavedCount(0);
    setChangeLog([]);
    localStorage.removeItem(DRAFT_KEY);
  }, [saveData, filename]);

  const resumeDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as DraftData;
      if (parsed.saveData?.stateJson && parsed.filename) {
        setSaveData(parsed.saveData);
        setFilename(parsed.filename);
        setUnsavedCount(1);
        setChangeLog([{ description: "Session resumed from autosave", timestamp: Date.now() }]);
        setDraftInfo(null);
      }
    } catch {
      // corrupt draft
    }
  }, []);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setDraftInfo(null);
  }, []);

  return (
    <SaveFileContext.Provider
      value={{
        saveData,
        filename,
        versionWarning,
        isLoaded: saveData !== null,
        unsavedCount,
        changeLog,
        draftInfo,
        loadFile,
        updateStateJson,
        download,
        resumeDraft,
        discardDraft,
      }}
    >
      {children}
    </SaveFileContext.Provider>
  );
}

export function useSaveFile(): SaveFileContextValue {
  const ctx = useContext(SaveFileContext);
  if (!ctx) throw new Error("useSaveFile must be used within SaveFileProvider");
  return ctx;
}
