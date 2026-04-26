"use client";

import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";

export default function MilestonesModule() {
  const { isLoaded } = useSaveFile();
  return (
    <ModuleShell
      title="Milestones & Game Flags"
      subtitle="Unlock milestones and toggle game feature flags"
      maxWidth={800}
    >
      {isLoaded ? (
        <EmptyState message="Milestones editor coming soon" />
      ) : (
        <EmptyState message="Upload a save file to edit milestones" />
      )}
    </ModuleShell>
  );
}
