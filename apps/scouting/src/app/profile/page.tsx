"use client";
import { Button } from "@repo/ui/components/button";
import { TypographyH2 } from "@repo/ui/components/typography";
import Image from "next/image";
import PasskeyManager from "@/features/auth/components/PasskeyManager";
import { authClient } from "@/lib/auth-client";

export default function ProfilePage() {
  function handleLogOut() {
    authClient.signOut();
  }
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-sky-200">
        <div className="text-center text-yeti-500">Loading profile...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
        <div className="max-w-xl w-full text-center">
          <TypographyH2 className="mb-2">You're not signed in</TypographyH2>
          <p className="text-sm text-neutral-400">Sign in to view your profile and progress.</p>
        </div>
      </div>
    );
  }

  const user = session.user;

  return (
    <main className="min-h-screen bg-background-black px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden ">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "avatar"}
                className="w-full h-full object-cover"
                width={300}
                height={300}
              />
            ) : (
              <div className="text-black font-mono">
                {(user.name || "?").charAt(0)}
                <h1> {user.name} </h1>
              </div>
            )}
          </div>
          <Button onClick={handleLogOut}>Log Out</Button>
        </header>
        <section className="bg-muted-black rounded-lg p-6 ring-ring mb-8 size-full mt-10">
          <TypographyH2 className="text-foreground-white mb-3">Account</TypographyH2>
          <PasskeyManager />
        </section>
        <section className="bg-muted-black rounded-lg p-6 ring-ring mb-8 size-full mt-10">
          <TypographyH2 className="text-foreground-white mb-3">Recent activity</TypographyH2>
          <ul>
            <li className="py-3 flex items-start justify-between">
              <div>
                <div className="text-sm text-primary-white font-medium">
                  Mock Data | Real Time Soon (Incorporate Drizzle or Forms that users have filled
                  out)
                </div>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
