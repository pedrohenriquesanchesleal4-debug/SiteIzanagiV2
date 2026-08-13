import { StoryCanvas } from "@/components/sections/StoryCanvas";
import { AgentsGrid } from "@/components/sections/AgentsGrid";
import { InstallSection } from "@/components/sections/InstallSection";
import { ChangelogTeaser } from "@/components/sections/ChangelogTeaser";
import { CTASection } from "@/components/sections/CTASection";

export default function HomePage() {
  return (
    <>
      <StoryCanvas />
      <AgentsGrid />
      <InstallSection />
      <ChangelogTeaser />
      <CTASection />
    </>
  );
}
