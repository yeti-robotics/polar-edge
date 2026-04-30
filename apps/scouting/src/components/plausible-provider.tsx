"use client";

import { init } from "@plausible-analytics/tracker";
import { useEffect } from "react";

export function PlausibleProvider() {
  useEffect(() => {
    try {
      init({ domain: "scout.yetirobotics.org" });
    } catch {
      // init() throws if called more than once; React StrictMode double-invokes effects in dev
    }
  }, []);

  return null;
}
