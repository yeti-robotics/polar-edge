"use client";

import { Button } from "@repo/ui/components/button";
import { TimerIcon } from "lucide-react";
import { useState } from "react";

export default function StartTimer() {
  const [timer, setTimer] = useState(0);

  function UpdateTimer() {
    setTimer((e) => e + 1);
    return;
  }

  return (
    <section>
      <div>
        <Button className=" flex justify-end " onClick={UpdateTimer}>
          Start Timer <TimerIcon />
        </Button>
        <div className="container bg-yeti-500 rounded-3xl w-16 justify-end-safe sticky justify-items-end">
          {timer}
        </div>
      </div>
    </section>
  );
}
