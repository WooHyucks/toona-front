import type { EmblaOptionsType } from "embla-carousel";

/**
 * Horizontal rails (Netflix-style):
 * - CSS must use `touch-pan-y` on the Embla container so vertical page scroll
 *   works when the finger starts on a thumbnail.
 * - Embla still owns horizontal drag.
 */
export const HORIZONTAL_RAIL_EMBLA_OPTIONS: EmblaOptionsType = {
  align: "start",
  dragFree: true,
  containScroll: "trimSnaps",
  skipSnaps: true,
  /** Ignore tiny taps; prefer intentional swipes */
  watchDrag: (_, event) => {
    if (!("touches" in event)) return true;
    // Multi-touch (pinch) → let the browser handle it
    if (event.touches.length > 1) return false;
    return true;
  },
};

/** Tailwind classes for Embla container on horizontal rails */
export const HORIZONTAL_RAIL_TOUCH_CLASS =
  "touch-pan-y [-webkit-overflow-scrolling:touch]";
