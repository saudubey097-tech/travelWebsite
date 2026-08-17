import Image from "next/image";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { DESTINATIONS } from "@/data/site-content";

export function Destinations() {
  return (
    <section className="container-edit py-20 sm:py-24">
      <Reveal>
        <SectionHeading
          eyebrow="Where you'll go"
          title="The places worth building a day around."
          description="A sample of the country your driver knows best — every day tour and transfer runs through country like this."
        />
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {DESTINATIONS.map((d, i) => (
          <Reveal key={d.name} delay={i * 0.06}>
            <div className="group relative h-80 overflow-hidden rounded-md">
              <Image
                src={d.image}
                alt={`${d.name}, ${d.region}, New Zealand`}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 ease-signature group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <span className="font-mono text-[10px] uppercase tracking-wide text-goldMuted">{d.region}</span>
                <h3 className="mt-1 font-display text-xl leading-tight text-paper">{d.name}</h3>
                <p className="mt-2 font-body text-xs leading-relaxed text-paper/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {d.description}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
