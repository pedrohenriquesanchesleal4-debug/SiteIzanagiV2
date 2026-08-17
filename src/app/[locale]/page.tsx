import { StoryCanvas } from "@/components/sections/StoryCanvas";
import { EvolutionTimeline } from "@/components/sections/EvolutionTimeline";
import { ArchitectureExplorer } from "@/components/sections/ArchitectureExplorer";
import { AgentAtlas } from "@/components/sections/AgentAtlas";
import { AgentSimulator } from "@/components/sections/AgentSimulator";
import { SkillUniverse } from "@/components/sections/SkillUniverse";
import { SkillPlayground } from "@/components/sections/SkillPlayground";
import { RuntimeTools } from "@/components/sections/RuntimeTools";
import { InstallSection } from "@/components/sections/InstallSection";
import { ChangelogTeaser } from "@/components/sections/ChangelogTeaser";
import { CTASection } from "@/components/sections/CTASection";

export default function HomePage() {
  return (
    <>
      <StoryCanvas />
      <ArchitectureExplorer />
      <AgentAtlas />
      <AgentSimulator />
      <SkillUniverse />
      <SkillPlayground />
      <EvolutionTimeline />
      <RuntimeTools />
      <InstallSection />
      <ChangelogTeaser />
      <CTASection />
    </>
  );
}
