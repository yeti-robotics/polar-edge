"use client";
import { Button } from "@repo/ui/components/button";

export default function ExportButton() {
  return (
    <div>
      <div className="relative">
        <Button
          className="place-content-end-safe absolute -top-16 right-0"
          onClick={(e) => e.target.removeEventListener}
        >
          Export Data
        </Button>
      </div>
    </div>
  );
}
