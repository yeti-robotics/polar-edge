"use client";

import { TypographyH1, TypographyP } from "@repo/ui/components/typography";
import Image from "next/image";
import PasskeyManager from "@/features/auth/components/PasskeyManager";
import { authClient } from "@/lib/auth-client";
import LeaveOrganizationCard from "./LeaveOrganizationCard";
import LogoutButton from "./LogoutButton";

export default function ProfileClient() {
  const { data: session, isPending } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-sky-200">
        <TypographyH1>Loading profile...</TypographyH1>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
        <div className="max-w-xl w-full text-center">
          <TypographyH1>You're not signed in</TypographyH1>
          <TypographyP>Sign in to view your profile and progress</TypographyP>
        </div>
      </div>
    );
  }

  const user = session.user;

  const organizationId = activeOrg?.id;

  const isOwner = !!(
    activeOrg?.members?.some(
      (m) => m.userId === (user?.id ?? "") && m.role === "owner",
    ) || false
  );

  return (
    <>
      <header className="flex items-center gap-6 mb-8">
        <div className="size-24 rounded-full flex items-center justify-center overflow-hidden">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "avatar"}
              className="w-full h-full object-cover"
              width={300}
              height={300}
            />
          ) : (
            <div className="text-black font-mono flex items-center justify-center w-full h-full">
              {(user.name || "?").charAt(0)}
            </div>
          )}
        </div>
        <LogoutButton />
      </header>

      <section className="bg-muted-black rounded-lg p-6 ring-ring mb-8 size-full mt-10">
        <TypographyH1>Account</TypographyH1>
        <PasskeyManager />
      </section>

      <LeaveOrganizationCard
        isOwner={isOwner}
        organizationId={organizationId}
      />
    </>
  );
}
