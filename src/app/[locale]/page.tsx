import { StoryCanvas } from "@/components/sections/StoryCanvas";
import { AgentAtlas } from "@/components/sections/AgentAtlas";
import { SkillUniverse } from "@/components/sections/SkillUniverse";
import { InstallSection } from "@/components/sections/InstallSection";
import { ChangelogTeaser } from "@/components/sections/ChangelogTeaser";
import { CTASection } from "@/components/sections/CTASection";

export default function HomePage() {
  return (
    <>
      <StoryCanvas />
      <AgentAtlas />
      <SkillUniverse />
      <InstallSection />
      <ChangelogTeaser />
      <CTASection />
    </>
  );
}
