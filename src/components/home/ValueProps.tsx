import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ASSURANCES } from "@/data/site-content";

export function ValueProps() {
  return (
    <section className="container-edit py-20 sm:py-24">
      <Reveal>
        <SectionHeading
          eyebrow="Why Southbound"
          title="Straightforward, local, private."
          description="Every trip runs on the same five commitments, whether it's a two-hour transfer or a full day across the South Island."
        />
      </Reveal>

      <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
        {ASSURANCES.map((item, i) => (
          <Reveal key={item.title} delay={i * 0.06}>
            <div className="border-t border-gold pt-5">
              <item.icon className="h-5 w-5 text-gold" strokeWidth={1.5} aria-hidden />
              <h3 className="mt-4 font-display text-lg text-ink">{item.title}</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink/65">{item.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
