import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link";
import ResultsTable from "@/components/ResultsTable";

function ResultsPage() {

    const results = [
        { team: "Team YETI", match: 1, score: 100, rank: 1, notes: "Good autonomous" }
       
    ];

    return (
        <div className="bg-black">
        <div className="p-4 border-b mb-4 content-normal ">
        <Tabs defaultValue="scouting">
          <TabsList>
            <TabsTrigger value="scouting">Scouting</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          <TabsContent value="scouting">
            <div className="p-4">
              <Link href="/frontend">
                <button>Go to Frontend</button>
              </Link>   
            </div>
          </TabsContent>
          <TabsContent value="results">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              {/* server-rendered table component */}
              <ResultsTable results={results} />
            </div>
          </TabsContent>
        </Tabs>
        </div>
        </div>
        
    )
}

export default ResultsPage;