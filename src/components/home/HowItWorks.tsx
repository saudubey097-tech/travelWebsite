import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { HOW_IT_WORKS } from "@/data/site-content";

export function HowItWorks() {
  return (
    <section className="border-y border-line bg-sand/50">
      <div className="container-edit py-20 sm:py-24">
        <Reveal>
          <SectionHeading eyebrow="How it works" title="Three steps, one driver." align="center" />
        </Reveal>

        <div className="relative mx-auto mt-16 max-w-4xl">
          <div
            className="absolute left-0 right-0 top-[13px] hidden h-px bg-route-dash text-gold/60 sm:block"
            aria-hidden
          />
          <ol className="grid gap-10 sm:grid-cols-3 sm:gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.1}>
                <li className="relative flex flex-col items-start sm:items-center sm:text-center">
                  <span
                    className="waypoint-dot relative z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-gold font-mono text-[11px] text-ink"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-5 font-display text-xl text-ink">{step.title}</h3>
                  <p className="mt-2 max-w-xs font-body text-sm leading-relaxed text-ink/65">{step.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
