/**
 * Lightweight analytics shim. No new vendor — reuse if Amplitude lands later.
 */
export function track(
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>
) {
  if (typeof window === "undefined") return;
  try {
    const detail = { event, properties: properties ?? {} };
    window.dispatchEvent(new CustomEvent("toona:analytics", { detail }));
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug("[toona:analytics]", event, properties ?? {});
    }
  } catch {
    /* never block UX */
  }
}
