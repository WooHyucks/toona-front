import { redirect } from "next/navigation";

export default function LegacyMyPage() {
  redirect("/profile");
}
