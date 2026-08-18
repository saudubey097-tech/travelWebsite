const NZ_TZ = "Pacific/Auckland";

export function formatNZDate(date: Date | string, style: "full" | "medium" | "short" = "medium"): string {
  return new Date(date).toLocaleDateString("en-NZ", { dateStyle: style, timeZone: NZ_TZ });
}

export function formatNZDateTime(date: Date | string, dateStyle: "full" | "medium" | "short" = "medium"): string {
  return new Date(date).toLocaleString("en-NZ", { dateStyle, timeStyle: "short", timeZone: NZ_TZ });
}
