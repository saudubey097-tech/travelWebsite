import type { Metadata } from "next";
import { QuoteForm } from "@/components/transfers/QuoteForm";

export const metadata: Metadata = {
  title: "Transfers",
  description: "Instant price, any pickup and drop-off across New Zealand.",
};

export default function TransfersPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <span className="font-mono text-xs uppercase tracking-wide text-gold">Transfers</span>
      <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
        Anywhere in New Zealand — instant price.
      </h1>
      <p className="mt-3 font-body text-ink/70">
        Enter your pickup and drop-off and we quote the whole vehicle in seconds, sized
        to your group. No fixed routes, no hidden fees.
      </p>

      <div className="mt-8">
        <QuoteForm />
      </div>
    </section>
  );
}
