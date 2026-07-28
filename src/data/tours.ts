import { DayTour } from "@/types";

// This module is the only place that knows tour data comes from a static
// array today. Swapping to a real database or CMS later means changing
// getTours()/getTourBySlug() in src/lib/tours.ts, not any component.
export const tours: DayTour[] = [
  {
    slug: "auckland-movie-set-loop",
    title: "Auckland – Movie Set Loop",
    region: "Waikato",
    summary:
      "A private return day trip from Auckland to the Waikato film-set district, at your own pace.",
    description:
      "Your driver collects you in Auckland and heads south into rolling Waikato farmland, home to the region's famous movie-set attraction. You'll have a full guided window to explore before heading back, with stops along the way for photos and coffee whenever you like.",
    durationHours: 11,
    priceFrom: { amount: 860, currency: "NZD" },
    heroImage:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80",
    stops: [
      { name: "Auckland CBD", region: "Auckland" },
      { name: "Matamata district", region: "Waikato" },
    ],
    highlights: [
      "Entry to the film-set grounds included",
      "Flexible stop for lunch in Matamata township",
      "Return via scenic Waikato back-roads",
    ],
    included: ["Private vehicle for your group", "Licensed local driver", "Bottled water on board"],
  },
  {
    slug: "geothermal-valley-day",
    title: "Geothermal Valley Day Trip",
    region: "Bay of Plenty",
    summary: "Geysers, mud pools and redwood forest, all in one private day from Auckland.",
    description:
      "A long, easy day south to New Zealand's geothermal heartland. See geysers and bubbling mud on arrival, then wander the redwood grove before the drive home. Your driver builds the stops around what you want to see.",
    durationHours: 11,
    priceFrom: { amount: 880, currency: "NZD" },
    heroImage:
      "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=1200&q=80",
    stops: [
      { name: "Auckland CBD", region: "Auckland" },
      { name: "Rotorua", region: "Bay of Plenty" },
    ],
    highlights: ["Geyser field entry included", "Redwood forest walk", "Optional lakeside lunch stop"],
    included: ["Private vehicle for your group", "Licensed local driver", "Bottled water on board"],
  },
  {
    slug: "northland-harbour-day",
    title: "Northland Harbour Day",
    region: "Northland",
    summary: "Treaty grounds, a historic seaside town and turquoise water, in a single private day.",
    description:
      "Head north from Auckland to New Zealand's founding harbour. A guided stop at the treaty grounds, free time in a historic waterfront town, and a scenic coastal drive back — with your driver adjusting timing around ferries and tides.",
    durationHours: 12,
    priceFrom: { amount: 960, currency: "NZD" },
    heroImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
    stops: [
      { name: "Auckland CBD", region: "Auckland" },
      { name: "Bay of Islands", region: "Northland" },
    ],
    highlights: ["Treaty grounds entry included", "Free time in Russell", "Coastal lookout stops"],
    included: ["Private vehicle for your group", "Licensed local driver", "Bottled water on board"],
  },
  {
    slug: "cave-glowworm-transfer",
    title: "Movie Set + Glowworm Caves",
    region: "Waikato",
    summary: "Two Waikato icons in one relaxed private day, with a one-way option toward Rotorua.",
    description:
      "A slower-paced day combining the film-set grounds with a guided glowworm cave tour. Ideal if you're continuing on to Rotorua afterwards — tell your driver and this becomes a one-way transfer instead of a return trip.",
    durationHours: 10,
    priceFrom: { amount: 800, currency: "NZD" },
    heroImage:
      "https://images.unsplash.com/photo-1500759285222-a95626b934cb?w=1200&q=80",
    stops: [
      { name: "Auckland CBD", region: "Auckland" },
      { name: "Waitomo", region: "Waikato" },
    ],
    highlights: ["Glowworm cave tour included", "Film-set grounds entry included", "Can end in Rotorua instead of Auckland"],
    included: ["Private vehicle for your group", "Licensed local driver", "Bottled water on board"],
  },
];
