import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readMfaChallengeCookie } from "@/lib/auth/mfa-challenge";
import { MfaChallengeForm } from "@/components/auth/MfaChallengeForm";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = { title: "Two-factor verification", robots: { index: false } };

export default async function LoginMfaPage() {
  const pendingUserId = await readMfaChallengeCookie();
  if (!pendingUserId) redirect("/login");

  return (
    <section className="container-edit max-w-md py-16 sm:py-20">
      <SectionHeading
        eyebrow="Verification"
        title="Enter your two-factor code"
        description="Open your authenticator app and enter the current 6-digit code, or use a recovery code."
      />
      <div className="mt-8">
        <MfaChallengeForm />
      </div>
    </section>
  );
}
