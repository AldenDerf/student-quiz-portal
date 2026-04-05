export default function DashboardPage() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard</h1>
      <p style={styles.subtitle}>
        Welcome! This area is currently blank as requested.
      </p>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow:
      "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    minHeight: "400px",
  },
  title: {
    margin: "0 0 1rem 0",
    fontSize: "1.5rem",
    color: "#111827",
  },
  subtitle: {
    margin: 0,
    color: "#6b7280",
  },
};
