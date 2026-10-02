"use client";

import { LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";

export default function AccountSignOutButton() {
  const clerk = useClerk();

  return (
    <button
      type="button"
      onClick={async () => {
        await clerk.signOut();
        window.location.assign("/");
      }}
    >
      Cerrar sesión
      <LogOut size={16} aria-hidden="true" />
    </button>
  );
}
