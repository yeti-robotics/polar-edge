"use client";
import { Button } from "@repo/ui/components/button";
import { TimerIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function Timer() {
  const [seconds, setSeconds] = useState(0);
  // hook for control of the seconds state
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) {
      return;
    }
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      Timer{seconds}
      <Button onClick={() => setRunning(true)}>
        Start Timer <TimerIcon />
      </Button>
      <Button onClick={() => setRunning(false)}>ENd Timer</Button>
    </div>
  );
}
