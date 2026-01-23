import { headers } from "next/headers";
import Link from "next/link";
import { Suspense, Suspense } from "react";
import { auth, auth } from "@/lib/auth";
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

//map through array to render the links

export function Header() {
  return (
    <header className="sticky top-0 z-50 h-16 px-4 border-b flex items-center justify-between bg-background">
      <div className="flex items-center gap-4">
        <span className="font-mono uppercase text-xs">Polar Edge</span>
        <OrganizationSelector />
      </div>

      <nav className="flex items-center gap-4 text-xs font-mono text-muted-foreground mr-90 gap-10">
        <Link className="hover:bg-gray-700 px-4 py-2 hover:text-white" href="/">
          Home
        </Link>
        <Link className="hover:bg-gray-700 px-4 py-2 hover:text-white" href="/auto-path">
          Auto Paths
        </Link>
        <Link className="hover:bg-gray-700 px-4 py-2 hover:text-white" href="/forms/pit">
          Pit Form
        </Link>
        <Suspense>
          <AdminLink />
        </Suspense>
      </nav>
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
