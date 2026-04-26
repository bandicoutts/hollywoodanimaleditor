"use client";

import ModuleShell, { EmptyState } from "./ModuleShell";
import { useSaveFile } from "@/context/SaveFileContext";

export default function WritingTagsModule() {
  const { isLoaded } = useSaveFile();
  return (
    <ModuleShell
      title="Writing Tags"
      subtitle="Unlock and manage your studio's tag pool"
      maxWidth={720}
    >
      {isLoaded ? (
        <EmptyState message="Writing tags editor coming soon" />
      ) : (
        <EmptyState message="Upload a save file to edit writing tags" />
      )}
    </ModuleShell>
  );
}
