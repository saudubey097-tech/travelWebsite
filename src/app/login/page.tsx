import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/AuthForm";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { signIn } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { homeRouteForRole } from "@/lib/auth/routing";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeRouteForRole(user.role));

  return (
    <section className="container-edit max-w-md py-16 sm:py-20">
      <SectionHeading eyebrow="Account" title="Sign in" />
      <div className="mt-8">
        <SignInForm action={signIn} />
      </div>
    </section>
  );
}
