"use client";

import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { TimerIcon } from "lucide-react";
import { useState } from "react";

export default function StartTimer() {
  const [timer, setTimer] = useState(0);

  function UpdateTimer() {
    setTimer((e) => e + 1);
    return <h1> This is some testing code </h1>;
  }

  return (
    <section>
      <div>
        <Button className=" flex justify-end " onClick={UpdateTimer}>
          Start Timer <TimerIcon />
        </Button>
        <div className="bg-yeti-500 rounded-3xl w-16 align-"> {timer} </div>
      </div>
    </section>
  );
}
