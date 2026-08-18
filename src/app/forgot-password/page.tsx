import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <section className="container-edit max-w-md py-16 sm:py-20">
      <SectionHeading eyebrow="Account" title="Forgot your password?" description="Enter your email and we'll send you a reset link." />
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </section>
  );
}
