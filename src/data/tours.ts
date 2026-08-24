import { DayTour } from "@/types";

export const tours: DayTour[] = [
  {
    slug: "delhi-agra-heritage-day", title: "Delhi – Agra Heritage Day", region: "Uttar Pradesh",
    summary: "A private Taj Mahal and Agra Fort day trip from Delhi, planned around your pace.",
    description: "Leave Delhi with a dedicated driver for a full day in Agra. Visit the Taj Mahal and Agra Fort, pause for a relaxed lunch, and return when your group is ready.",
    durationHours: 12, priceFrom: { amount: 12500, currency: "INR" },
    heroImage: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1600&q=80&auto=format&fit=crop",
    stops: [{ name: "Delhi", region: "Delhi NCR" }, { name: "Taj Mahal", region: "Agra" }],
    highlights: ["Taj Mahal and Agra Fort", "Flexible meal and photo stops", "Private air-conditioned vehicle"],
    included: ["Private vehicle for your group", "Professional driver", "Bottled water on board"], tags: ["Heritage", "Golden Triangle"], maxGroupSize: 11,
  },
  {
    slug: "jaipur-royal-day", title: "Jaipur Royal Day", region: "Rajasthan",
    summary: "Forts, palaces and vibrant bazaars in a private day across the Pink City.",
    description: "Explore Jaipur with a driver who keeps the day simple and flexible. Build your route around Amber Fort, City Palace, Hawa Mahal and time for local food or shopping.",
    durationHours: 9, priceFrom: { amount: 8500, currency: "INR" },
    heroImage: "https://images.unsplash.com/photo-1599661046827-dacde6976540?w=1600&q=80&auto=format&fit=crop",
    stops: [{ name: "Jaipur", region: "Rajasthan" }, { name: "Amber Fort", region: "Amer" }],
    highlights: ["Amber Fort visit", "City Palace and Hawa Mahal", "Customizable market stop"],
    included: ["Private vehicle for your group", "Professional driver", "Bottled water on board"], tags: ["Culture", "Forts"], maxGroupSize: 11,
  },
  {
    slug: "varanasi-spiritual-day", title: "Varanasi Spiritual Day", region: "Uttar Pradesh",
    summary: "A gentle private day by the Ganges, from historic lanes to the evening aarti.",
    description: "Take in Varanasi at an unhurried pace. Combine a sunrise boat ride, temple visits and the old city with a planned arrival for the Ganga Aarti.",
    durationHours: 10, priceFrom: { amount: 9000, currency: "INR" },
    heroImage: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1600&q=80&auto=format&fit=crop",
    stops: [{ name: "Varanasi", region: "Uttar Pradesh" }, { name: "Dashashwamedh Ghat", region: "Ganges" }],
    highlights: ["Optional sunrise boat ride", "Old city temple route", "Evening Ganga Aarti"],
    included: ["Private vehicle for your group", "Professional driver", "Bottled water on board"], tags: ["Spiritual", "Culture"], maxGroupSize: 8,
  },
  {
    slug: "kerala-backwaters-day", title: "Kerala Backwaters Day", region: "Kerala",
    summary: "Coconut-lined waterways, village life and a relaxed private day around Alleppey.",
    description: "Travel comfortably through Kerala's backwater country. Pair a houseboat or shikara experience with village stops, local lunch and a scenic coastal return.",
    durationHours: 8, priceFrom: { amount: 10500, currency: "INR" },
    heroImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&q=80&auto=format&fit=crop",
    stops: [{ name: "Kochi", region: "Kerala" }, { name: "Alleppey", region: "Kerala" }],
    highlights: ["Backwater cruise option", "Village and coastal scenery", "Flexible local lunch stop"],
    included: ["Private vehicle for your group", "Professional driver", "Bottled water on board"], tags: ["Nature", "Backwaters"], maxGroupSize: 11,
  },
];
