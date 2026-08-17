"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { FAQ_PREVIEW } from "@/data/site-content";

export function FaqPreview() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="container-edit py-20 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <Reveal>
          <SectionHeading eyebrow="Questions" title="Good to know before you request a trip." />
          <p className="mt-6 font-body text-sm text-ink/60">
            Can&apos;t find what you&apos;re after?{" "}
            <LinkButton href="/book" variant="ghost" size="sm" className="px-0 underline hover:bg-transparent">
              Ask us directly
            </LinkButton>
          </p>
        </Reveal>

        <div className="divide-y divide-line border-y border-line">
          {FAQ_PREVIEW.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.question}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="font-display text-lg text-ink">{item.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gold transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                <div
                  id={`faq-panel-${i}`}
                  className={`grid overflow-hidden transition-all duration-300 ease-signature ${
                    isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <p className="min-h-0 font-body text-sm leading-relaxed text-ink/65">{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
