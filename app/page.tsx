import { redirect } from "next/navigation";

/** First visit and every return land on HOME. Onboarding is opt-in from there. */
export default function RootPage() {
  redirect("/home");
}
