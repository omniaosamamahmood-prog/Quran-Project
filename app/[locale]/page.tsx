import { AdhkarShortcut } from "@/components/home/AdhkarShortcut";
import { ContinueReading } from "@/components/home/ContinueReading";
import { DailyJourney } from "@/components/home/DailyJourney";
import { Hero } from "@/components/home/Hero";
import { MemorizationShortcut } from "@/components/home/MemorizationShortcut";
import { QuickActions } from "@/components/home/QuickActions";
import { Container } from "@/components/ui/Container";

export default function HomePage() {
  return (
    // The supplied parchment artwork backs everything below the hero; the hero
    // paints its own photograph over this layer.
    <main
      id="main"
      className="bg-[url(/images/quranbackground.png)] bg-cover bg-center bg-no-repeat bg-scroll lg:bg-fixed"
    >
      <Hero />

      {/* Pulled up so the action row layers over the hero panel */}
      <Container className="relative z-10 -mt-16 sm:-mt-20">
        <QuickActions />

        <div className="mt-4 flex flex-col gap-4 sm:mt-5 sm:gap-5">
          <ContinueReading />

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
            <MemorizationShortcut />
            <DailyJourney />
            <AdhkarShortcut />
          </div>
        </div>
      </Container>
    </main>
  );
}
