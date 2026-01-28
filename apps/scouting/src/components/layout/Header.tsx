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
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { OrganizationSelector } from "./OrganizationSelector";

async function AdminLink() {
  const requestHeaders = await headers();
  const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });
  if (activeMember?.role === "admin" || activeMember?.role === "owner") {
    return (
      <Link className="hover:bg-gray-700 px-4 py-2 hover:text-white" href="/admin">
        Admin
      </Link>
    );
  }
}

export async function Header() {
  return (
    <header className="sticky top-0 z-50 h-16 px-4 border-b flex items-center justify-between bg-background">
      <div className="flex items-center gap-4">
        <span className="font-mono uppercase text-xs">Polar Edge</span>
        <OrganizationSelector />
      </div>
      <div className="ml-40 mt-3 flex justify-center items-center">
        <nav className="flex items-center gap-4 text-xs font-mono text-muted-foreground mr-90">
          <Link className="hover:bg-gray-700 px-4 py-2 hover:text-white" href="/">
            Home
          </Link>
          <Link className="hover:bg-gray-700 px-4 py-2 hover:text-white" href="/auto-path">
            Auto Paths
          </Link>
          <Link className="hover:bg-gray-700 px-4 py-2 hover:text-white" href="/scouting">
            Scouting
          </Link>
          <Link className="hover:bg-gray-700 px-4 py-2 hover:text-white" href="/results">
            Data
          </Link>
          <Link
            className="flex items-center gap-4 text-xs font-mono text-muted-foreground mr-90"
            href="/admin"
          >
            <AdminLink />
          </Link>
          <nav />
          <Suspense>
            <div className="size-9 ml-90 mt-1 h-12 flex-wrap justify-start">
              <UserAvatar />
            </div>
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

async function UserAvatar() {
  try {
    const session = await auth.api.getActiveMember({
      headers: await headers(),
    });
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar>
            <AvatarImage src={session?.user.image}></AvatarImage>
            <AvatarFallback> {session?.user.name}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <Link href="/">
              <DropdownMenuLabel> Home </DropdownMenuLabel>
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
