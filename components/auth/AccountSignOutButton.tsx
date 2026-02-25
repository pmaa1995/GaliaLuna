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
      className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:bg-[color:var(--bg-soft)]"
    >
      <LogOut className="h-3.5 w-3.5" />
      Cerrar sesion
    </button>
  );
}
