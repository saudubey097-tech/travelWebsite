import { vi } from "vitest";

// "server-only" relies on bundler condition-resolution (Next.js swaps in a
// no-op for server builds); under plain Node/vitest it would throw on
// import, so it's stubbed out here for tests.
vi.mock("server-only", () => ({}));

// Server Actions call revalidatePath/revalidateTag, which require a real
// Next.js request context (they throw "static generation store missing"
// otherwise). Tests exercise the actions directly, outside that context,
// so cache revalidation itself is irrelevant here — stub it to a no-op.
vi.mock("next/cache", () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
}));
