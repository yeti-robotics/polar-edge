"use client";

import { init } from "@plausible-analytics/tracker";
import { useEffect } from "react";

let initialized = false;

export function PlausibleProvider() {
  useEffect(() => {
    if (!initialized) {
      initialized = true;
      init({ domain: "scout.yetirobotics.org" });
    }
  }, []);

  return null;
}
