import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=" + encodeURIComponent("/"));
  }

  if (session.user.role === "student") {
    redirect("/student/portal");
  }

  redirect("/dashboard");
}
