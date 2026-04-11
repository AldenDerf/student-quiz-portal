import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect(
      "/api/auth/signin?callbackUrl=" + encodeURIComponent("/dashboard"),
    );
  }

  if (session.user.role === "student") {
    redirect("/student/portal");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
      <Navbar userName={session.user.name || session.user.email || "User"} />
      <main style={{ padding: "2rem" }}>{children}</main>
    </div>
  );
}
