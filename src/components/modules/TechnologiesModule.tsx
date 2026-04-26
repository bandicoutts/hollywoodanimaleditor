"use client";

import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";

export default function TechnologiesModule() {
  const { isLoaded } = useSaveFile();
  return (
    <ModuleShell
      title="Technologies"
      subtitle="Toggle camera and sound technology ownership"
      maxWidth={800}
    >
      {isLoaded ? (
        <EmptyState message="Technologies editor coming soon" />
      ) : (
        <EmptyState message="Upload a save file to edit technologies" />
      )}
    </ModuleShell>
  );
}
