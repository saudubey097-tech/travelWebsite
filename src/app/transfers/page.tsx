import type { Metadata } from "next";
import { Suspense } from "react";
import { QuoteForm } from "@/components/transfers/QuoteForm";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Transfers",
  description: "Instant price, any pickup and drop-off across New Zealand.",
  alternates: { canonical: "/transfers" },
};

export default function TransfersPage() {
  return (
    <section className="container-edit max-w-3xl py-16 sm:py-20">
      <SectionHeading
        eyebrow="Transfers"
        title="Anywhere in New Zealand — instant price."
        description="Enter your pickup and drop-off and we quote the whole vehicle in seconds, sized to your group. No fixed routes, no hidden fees."
      />

      <div className="mt-10">
        <Suspense>
          <QuoteForm />
        </Suspense>
      </div>
    </section>
  );
}
