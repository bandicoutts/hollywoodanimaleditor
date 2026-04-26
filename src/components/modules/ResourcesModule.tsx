"use client";

import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";

export default function ResourcesModule() {
  const { isLoaded } = useSaveFile();
  return (
    <ModuleShell
      title="Resources"
      subtitle="Edit studio budget, cash, reputation, and influence"
      maxWidth={720}
    >
      {isLoaded ? (
        <EmptyState message="Resources editor coming soon" />
      ) : (
        <EmptyState message="Upload a save file to edit resources" />
      )}
    </ModuleShell>
  );
}
