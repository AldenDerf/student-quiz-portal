import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Example of Authorization: check role
  const isAuthorized =
    session.user.role === "admin" || session.user.role === "exam_creator";

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome to the Protected Area!</h1>
        <p style={styles.subtitle}>You are successfully logged in.</p>

        <div style={styles.infoBox}>
          <p>
            <strong>Name:</strong> {session.user.name}
          </p>
          <p>
            <strong>Email:</strong> {session.user.email}
          </p>
          <p>
            <strong>Role:</strong> {session.user.role}
          </p>
        </div>

        {isAuthorized ? (
          <div style={styles.successBox}>
            <h3>Authorization Check Passed</h3>
            <p>You have the proper role to create and manage exams.</p>
          </div>
        ) : (
          <div style={styles.alertBox}>
            <h3>Authorization Check Failed</h3>
            <p>
              You are logged in, but you do not have permission to manage exams.
              (Requires admin or exam_creator role)
            </p>
          </div>
        )}

        <form
          action="/api/auth/signout"
          method="POST"
          style={{ marginTop: "2rem" }}>
          <button style={styles.logoutButton} type="submit">
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f4f6",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    background: "white",
    padding: "2.5rem",
    borderRadius: "16px",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    width: "100%",
    maxWidth: "600px",
  },
  title: {
    margin: "0 0 0.5rem 0",
    color: "#111827",
    fontSize: "2rem",
    fontWeight: "700",
  },
  subtitle: {
    margin: "0 0 2rem 0",
    color: "#6b7280",
    fontSize: "1.1rem",
  },
  infoBox: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    padding: "1.5rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
  },
  successBox: {
    background: "#ecfdf5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
    padding: "1.5rem",
    borderRadius: "8px",
  },
  alertBox: {
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    padding: "1.5rem",
    borderRadius: "8px",
  },
  logoutButton: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
  },
};
