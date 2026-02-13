// this is going to have merge issues becasue the other branch has a lot of changes to the same file, but this is the only way to do it without breaking the other branch
"use client";

import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";

export function DropdownMenuCheckboxesIcons() {
  return (
    <div className="sticky top-0 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" className="w-32">
            Team Select
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-bold">
              {" "}
              Team Number & Team Name{" "}
            </DropdownMenuLabel>
            <DropdownMenuItem> MOCK TEAM 1 + NAME </DropdownMenuItem>
            <DropdownMenuItem> MOCK TEAM 2 </DropdownMenuItem>
            <DropdownMenuItem> MOCK TEAM 3</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function TeamSelection() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-4xl font-mono">Comparison Page </h1>
      <div className="w-full">
        <DropdownMenuCheckboxesIcons />
      </div>
    </div>
  );
}

export default function ComparisonPage() {
  return (
    <div className="p-4">
      <TeamSelection />
    </div>
  );
}
