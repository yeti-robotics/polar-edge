"use client";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import PasskeyManager from "./passkey/PasskeyManager";

export default function ProfilePage() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  function handleLogOut() {
    authClient.signOut();
  }
  const { data: session, isPending } = authClient.useSession();

  function handleLeaveOrganization() {
    console.log("User confirmed leaving organization");
    setOpen(false);
    router.refresh();
  }

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
          <h3 className="text-2xl font-semibold text-foreground-white mb-3">
            Account
          </h3>
          <PasskeyManager />
        </section>
        <Card className=" rounded-lg p-6 ring-ring mb-8 size-full mt-10">
          <h3 className="text-2xl font-semibold text-foreground-white mb-3">
            Leave Organization
          </h3>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className=" w-42">
                Leave Organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure you want to leave?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. You will lose access to all
                  organization scouting data and if you have no other org it
                  will delete your account.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleLeaveOrganization}>
                  Leave Organization
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </main>
  );
}
