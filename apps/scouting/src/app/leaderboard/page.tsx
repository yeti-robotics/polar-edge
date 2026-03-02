import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { TypographyH1, TypographyMuted } from "@repo/ui/components/typography";
import { ClipboardList, MapIcon, Trophy, Wrench } from "lucide-react";
import { Suspense } from "react";
import { LeaderboardContent } from "@/features/leaderboard/components/LeaderboardContent";
import { LoadingSkeleton } from "@/features/leaderboard/components/LoadingSkeleton";

type PageProps = {
  searchParams: Promise<{ event?: string }>;
};

export default function LeaderboardPage({ searchParams }: PageProps) {
  return (
    <main className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <Trophy className="size-7 text-yellow-500" />
        <div>
          <TypographyH1>Scout Leaderboard</TypographyH1>
          <TypographyMuted>Top contributors by form submissions.</TypographyMuted>
        </div>
      </div>

      <Tabs defaultValue="stand">
        <TabsList>
          <TabsTrigger value="stand" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            Stand Forms
          </TabsTrigger>
          <TabsTrigger value="pit" className="gap-1.5">
            <Wrench className="h-3.5 w-3.5" />
            Pit Forms
          </TabsTrigger>
          <TabsTrigger value="auto" className="gap-1.5">
            <MapIcon className="h-3.5 w-3.5" />
            Auto Paths
          </TabsTrigger>
        </TabsList>

        <Suspense fallback={<TabContentFallback />}>
          <LeaderboardContent searchParams={searchParams} />
        </Suspense>
      </Tabs>
    </main>
  );
}

function TabContentFallback() {
  return (
    <>
      <TabsContent value="stand" className="space-y-6 pt-2">
        <LoadingSkeleton showScopeToggle />
      </TabsContent>
      <TabsContent value="pit" className="space-y-6 pt-2">
        <LoadingSkeleton />
      </TabsContent>
      <TabsContent value="auto" className="space-y-6 pt-2">
        <LoadingSkeleton />
      </TabsContent>
    </>
  );
}
