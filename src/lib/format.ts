const INDIA_TZ = "Asia/Kolkata";

export function formatIndiaDate(date: Date | string, style: "full" | "medium" | "short" = "medium"): string {
  return new Date(date).toLocaleDateString("en-IN", { dateStyle: style, timeZone: INDIA_TZ });
}

export function formatIndiaDateTime(date: Date | string, dateStyle: "full" | "medium" | "short" = "medium"): string {
  return new Date(date).toLocaleString("en-IN", { dateStyle, timeStyle: "short", timeZone: INDIA_TZ });
}
