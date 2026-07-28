import { Money, TransferQuote, VehicleClass } from "@/types";

export function formatMoney(m: Money): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: m.currency,
    maximumFractionDigits: 0,
  }).format(m.amount);
}

const VEHICLE_LABEL: Record<VehicleClass, string> = {
  sedan: "Sedan (up to 4 guests)",
  van: "Van (up to 8 guests)",
  xlVan: "XL Van (up to 11 guests)",
};

export function vehicleLabel(v: VehicleClass): string {
  return VEHICLE_LABEL[v];
}

// Baseline day-rate + per-km model. This is a placeholder pricing formula —
// in production this would call a routing API (distance/duration) and a
// real rates table, but the shape of TransferQuote is what components use,
// so replacing this function is the only change needed later.
const BASE_FARE: Record<VehicleClass, number> = { sedan: 45, van: 65, xlVan: 85 };
const PER_KM: Record<VehicleClass, number> = { sedan: 1.35, van: 1.65, xlVan: 1.95 };

export function estimateTransfer(
  pickup: string,
  dropoff: string,
  vehicleClass: VehicleClass,
  distanceKm: number
): TransferQuote {
  const durationMinutes = Math.round(distanceKm * 1.1 + 15);
  const amount = Math.round(BASE_FARE[vehicleClass] + distanceKm * PER_KM[vehicleClass]);
  return {
    pickup,
    dropoff,
    distanceKm,
    durationMinutes,
    vehicleClass,
    price: { amount, currency: "NZD" },
    depositPct: 20,
  };
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
