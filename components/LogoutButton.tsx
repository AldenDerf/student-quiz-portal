"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      onClick={async () => {
        await signOut({ redirect: false });
        window.location.href = "/student/login";
      }}
      className={className}>
      Log out
    </button>
  );
}
