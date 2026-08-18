import type { Role } from "@prisma/client";

/** Where a user lands immediately after signing in, based on role. */
export function homeRouteForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "COORDINATOR":
      return "/coordinator";
    case "DRIVER":
      return "/driver";
    case "CUSTOMER":
    default:
      return "/dashboard";
  }
}

/** Route-prefix → roles allowed. Used by middleware for a cheap first pass;
 *  every Server Action still re-checks with requireRole server-side. */
export const PROTECTED_PREFIXES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/dashboard", roles: ["CUSTOMER", "COORDINATOR", "DRIVER", "ADMIN"] },
  { prefix: "/coordinator", roles: ["COORDINATOR", "ADMIN"] },
  { prefix: "/driver", roles: ["DRIVER", "ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/account", roles: ["CUSTOMER", "COORDINATOR", "DRIVER", "ADMIN"] },
];
