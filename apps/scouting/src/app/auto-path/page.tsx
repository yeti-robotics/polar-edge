import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { TypographyH1, TypographyMuted } from "@repo/ui/components/typography";
import { EyeIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getAutoPaths } from "./actions";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function LoadingTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Team</TableHead>
          <TableHead>Match</TableHead>
          <TableHead>L1 Climb</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {["a", "b", "c", "d", "e"].map((id) => (
          <TableRow key={id}>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-16" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function AutoPathsContent() {
  const paths = await getAutoPaths();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Team</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>L1 Climb</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paths.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              No auto paths found. Create your first one!
            </TableCell>
          </TableRow>
        ) : (
          paths.map((path) => (
            <TableRow key={path.id}>
              <TableCell className="font-medium">Team {path.teamNumber}</TableCell>
              <TableCell>{path.name}</TableCell>
              <TableCell>
                {path.hasL1Climb ? (
                  <Badge variant="default">Yes</Badge>
                ) : (
                  <Badge variant="outline">No</Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(new Date(path.createdAt))}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/auto-path/${path.id}`}>
                    <EyeIcon className="mr-2 size-4" />
                    View
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export default function AutoPathsPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <TypographyH1>Auto Paths</TypographyH1>
          <TypographyMuted className="mt-2">View and manage robot auto paths</TypographyMuted>
        </div>
        <Button asChild>
          <Link href="/auto-path/create">
            <PlusIcon className="mr-2 size-4" />
            Create Path
          </Link>
        </Button>
      </div>
      <Suspense fallback={<LoadingTable />}>
        <AutoPathsContent />
      </Suspense>
    </main>
  );
}
