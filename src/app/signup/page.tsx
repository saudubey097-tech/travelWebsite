import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/AuthForm";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { signUp } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { homeRouteForRole } from "@/lib/auth/routing";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeRouteForRole(user.role));

  return (
    <section className="container-edit max-w-md py-16 sm:py-20">
      <SectionHeading
        eyebrow="Account"
        title="Create your account"
        description="Track your trip requests, message your driver, and book faster next time."
      />
      <div className="mt-8">
        <SignUpForm action={signUp} />
      </div>
    </section>
  );
}
