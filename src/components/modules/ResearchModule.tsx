"use client";

import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";

export default function ResearchModule() {
  const { isLoaded } = useSaveFile();
  return (
    <ModuleShell
      title="Research"
      subtitle="Unlock and manage studio perks"
      maxWidth={800}
    >
      {isLoaded ? (
        <EmptyState message="Perks editor coming soon" />
      ) : (
        <EmptyState message="Upload a save file to edit research perks" />
      )}
    </ModuleShell>
  );
}
