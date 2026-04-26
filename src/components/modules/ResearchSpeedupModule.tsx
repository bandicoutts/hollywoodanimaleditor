"use client";

import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";

export default function ResearchSpeedupModule() {
  const { isLoaded } = useSaveFile();
  return (
    <ModuleShell
      title="Research Speed & Construction"
      subtitle="Speed up research, complete active processes, and finish construction"
      maxWidth={720}
    >
      {isLoaded ? (
        <EmptyState message="Research speed editor coming soon" />
      ) : (
        <EmptyState message="Upload a save file to manage research and construction" />
      )}
    </ModuleShell>
  );
}
