import type { LucideIcon } from "lucide-react";
import { Car, MapPinned, BadgeDollarSign, CalendarClock, ShieldCheck } from "lucide-react";

// Shared photography used across multiple sections/pages.
export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1525708273332-876be2012222?w=2000&q=80&auto=format&fit=crop";
export const VEHICLE_IMAGE =
  "https://images.unsplash.com/photo-1700884520248-92092bd21e63?w=1400&q=80&auto=format&fit=crop";
export const ROAD_IMAGE =
  "https://images.unsplash.com/photo-1753543565476-965c5c65dde0?w=1800&q=80&auto=format&fit=crop";

export interface Assurance {
  icon: LucideIcon;
  title: string;
  body: string;
}

export const ASSURANCES: Assurance[] = [
  {
    icon: Car,
    title: "Private vehicle, every time",
    body: "Choose a vehicle sized for your group and build the day around your plans, not a shared shuttle timetable.",
  },
  {
    icon: MapPinned,
    title: "A trip planned around you",
    body: "Tell us what matters to your group and we will confirm the practical route, timing and vehicle before you travel.",
  },
  {
    icon: BadgeDollarSign,
    title: "Fixed, transparent pricing",
    body: "One price for the whole vehicle, agreed before you travel. No surge pricing, no surprise add-ons.",
  },
  {
    icon: CalendarClock,
    title: "Clear confirmation before payment",
    body: "Every booking begins as a request. Availability and the final itinerary are confirmed with you before any payment is taken.",
  },
  {
    icon: ShieldCheck,
    title: "Secure booking request",
    body: "Your details go directly to the operator over an encrypted request — never shared or sold on.",
  },
];

export interface Step {
  title: string;
  body: string;
}

export const HOW_IT_WORKS: Step[] = [
  {
    title: "Choose your trip",
    body: "Pick a day tour, price a transfer, or reserve a driver by the hour — takes a couple of minutes.",
  },
  {
    title: "Receive your confirmed itinerary",
    body: "The operator checks availability against your dates and replies with a confirmed price and driver.",
  },
  {
    title: "Travel with your private driver",
    body: "Your driver meets you at the agreed time and place. One vehicle, one driver, your whole trip.",
  },
];

export interface Destination {
  name: string;
  region: string;
  description: string;
  image: string;
}

export const DESTINATIONS: Destination[] = [
  {
    name: "Bay of Islands",
    region: "Northland",
    description: "Sheltered turquoise water, historic waterfront towns and the country's founding harbour.",
    image: "https://images.unsplash.com/photo-1686941224638-5aaff456aa32?w=1200&q=80&auto=format&fit=crop",
  },
  {
    name: "Rotorua & the Geothermal Valley",
    region: "Bay of Plenty",
    description: "Geysers, bubbling mud pools and towering redwoods, an easy private day from Auckland.",
    image: "https://images.unsplash.com/photo-1783038845122-0b1517d66fa0?w=1200&q=80&auto=format&fit=crop",
  },
  {
    name: "Milford Sound",
    region: "Fiordland",
    description: "Sheer cliffs and waterfalls dropping straight into the water — the drive is half the trip.",
    image: "https://images.unsplash.com/photo-1518058891940-d71d20afa6d7?w=1200&q=80&auto=format&fit=crop",
  },
  {
    name: "Queenstown & Lake Wakatipu",
    region: "Otago",
    description: "Alpine peaks running straight down to the lake — the country's base for a private driver day.",
    image: "https://images.unsplash.com/photo-1765114944961-80ca800fff35?w=1200&q=80&auto=format&fit=crop",
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_PREVIEW: FaqItem[] = [
  {
    question: "Is my booking confirmed straight away?",
    answer:
      "Not automatically. Every booking starts as a request — the operator checks driver and vehicle availability for your dates and replies with a confirmed price, usually within one business day.",
  },
  {
    question: "How is the price worked out?",
    answer:
      "Day tours are a flat per-vehicle price shown up front. Transfers are priced on distance and vehicle size. Hourly hire is a per-hour rate with a minimum booking length. You'll always see the price before you send a request.",
  },
  {
    question: "What if my flight is delayed or plans change?",
    answer:
      "Tell your driver your flight number for airport pickups and they'll track it. For general changes, you can cancel free of charge up to 24 hours before pickup.",
  },
  {
    question: "How many people fit in one vehicle?",
    answer:
      "Sedans seat up to 4 guests, vans up to 8, and XL vans up to 11 — all with luggage space. Pick a vehicle size when you request your trip.",
  },
];
