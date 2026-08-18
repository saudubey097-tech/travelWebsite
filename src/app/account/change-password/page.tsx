import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { homeRouteForRole } from "@/lib/auth/routing";
import { ForcedChangePasswordForm } from "@/components/workflow/ForcedChangePasswordForm";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = { title: "Change your password", robots: { index: false } };

export default async function ForcedChangePasswordPage() {
  const user = await requireUser();
  if (!user.mustChangePassword) redirect(homeRouteForRole(user.role));

  return (
    <div className="mx-auto max-w-md">
      <SectionHeading
        eyebrow="Security"
        title="Set a new password"
        description="Your account was set up with a temporary password. Choose a new one to continue."
      />
      <Card className="mt-6 p-5">
        <ForcedChangePasswordForm homeRoute={homeRouteForRole(user.role)} />
      </Card>
    </div>
  );
}
