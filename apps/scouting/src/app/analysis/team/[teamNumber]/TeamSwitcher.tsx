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
import { ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SelectTeam({
  teams,
}: {
  teams: Array<{ teamNumber: number; teamName: string }>;
}) {
  const router = useRouter();
  const [selectedValue, setSelectedValue] = useState<string | null>(null); //using claude to help fix and dynamically shiw the pages
  const teamOptions = teams.map((team) => ({
    label: `${team.teamNumber} - ${team.teamName}`,
    value: team.teamNumber.toString(),
  }));

  const handleTeamsSelect = (teamNumber: string) => {
    router.push(`/analysis/team/${teamNumber}`);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" className="mt-4 w-32">
          <ArrowLeftRight /> Switch Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select a FRC Team To Compare with </DialogTitle>
        </DialogHeader>
        <Combobox
          items={teamOptions.map((t) => t.label)}
          value={selectedValue}
          onValueChange={(value) => {
            setSelectedValue(value);
            const selected = teamOptions.find((t) => t.label === value);
            if (selected) {
              handleTeamsSelect(selected.value);
            }
          }}
        >
          <ComboboxInput placeholder="Select a FRC Team" />
          <ComboboxContent>
            <ComboboxEmpty>No teams found.</ComboboxEmpty>
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
