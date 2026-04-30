"use client";

import { init } from "@plausible-analytics/tracker";
import { useEffect } from "react";

export function PlausibleProvider() {
  useEffect(() => {
    init({ domain: "scout.yetirobotics.org" });
  }, []);

  return null;
}
