"use client";

import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { useEffect, useState } from "react";
import { useStandForm } from "./StandFormProvider";

function MatchSelectionTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg text-foreground">Match Selection</h2>
      <div className="space-y-4">
        <Input
          type="number"
          id="match_number"
          name="match_number"
          placeholder="Enter Match Number"
        />
        <Input type="number" id="team_number" name="team_number" placeholder="Enter Team Number" />
      </div>
    </div>
  );
}

function OofTimeButton() {
  const {
    dispatch,
    state: { isOofed, oofStartedAt, oofCumulativeSeconds },
  } = useStandForm();

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isOofed) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isOofed]);

  const currentSegmentSeconds = oofStartedAt ? Math.floor((Date.now() - oofStartedAt) / 1000) : 0;
  const totalSeconds = isOofed
    ? oofCumulativeSeconds + currentSegmentSeconds
    : oofCumulativeSeconds;

  if (isOofed) {
    return (
      <Button
        className="w-full"
        variant="destructive"
        onClick={() => dispatch({ type: "oof_end" })}
      >
        End Oof Time ({currentSegmentSeconds}s) — {totalSeconds}s total
      </Button>
    );
  }

  return (
    <Button className="w-full" variant="secondary" onClick={() => dispatch({ type: "oof_start" })}>
      Start Oof Time{oofCumulativeSeconds > 0 ? ` (${oofCumulativeSeconds}s total)` : ""}
    </Button>
  );
}

function ShootEndButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full h-full">
          Shoot End
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Shoot End</DialogTitle>
        </DialogHeader>
        <div>
          <Label htmlFor="balls-per-second-estimate">Balls/Second Estimate</Label>
          <RadioGroup id="balls-per-second-estimate">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="1" id="1-ball-per-second"></RadioGroupItem>
              <Label htmlFor="1-ball-per-second">0 Balls/Second</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="2" id="2-balls-per-second"></RadioGroupItem>
              <Label htmlFor="2-balls-per-second">0-1 Ball/Second</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="3" id="3-balls-per-second"></RadioGroupItem>
              <Label htmlFor="3-balls-per-second">1-2 Balls/Second</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="4" id="4-balls-per-second"></RadioGroupItem>
              <Label htmlFor="4-balls-per-second">2-3 Balls/Second</Label>
            </div>
          </RadioGroup>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AutonomousTab() {
  const {
    state: { isOofed },
  } = useStandForm();
  return (
    <div>
      <h2>Autonomous</h2>
      <div className="space-y-4">
        <OofTimeButton />
        <div className="grid grid-cols-2 gap-4">
          <Button variant="default" className="aspect-square w-full h-full" disabled={isOofed}>
            Shoot Start
          </Button>
          <div className="grid grid-rows-2 gap-4">
            <ShootEndButton />
            <Button variant="destructive" className="w-full h-full" disabled={isOofed}>
              Shoot Cancel
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Button variant="default" className="w-full h-full aspect-square" disabled={isOofed}>
            Climb Start
          </Button>
          <Button variant="secondary" className="w-full h-full aspect-square" disabled={isOofed}>
            Climb End
          </Button>
          <Button variant="destructive" className="w-full h-full aspect-square" disabled={isOofed}>
            Climb Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function TeleopTab() {
  const {
    state: { isOofed },
  } = useStandForm();
  return (
    <div>
      <h2>Teleop</h2>
      <div className="space-y-4">
        <OofTimeButton />
        <div className="grid grid-cols-2 gap-4">
          <Button variant="default" className="aspect-square w-full h-full" disabled={isOofed}>
            Shoot Start
          </Button>
          <div className="grid grid-rows-2 gap-4">
            <Button variant="secondary" className="w-full h-full" disabled={isOofed}>
              Shoot End
            </Button>
            <Button variant="destructive" className="w-full h-full" disabled={isOofed}>
              Shoot Cancel
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Button variant="default" className="w-full h-full aspect-square" disabled={isOofed}>
            Climb Start
          </Button>
          <Button variant="secondary" className="w-full h-full aspect-square" disabled={isOofed}>
            Climb End
          </Button>
          <Button variant="destructive" className="w-full h-full aspect-square" disabled={isOofed}>
            Climb Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentsTab() {
  return (
    <div>
      <h2>Comments</h2>
      <div className="space-y-4">
        <textarea id="comments" name="comments" placeholder="Enter Comments" />
      </div>
    </div>
  );
}

export function StandFormTabs() {
  const {
    state: { currentStage },
  } = useStandForm();

  switch (currentStage) {
    case "match_selection":
      return <MatchSelectionTab />;
    case "autonomous":
      return <AutonomousTab />;
    case "teleop":
      return <TeleopTab />;
    case "comments":
      return <CommentsTab />;
  }
}
