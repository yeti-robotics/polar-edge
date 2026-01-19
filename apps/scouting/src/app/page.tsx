"use client";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import ResultsTable from "@/components/ResultsTable";
import Logo from "@/components/logo";

export default function FrontendOnlyForm() {
  const { data: session, isPending } = authClient.useSession();

  // If still loading, show a simple placeholder
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // If not signed in, show a prompt to sign in
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-xl w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to Polar Edge</CardTitle>
            <CardDescription>Please sign in to access scouting tools and results.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 justify-center">
              <Link href="/">
                <Button variant="ghost">Go to Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = session.user;

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-130xl">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-22 w-22">
            {" "}
            <img
              className="h-18 w-18 text-primary rounded-xl"
              src="/yeti.png"
              alt="Yeti Logo"
            />{" "}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user.name ?? user.email}!</h1>
            <p className="text-sm text-muted-foreground">
              Ready to log scouting data or review recent match results?
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="text-center w-full text-lg font-bold text-[1.32rem] text-blue-300">
                <CardTitle>Your Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-start gap-2">
                <div className="font-medium">{user.name ?? user.email}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
                <div className="mt-3 w-full">
                  <Link href="/profile">
                    <Button>View Profile</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-center w-full text-lg font-bold text-[1.32rem] text-blue-300">
                <CardTitle>Quick Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <Link href="/frontend">
                  <Button variant="ghost">Open Scouting Form</Button>
                </Link>
                <Link href="/results">
                  <Button variant="ghost">View Data </Button>
                </Link>
                <Link href="/organization/create">
                  <Button variant="ghost">Manage Organization</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="text-center w-full text-lg font-bold text-[1.32rem] text-blue-300">
                <CardTitle>Recent Matches</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <h1 className="text-m"> Info Will Be Real Time Soon.... </h1>
              <br />
              <br />
              <h2 className="text-sm">
                {" "}
                <b> Built By YETI Web Dev Team </b>
              </h2>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
