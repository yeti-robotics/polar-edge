
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInForm } from "./SignInForm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@repo/ui/components/card";
import ResultsTable from "@/components/ResultsTable";
import GalaxyClient from "@/components/GalaxyClient";



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
      <div style={{ width: '100%', height: '600px', position: 'relative' }}>
       

       
          

     
       
       <GalaxyClient />
      </div>
    </main>
  );
}
