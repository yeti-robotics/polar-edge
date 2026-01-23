"use client";
import Link from "next/link";
import { OrganizationSelector } from "./OrganizationSelector";

function SmoothScroll() {
  console.log("This is for later when adding that vercel smooth background color scale")
 
}
export function Header() {
  return (
    <header className="sticky top-0 z-50 h-16 px-4 border-b flex items-center  bg-background">
      <div className="flex items-center gap-4">
        <span className="font-mono uppercase text-xs">Polar Edge</span>
        <OrganizationSelector />
      </div>
      <div className="ml-40 mt-4 flex justify-center items-center">
      <nav className="flex gap-12 text-xs font-mono ">
        <Link className="hover:text-white hover:bg-neutral-800 hover:w-12 hover:h-5" onClick={SmoothScroll} href="/">Home</Link>
        <Link className="hover:text-white hover:bg-neutral-800 hover:w-20 hover:h-5" href="/auto-path">Auto Paths</Link>
        <Link className="hover:text-white hover:bg-neutral-800 hover:w-20 hover:h-5" href="/scouting"> Scouting </Link>
        <Link className="hover:text-white hover:bg-neutral-800 hover:w-20 hover:h-5" href="/profile"> Profile </Link>
        <Link className="hover:text-white hover:bg-neutral-800 hover:w-13 hover:h-5" href="/results"> Data </Link>
      </nav>
      </div>
    </header>
  );
}