import type { Role } from "@prisma/client";

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
}

export function makeUser(overrides: Partial<TestUser> & { role: Role }): TestUser {
  return {
    id: overrides.id ?? `user_${Math.random().toString(36).slice(2, 10)}`,
    email: overrides.email ?? `${overrides.role.toLowerCase()}@example.com`,
    name: overrides.name ?? `Test ${overrides.role}`,
    active: overrides.active ?? true,
    ...overrides,
  };
}
