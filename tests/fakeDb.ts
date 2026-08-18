/**
 * A minimal in-memory stand-in for the subset of Prisma Client actually
 * used in src/lib. Not a general query engine — each method implements
 * only the where/include/select shapes the real code calls with, plus a
 * small hand-registered relation resolver for the specific `include`s the
 * tests exercise. See tests/README.md for what this does and doesn't prove.
 */
import { randomUUID } from "node:crypto";

type Row = Record<string, unknown>;
type Where = Record<string, unknown> | undefined;

function matches(row: Row, where?: Where): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, cond]) => {
    if (cond === undefined) return true;
    const value = row[key];
    if (cond && typeof cond === "object" && !Array.isArray(cond)) {
      const c = cond as Record<string, unknown>;
      if ("in" in c) return (c.in as unknown[]).includes(value);
      if ("gte" in c && value !== undefined && (value as Date) < (c.gte as Date)) return false;
      if ("lte" in c && value !== undefined && (value as Date) > (c.lte as Date)) return false;
      return true;
    }
    return value === cond;
  });
}

type Relation = { type: "belongsTo" | "hasMany"; fk: string; table: () => Table };

class Table {
  rows: Row[] = [];
  relations: Record<string, Relation> = {};

  private resolve(row: Row, include?: Record<string, unknown>): Row {
    if (!include) return row;
    const resolved: Row = { ...row };
    for (const [key, spec] of Object.entries(include)) {
      const relation = this.relations[key];
      if (!relation || !spec) continue;
      const target = relation.table();
      const nestedInclude =
        typeof spec === "object" && spec !== null && "include" in (spec as Row)
          ? ((spec as Row).include as Record<string, unknown>)
          : undefined;
      if (relation.type === "belongsTo") {
        const match = target.rows.find((r) => r.id === row[relation.fk]);
        resolved[key] = match ? target.resolve(match, nestedInclude) : null;
      } else {
        const matchesFk = target.rows.filter((r) => r[relation.fk] === row.id);
        resolved[key] = matchesFk.map((r) => target.resolve(r, nestedInclude));
      }
    }
    return resolved;
  }

  async create({ data }: { data: Row }) {
    const row = { id: randomUUID(), createdAt: new Date(), updatedAt: new Date(), ...data };
    this.rows.push(row);
    return { ...row };
  }

  async findUnique({ where, include }: { where: Record<string, unknown>; include?: Record<string, unknown> }) {
    const row = this.rows.find((r) => matches(r, where));
    return row ? this.resolve(row, include) : null;
  }

  async findFirst({
    where,
    include,
  }: { where?: Record<string, unknown>; include?: Record<string, unknown> } = {}) {
    const row = this.rows.find((r) => matches(r, where));
    return row ? this.resolve(row, include) : null;
  }

  async findMany({
    where,
    orderBy,
    include,
  }: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, "asc" | "desc">;
    include?: Record<string, unknown>;
  } = {}) {
    let results = this.rows.filter((r) => matches(r, where));
    if (orderBy) {
      const entry = Object.entries(orderBy)[0];
      if (entry) {
        const [key, dir] = entry;
        results = [...results].sort((a, b) => {
          const av = a[key] as string | number | Date;
          const bv = b[key] as string | number | Date;
          return dir === "asc" ? (av > bv ? 1 : -1) : av > bv ? -1 : 1;
        });
      }
    }
    return results.map((r) => this.resolve(r, include));
  }

  async count({ where }: { where?: Record<string, unknown> } = {}) {
    return this.rows.filter((r) => matches(r, where)).length;
  }

  async update({ where, data }: { where: Record<string, unknown>; data: Row }) {
    const row = this.rows.find((r) => matches(r, where));
    if (!row) throw new Error("Record not found");
    Object.assign(row, data, { updatedAt: new Date() });
    return { ...row };
  }

  /** The critical primitive for atomic acceptance: only rows matching `where`
   *  right now are updated, and the count tells the caller how many were. */
  async updateMany({ where, data }: { where?: Record<string, unknown>; data: Row }) {
    const matched = this.rows.filter((r) => matches(r, where));
    for (const row of matched) Object.assign(row, data, { updatedAt: new Date() });
    return { count: matched.length };
  }

  async deleteMany({ where }: { where?: Record<string, unknown> } = {}) {
    const before = this.rows.length;
    this.rows = this.rows.filter((r) => !matches(r, where));
    return { count: before - this.rows.length };
  }
}

export function createFakeDb() {
  const appUser = new Table();
  const session = new Table();
  const bookingRequest = new Table();
  const bookingAssignment = new Table();
  const bookingMessage = new Table();
  const bookingEvent = new Table();
  const notification = new Table();
  const auditLog = new Table();

  session.relations = { user: { type: "belongsTo", fk: "userId", table: () => appUser } };

  bookingAssignment.relations = {
    bookingRequest: { type: "belongsTo", fk: "bookingRequestId", table: () => bookingRequest },
    driver: { type: "belongsTo", fk: "driverId", table: () => appUser },
    offeredBy: { type: "belongsTo", fk: "offeredById", table: () => appUser },
  };

  bookingRequest.relations = {
    customer: { type: "belongsTo", fk: "customerId", table: () => appUser },
    coordinator: { type: "belongsTo", fk: "coordinatorId", table: () => appUser },
    assignments: { type: "hasMany", fk: "bookingRequestId", table: () => bookingAssignment },
    messages: { type: "hasMany", fk: "bookingRequestId", table: () => bookingMessage },
    events: { type: "hasMany", fk: "bookingRequestId", table: () => bookingEvent },
  };

  bookingMessage.relations = { sender: { type: "belongsTo", fk: "senderId", table: () => appUser } };
  bookingEvent.relations = { actor: { type: "belongsTo", fk: "actorId", table: () => appUser } };
  auditLog.relations = { actor: { type: "belongsTo", fk: "actorId", table: () => appUser } };

  const tables = { appUser, session, bookingRequest, bookingAssignment, bookingMessage, bookingEvent, notification, auditLog };

  const fake = {
    ...tables,
    // Sequential, non-isolated — sufficient to test the guard *logic*, see
    // tests/README.md for what this can't prove about real concurrency.
    $transaction: async (fn: (tx: typeof tables) => Promise<unknown>) => fn(tables),
  };

  return fake;
}

export type FakeDb = ReturnType<typeof createFakeDb>;
