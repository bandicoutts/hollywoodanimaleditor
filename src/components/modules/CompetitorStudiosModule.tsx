"use client";

import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";

export default function CompetitorStudiosModule() {
  const { isLoaded } = useSaveFile();
  return (
    <ModuleShell
      title="Competitor Studios"
      subtitle="View and edit rival studio budgets, aggression, and status"
      maxWidth={800}
    >
      {isLoaded ? (
        <EmptyState message="Competitor studios editor coming soon" />
      ) : (
        <EmptyState message="Upload a save file to edit competitor studios" />
      )}
    </ModuleShell>
  );
}
