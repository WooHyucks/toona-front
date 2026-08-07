"use client";

import { useEffect } from "react";
import { initAmplitude } from "@/lib/analytics";

/** Boot Amplitude on the client as early as the root layout mounts. */
export function AmplitudeInit() {
  useEffect(() => {
    void initAmplitude();
  }, []);
  return null;
}
