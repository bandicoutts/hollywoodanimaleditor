"use client";

import { useSaveFile } from "@/context/SaveFileContext";
import AppShell from "@/components/layout/AppShell";
import UploadScreen from "@/components/upload/UploadScreen";

export default function Home() {
  const { isLoaded } = useSaveFile();
  return isLoaded ? <AppShell /> : <UploadScreen />;
}
