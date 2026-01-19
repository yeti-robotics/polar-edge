import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import ResultsTable from "@/components/ResultsTable";

function ResultsPage() {
  const results = [{ team: "Team YETI", match: 1, score: 100, rank: 1, notes: "Good autonomous" }];

  return (
    <div className="min-h-screen bg-background py-8 width-full">
      <div className="mx-auto w-full max-w-5xl p-4 border-b mb-6 rounded-md shadow-sm bg-card">
        <Tabs defaultValue="scouting">
          <TabsList>
            <TabsTrigger value="scouting">Scouting</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          <TabsContent value="scouting">
            <div className="p-4 w-225">
              <Link
                href="/frontend"
                className="
      block
      rounded-lg
      bg-black-950
      text-center
      px-4 py-3
      hover:bg-zinc-900
      hover:border-blue-400
      focus:outline-none
    "
              >
                <h2 className="text-sm font-semibold text-blue-400 tracking-wide">
                  Open Scouting Form
                </h2>
              </Link>
            </div>
          </TabsContent>
          <div className="bg-black-900 rounded-md">
            <TabsContent value="results">
              <div className="p-4 w-225 bg-black-900">
                <h2 className="text-lg font-semibold mb-4 text-center">Results</h2>
                <div className="bg-black-800 rounded-md p-4">
                  <ResultsTable results={results} />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export default ResultsPage;
