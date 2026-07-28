export type VehicleClass = "sedan" | "van" | "xlVan";

export interface Money {
  amount: number;
  currency: "NZD";
}

export interface RouteStop {
  name: string;
  region: string;
}

export interface DayTour {
  slug: string;
  title: string;
  region: string;
  summary: string;
  description: string;
  durationHours: number;
  priceFrom: Money;
  heroImage: string;
  stops: RouteStop[];
  highlights: string[];
  included: string[];
}

export interface HourlyPlan {
  vehicleClass: VehicleClass;
  ratePerHour: Money;
  minimumHours: number;
  includedKmPerHour: number;
}

export interface TransferQuote {
  pickup: string;
  dropoff: string;
  distanceKm: number;
  durationMinutes: number;
  vehicleClass: VehicleClass;
  price: Money;
  depositPct: number;
}

export interface TripType {
  id: "day-tours" | "transfers" | "hourly";
  label: string;
}
