import { expect } from "vitest";

/**
 * Awaits a Server Action call that's expected to succeed via redirect()
 * (see tests/setup.ts's next/navigation mock) rather than by returning
 * `{ok: true}` — real Next.js Server Actions never return normally past a
 * redirect() call, so tests assert on the redirect happening (and on
 * optional expected destination) rather than on a return value.
 */
export async function expectRedirect(promise: Promise<unknown>, toPathStartingWith?: string): Promise<void> {
  try {
    await promise;
    throw new Error("Expected the action to redirect, but it returned normally.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.startsWith("NEXT_REDIRECT:")) throw err;
    if (toPathStartingWith) {
      const path = message.slice("NEXT_REDIRECT:".length);
      expect(path.startsWith(toPathStartingWith)).toBe(true);
    }
  }
}
