import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Skeleton } from "@repo/ui/components/skeleton";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { OrganizationSelector } from "./OrganizationSelector";

function OrganizationSelectorFallback() {
  return (
    <>
      <div className="hidden md:block w-px h-6 bg-muted-foreground rotate-15" />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="size-6 rounded" />
      </div>
    </>
  );
}

function UserAvatarFallback() {
  return <Skeleton className="size-8 rounded-full" />;
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 py-2 px-6 border-b bg-background h-(--header-height) flex flex-col justify-between">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <span className="hidden md:block uppercase font-mono text-sm">Polar Edge</span>
          <Suspense fallback={<OrganizationSelectorFallback />}>
            <OrganizationSelectorWrapper />
          </Suspense>
        </div>
        <Suspense fallback={<UserAvatarFallback />}>
          <UserAvatar />
        </Suspense>
      </div>
      <nav className="gap-6 text-sm inline-flex">
        <Link className="hover:text-foreground text-muted-foreground" href="/">
          Home
        </Link>
        <Link className="hover:text-foreground text-muted-foreground" href="/auto-path">
          Auto Paths
        </Link>
        <Link className="hover:text-foreground text-muted-foreground" href="/scouting">
          Scouting
        </Link>
        <Link className="hover:text-foreground text-muted-foreground" href="/results">
          Data
        </Link>
        <nav />
      </nav>
    </header>
  );
}

async function OrganizationSelectorWrapper() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return null;
  }

  const isUserSuperAdmin = isSuperAdmin(session.user.name);
  return (
    <>
      <div className="hidden md:block w-px h-6 bg-muted-foreground rotate-15"></div>
      <OrganizationSelector isSuperAdmin={isUserSuperAdmin} />
    </>
  );
}

async function UserAvatar() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return null;
  }

  try {
    const activeMember = await auth.api.getActiveMember({
      headers: await headers(),
    });
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="size-8">
            <AvatarImage src={activeMember?.user.image}></AvatarImage>
            <AvatarFallback> {activeMember?.user.name}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuGroup>
            <Link href="/">
              <DropdownMenuLabel>Home</DropdownMenuLabel>
            </Link>
            <Link href="/profile">
              <DropdownMenuItem>Profile</DropdownMenuItem>
            </Link>
            <DropdownMenuItem>Settings</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  } catch (err) {
    console.warn("Unauthorized organization access attempted: ", err);
    return null;
  }
}
