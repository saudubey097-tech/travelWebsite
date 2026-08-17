/** Thrown when a driver's acceptance loses the race for a booking that was
 *  already claimed by another driver (or already responded to). Lives in
 *  its own module (not in a "use server" actions file) because Next.js
 *  only allows async function exports from "use server" files. */
export class AlreadyClaimedError extends Error {}
