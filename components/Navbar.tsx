"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

type NavbarProps = {
  userName: string;
};

export default function Navbar({ userName }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Extract initial for profile circle
  const initial = userName ? userName.charAt(0).toUpperCase() : "?";

  return (
    <nav style={styles.navbar}>
      <div style={styles.logoContainer}>
        <Link href="/dashboard" style={styles.logo}>
          Student Quiz Portal
        </Link>
      </div>

      <div style={styles.profileContainer}>
        <div
          style={styles.profileCircle}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          title={userName}>
          {initial}
        </div>

        {dropdownOpen && (
          <div style={styles.dropdown}>
            <div style={styles.dropdownHeader}>
              <p style={styles.dropdownName}>{userName}</p>
            </div>
            <button
              style={styles.logoutButton}
              onClick={() => signOut({ callbackUrl: "/api/auth/signin" })}>
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    backgroundColor: "white",
    borderBottom: "1px solid #e5e7eb",
    position: "relative" as const,
    zIndex: 10,
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#2563eb",
    textDecoration: "none",
  },
  profileContainer: {
    position: "relative" as const,
  },
  profileCircle: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#3b82f6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "1.125rem",
    cursor: "pointer",
    userSelect: "none" as const,
  },
  dropdown: {
    position: "absolute" as const,
    top: "50px",
    right: "0",
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    minWidth: "150px",
    overflow: "hidden",
  },
  dropdownHeader: {
    padding: "0.75rem 1rem",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#f9fafb",
  },
  dropdownName: {
    margin: 0,
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#374151",
  },
  logoutButton: {
    width: "100%",
    textAlign: "left" as const,
    padding: "0.75rem 1rem",
    backgroundColor: "transparent",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
};
