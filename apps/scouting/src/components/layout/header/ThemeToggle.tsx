"use client";

import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@repo/ui/components/dropdown-menu";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled>
          <SunIcon className="size-4 text-current" />
          <span>Theme</span>
        </DropdownMenuSubTrigger>
      </DropdownMenuSub>
    );
  }

  const currentTheme = theme || "system";

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {currentTheme === "dark" ? (
          <MoonIcon className="size-4 text-current" />
        ) : currentTheme === "light" ? (
          <SunIcon className="size-4 text-current" />
        ) : (
          <MonitorIcon className="size-4 text-current" />
        )}
        <span className="ml-2">Theme</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup value={currentTheme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <SunIcon className="size-4 text-current" />
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <MoonIcon className="size-4 text-current" />
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <MonitorIcon className="size-4 text-current" />
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
