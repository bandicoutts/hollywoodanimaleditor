"use client";

import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";

export default function CharactersModule() {
  const { isLoaded } = useSaveFile();
  return (
    <ModuleShell
      title="Characters"
      subtitle="View and edit character skills, stats, and traits"
    >
      {isLoaded ? (
        <EmptyState message="Character editor coming soon" />
      ) : (
        <EmptyState message="Upload a save file to edit characters" />
      )}
    </ModuleShell>
  );
}
