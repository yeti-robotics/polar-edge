import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PathViewer } from "@/components/auto-path/PathViewer";
import { getAutoPath } from "../actions";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

async function AutoPathDetail({ id }: { id: string }) {
  try {
    const path = await getAutoPath(id);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl tracking-tight">Auto Path Details</h1>
            <p className="mt-2 text-sm text-muted-foreground">Team {path.teamNumber}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/auto-path">
              <ArrowLeftIcon className="mr-2 size-4" />
              Back to List
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Path Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Number</p>
                <p className="text-lg font-semibold">Team {path.teamNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">L1 Climb</p>
                {path.hasL1Climb ? (
                  <Badge variant="default">Yes</Badge>
                ) : (
                  <Badge variant="outline">No</Badge>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(new Date(path.createdAt))}</p>
              </div>
              {path.fieldImageUrl && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Field Image</p>
                  <p className="text-sm break-all">{path.fieldImageUrl}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Path Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <PathViewer pathData={path.pathData} className="w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (_error) {
    notFound();
  }
}

export default async function AutoPathDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <AutoPathDetail id={id} />
    </main>
  );
}
