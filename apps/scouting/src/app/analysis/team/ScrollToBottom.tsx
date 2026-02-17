"use client";

import { Button } from "@repo/ui/components/button";
import { ArrowDown } from "lucide-react";

export function ScrollToBottomButton() {
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <Button onClick={scrollToBottom} variant="outline" size="sm" className="w-fit">
      <ArrowDown />
      Scroll To PitForm
    </Button>
  );
}
