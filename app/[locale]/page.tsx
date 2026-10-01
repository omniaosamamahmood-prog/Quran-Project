import { ContinueReading } from "@/components/home/ContinueReading";
import { Hero } from "@/components/home/Hero";
import { MemorizationProgress } from "@/components/home/MemorizationProgress";
import { QuickActions } from "@/components/home/QuickActions";
import { TodaysReviews } from "@/components/home/TodaysReviews";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  let isAuthenticated = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);
  } catch {
    isAuthenticated = false;
  }

  return (
    // The supplied parchment artwork backs everything below the hero; the hero
    // paints its own photograph over this layer.
    <main
      id="main"
      className="bg-[url(/images/quranbackground.png)] bg-cover bg-center bg-no-repeat bg-scroll lg:bg-fixed"
    >
      <Hero />

      {/* Pulled up so the action row layers over the hero panel */}
      <Container className="relative z-10 -mt-16 pb-10 sm:-mt-20 sm:pb-14">
        <QuickActions />

        <div className="mt-4 flex flex-col gap-4 sm:mt-5 sm:gap-5">
          <ContinueReading isAuthenticated={isAuthenticated} />

          <div className="grid items-start gap-4 sm:gap-5 lg:grid-cols-2">
            <TodaysReviews isAuthenticated={isAuthenticated} />
            <MemorizationProgress isAuthenticated={isAuthenticated} />
          </div>
        </div>
      </Container>
    </main>
  );
}
