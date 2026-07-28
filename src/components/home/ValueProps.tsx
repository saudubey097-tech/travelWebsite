const ITEMS = [
  {
    title: "Per-vehicle pricing",
    body: "One flat price for the whole vehicle, up to your group's size — never per person.",
  },
  {
    title: "Free cancellation",
    body: "Cancel up to 24 hours before pickup for a full refund. No penalties, no fine print.",
  },
  {
    title: "Local owner-drivers",
    body: "Every trip is with a licensed, insured driver who lives on the route.",
  },
  {
    title: "Door-to-door pickup",
    body: "From your hotel, home, airport terminal or cruise berth — we come to you.",
  },
];

export function ValueProps() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="font-display text-2xl text-ink sm:text-3xl">Straightforward, local, private.</h2>
      <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.title} className="border-t border-gold pt-4">
            <h3 className="font-body text-sm font-semibold text-ink">{item.title}</h3>
            <p className="mt-2 font-body text-sm text-ink/65">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
