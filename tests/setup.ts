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

// PR1 auth code calls headers()/cookies() (security event IP/UA capture,
// session cookie set/read, the MFA-pending cookie) — both require a real
// Next.js request context normally. Tests exercise actions directly
// outside that context, so both are stubbed with simple in-memory
// implementations sufficient for the auth code paths under test.
const cookieStore = new Map<string, { value: string }>();

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => (name === "user-agent" ? "vitest-test-agent" : null),
  }),
  cookies: async () => ({
    get: (name: string) => cookieStore.get(name),
    set: (name: string, value: string) => {
      cookieStore.set(name, { value });
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
    has: (name: string) => cookieStore.has(name),
  }),
}));

// redirect() from next/navigation throws internally in real Next.js (the
// framework catches it during rendering to perform the redirect) — outside
// that context it would just throw an unhandled error. Tests exercise
// actions directly, so this mock throws a recognizable, catchable signal
// instead; see tests/helpers.ts#expectRedirect for how tests consume it.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));
