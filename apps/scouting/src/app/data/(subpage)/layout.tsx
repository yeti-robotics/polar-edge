import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

export default function DataSubpageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="sticky top-(--header-height) z-40 bg-background md:hidden">
        <Link href="/data">
          <div className="border-b w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
            <ChevronLeftIcon className="size-4" />
            <span>Data</span>
          </div>
        </Link>
      </div>
      {children}
    </div>
  );
}
