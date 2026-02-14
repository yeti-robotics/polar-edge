"use client";
import { Button } from "@repo/ui/components/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@repo/ui/components/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";

const frameworks = ["YETI", "AVALANCHE", "MOCK#", "REX", "MORe Teams"];

interface Team {
  teamNumber: number;
  teamName: string;
}

interface TeamSwitcherProps {
  teams: Team[];
  currentTeamNumber: number;
}

export function ExampleCombobox({
  teams,
  currentTeamNumber,
}: TeamSwitcherProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  //   const teamItems = teams.map(
  //     (team) => `${team.teamNumber} - ${team.teamName}`,
  //   );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="mt-4 w-32">
          Switch Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select a FRC Team To Compare with </DialogTitle>
        </DialogHeader>
        <Combobox items={frameworks}>
          <ComboboxInput placeholder="Select a framework" />
          <ComboboxContent>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </DialogContent>
    </Dialog>
  );
}
