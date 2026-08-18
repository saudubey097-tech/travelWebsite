import type { Metadata } from "next";
import { getInvitationPreview } from "@/lib/actions/invitations";
import { AcceptInvitationForm } from "@/components/auth/AcceptInvitationForm";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Accept your invitation", robots: { index: false } };

export default async function AcceptInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await getInvitationPreview(token);

  if (!invitation) {
    return (
      <section className="container-edit max-w-md py-16 sm:py-20">
        <Card className="p-8 text-center">
          <h1 className="font-display text-xl text-ink">This invitation isn&apos;t valid</h1>
          <p className="mt-2 font-body text-sm text-ink/60">It may have expired or already been used. Ask an admin to send a new one.</p>
        </Card>
      </section>
    );
  }

  const roleLabel = invitation.role.charAt(0) + invitation.role.slice(1).toLowerCase();

  return (
    <section className="container-edit max-w-md py-16 sm:py-20">
      <SectionHeading
        eyebrow="Staff invitation"
        title={`Join Southbound as a ${roleLabel}`}
        description={`Setting up ${invitation.email}. Choose a password to finish creating your account.`}
      />
      <div className="mt-8">
        <AcceptInvitationForm token={token} />
      </div>
    </section>
  );
}
