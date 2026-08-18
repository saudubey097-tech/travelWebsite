import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <section className="container-edit max-w-md py-16 sm:py-20">
      <SectionHeading eyebrow="Account" title="Choose a new password" />
      <div className="mt-8">
        <ResetPasswordForm token={token} />
      </div>
    </section>
  );
}
