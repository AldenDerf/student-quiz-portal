import { prisma } from "@/prisma/db";
import { Users, BookOpen, FileText, CheckCircle } from "lucide-react";

export default async function DashboardPage() {
  const [studentCount, subjectCount, examCount, resultCount] =
    await Promise.all([
      prisma.student.count(),
      prisma.subject.count(),
      prisma.exam.count(),
      prisma.examResult.count(),
    ]);

  const stats = [
    {
      label: "Total Students",
      value: studentCount,
      icon: Users,
      color: "#3b82f6",
    },
    {
      label: "Total Subjects",
      value: subjectCount,
      icon: BookOpen,
      color: "#10b981",
    },
    {
      label: "Exams Created",
      value: examCount,
      icon: FileText,
      color: "#f59e0b",
    },
    {
      label: "Exam Submissions",
      value: resultCount,
      icon: CheckCircle,
      color: "#8b5cf6",
    },
  ];

  return (
    <div>
      <h1 style={styles.title}>System Overview</h1>
      <div style={styles.grid}>
        {stats.map((stat) => (
          <div key={stat.label} style={styles.card}>
            <div
              style={{
                ...styles.iconContainer,
                backgroundColor: stat.color + "10",
              }}>
              <stat.icon size={24} color={stat.color} />
            </div>
            <div>
              <p style={styles.statLabel}>{stat.label}</p>
              <p style={styles.statValue}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  title: {
    margin: "0 0 1.5rem 0",
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#111827",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow:
      "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  iconContainer: {
    padding: "0.75rem",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    margin: 0,
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#6b7280",
  },
  statValue: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#111827",
  },
};
