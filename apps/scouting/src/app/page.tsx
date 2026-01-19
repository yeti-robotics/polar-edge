import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInForm } from "./SignInForm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@repo/ui/components/card";
import ResultsTable from "@/components/ResultsTable";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const params = await searchParams;
  const redirectUrl = params.redirect;

  if (!session?.user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">Welcome to Polar Edge Analytics</h1>
          <p className="text-muted-foreground">Sign in with Discord to continue</p>
          <SignInForm redirectUrl={redirectUrl} />
        </div>
      </main>
    );
  }

  // If there's a redirect URL and user is signed in, redirect them
  if (redirectUrl) {
    redirect(decodeURIComponent(redirectUrl));
  }

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Welcome to Polar Edge Analytics!</h1>
      <p className="mb-6">Hello, {session.user.name || session.user.email}!</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Matches</CardTitle>
            <CardDescription>Upcoming matches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">12</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
            <CardDescription>Registered teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">48</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <a className="text-sm text-primary" href="/scouting">Open Scouting</a>
              <a className="text-sm text-primary" href="/results">View Results</a>
            </div>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Results</h2>
        <ResultsTable results={[{team: 'Team A', match: 1, score: 85, rank:1, notes:'Good autonomous'}]} />
      </section>
    </main>
  );
}
