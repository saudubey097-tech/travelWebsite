"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="flex h-9 items-center gap-1.5 rounded-sm px-3 font-body text-sm text-ink/60 transition-colors hover:bg-sand hover:text-ink"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden />
        Sign out
      </button>
    </form>
  );
}
