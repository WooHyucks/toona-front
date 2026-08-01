import { redirect } from "next/navigation";

/** Legacy path — select now lives at /onboarding */
export default function OnboardingSelectRedirect() {
  redirect("/onboarding");
}
