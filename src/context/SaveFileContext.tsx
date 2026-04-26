"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  downloadSaveFile,
  parseSaveFile,
  type SaveFile,
  type StateJson,
} from "@/lib/save-file";

interface SaveFileContextValue {
  saveData: SaveFile | null;
  filename: string;
  versionWarning: string | null;
  isLoaded: boolean;
  loadFile: (text: string, filename: string) => void;
  updateStateJson: (updater: (state: StateJson) => void) => void;
  download: () => void;
}

const SaveFileContext = createContext<SaveFileContextValue | null>(null);

export function SaveFileProvider({ children }: { children: ReactNode }) {
  const [saveData, setSaveData] = useState<SaveFile | null>(null);
  const [filename, setFilename] = useState<string>("save.json");
  const [versionWarning, setVersionWarning] = useState<string | null>(null);

  const loadFile = useCallback((text: string, name: string) => {
    const { data, versionWarning: warning } = parseSaveFile(text);
    setSaveData(data);
    setFilename(name);
    setVersionWarning(warning);
  }, []);

  const updateStateJson = useCallback(
    (updater: (state: StateJson) => void) => {
      setSaveData((prev) => {
        if (!prev) return prev;
        const next = structuredClone(prev);
        updater(next.stateJson);
        return next;
      });
    },
    []
  );

  const download = useCallback(() => {
    if (!saveData) return;
    downloadSaveFile(saveData, filename);
  }, [saveData, filename]);

  return (
    <SaveFileContext.Provider
      value={{
        saveData,
        filename,
        versionWarning,
        isLoaded: saveData !== null,
        loadFile,
        updateStateJson,
        download,
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
