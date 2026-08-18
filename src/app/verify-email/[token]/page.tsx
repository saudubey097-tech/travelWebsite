import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmail } from "@/lib/actions/security";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Verify your email", robots: { index: false } };

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await verifyEmail(token);

  return (
    <section className="container-edit max-w-md py-16 sm:py-20">
      <Card className="p-8 text-center">
        {result.ok ? (
          <>
            <CheckCircle2 className="mx-auto h-8 w-8 text-pine" aria-hidden />
            <h1 className="mt-3 font-display text-xl text-ink">Email verified</h1>
            <p className="mt-2 font-body text-sm text-ink/60">Thanks — your account is fully set up.</p>
            <LinkButton href="/dashboard" size="sm" className="mt-5">
              Continue
            </LinkButton>
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-8 w-8 text-red-600" aria-hidden />
            <h1 className="mt-3 font-display text-xl text-ink">That link didn&apos;t work</h1>
            <p className="mt-2 font-body text-sm text-ink/60">{result.error}</p>
            <Link href="/dashboard" className="mt-5 inline-block font-body text-sm text-pine underline">
              Go to your dashboard
            </Link>
          </>
        )}
      </Card>
    </section>
  );
}
