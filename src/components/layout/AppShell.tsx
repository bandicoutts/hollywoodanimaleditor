"use client";

import { useState } from "react";
import TopBar from "./TopBar";
import Sidebar, { type ModuleId } from "./Sidebar";
import ResourcesModule from "@/components/modules/ResourcesModule";
import CharactersModule from "@/components/modules/CharactersModule";
import WritingTagsModule from "@/components/modules/WritingTagsModule";
import ResearchModule from "@/components/modules/ResearchModule";
import TechnologiesModule from "@/components/modules/TechnologiesModule";
import ResearchSpeedupModule from "@/components/modules/ResearchSpeedupModule";
import CompetitorStudiosModule from "@/components/modules/CompetitorStudiosModule";
import MilestonesModule from "@/components/modules/MilestonesModule";
import AIScriptsModule from "@/components/modules/AIScriptsModule";

function ModuleContent({ active }: { active: ModuleId }) {
  switch (active) {
    case "resources":
      return <ResourcesModule />;
    case "characters":
      return <CharactersModule />;
    case "writing-tags":
      return <WritingTagsModule />;
    case "research":
      return <ResearchModule />;
    case "technologies":
      return <TechnologiesModule />;
    case "research-speedup":
      return <ResearchSpeedupModule />;
    case "competitor-studios":
      return <CompetitorStudiosModule />;
    case "milestones":
      return <MilestonesModule />;
    case "ai-scripts":
      return <AIScriptsModule />;
  }
}

export default function AppShell() {
  const [activeModule, setActiveModule] = useState<ModuleId>("resources");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--color-bg-app)",
      }}
    >
      <TopBar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar activeModule={activeModule} onNavigate={setActiveModule} />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            minWidth: 0,
            background: "var(--color-bg-app)",
          }}
        >
          <ModuleContent active={activeModule} />
        </main>
      </div>
    </div>
  );
}
