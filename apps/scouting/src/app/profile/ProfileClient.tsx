"use client";

import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { LeaveOrganizationCard } from "./LeaveOrganizationCard";
import LogoutButton from "./LogoutButton";
import PasskeyManager from "./passkey/PasskeyManager";

export default function ProfileClient() {
  const { data: session, isPending } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();

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
          <h2 className="text-2xl font-semibold mb-2">You're not signed in</h2>
          <p className="text-sm text-neutral-400">
            Sign in to view your profile and progress.
          </p>
        </div>
      </div>
    );
  }

  const user = session.user;

  return (
    <>
      <header className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden">
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
              <h1>{user.name}</h1>
            </div>
          )}
        </div>
        <LogoutButton />
      </header>

      <section className="bg-muted-black rounded-lg p-6 ring-ring mb-8 size-full mt-10">
        <h3 className="text-2xl font-semibold text-foreground-white mb-3">
          Account
        </h3>
        <PasskeyManager />
      </section>

      {/* <LeaveOrganizationCard session={session} activeOrg={activeOrg} /> */}
    </>
  );
}
