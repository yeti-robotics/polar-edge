"use client";

import { useEffect } from "react";

let initialized = false;

export function PlausibleProvider() {
  useEffect(() => {
    if (!initialized) {
      initialized = true;
      import("@plausible-analytics/tracker").then(({ init }) => {
        init({ domain: "scout.yetirobotics.org" });
      });
    }
  }, []);

  return null;
}
