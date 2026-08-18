"use client";

import { useRouter } from "next/navigation";
import { ChangePasswordForm } from "@/components/workflow/ChangePasswordForm";

export function ForcedChangePasswordForm({ homeRoute }: { homeRoute: string }) {
  const router = useRouter();
  return <ChangePasswordForm onSuccess={() => router.push(homeRoute)} />;
}
