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

export async function Header() {
  return (
    <header className="sticky top-0 z-50 h-16 px-4 border-b flex items-center  bg-background">
      <div className="flex items-center gap-4">
        <span className="font-mono uppercase text-xs">Polar Edge</span>
        <OrganizationSelector />
      </div>
      <div className="ml-40 mt-3 flex justify-center items-center">
        <nav className="flex gap-12 text-xs font-mono">
          <Link
            className="hover:text-white hover:bg-neutral-800 text-fore hover:w-12 hover:h-5"
            href="/"
          >
            Home
          </Link>
          <Link className="hover:text-white hover:bg-neutral-800" href="/auto-path">
            Auto Paths
          </Link>
          <Link className="hover:text-white hover:bg-neutral-800" href="/scouting">
            Scouting
          </Link>
          <Link className="hover:text-white hover:bg-neutral-800 hover:w-13" href="/results">
            Data
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
