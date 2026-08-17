import { describe, it, expect } from "vitest";
import { homeRouteForRole } from "@/lib/auth/routing";

// Scenario 8: role-based redirects work after sign-in.
describe("homeRouteForRole", () => {
  it("sends each role to its own workspace", () => {
    expect(homeRouteForRole("CUSTOMER")).toBe("/dashboard");
    expect(homeRouteForRole("COORDINATOR")).toBe("/coordinator");
    expect(homeRouteForRole("DRIVER")).toBe("/driver");
    expect(homeRouteForRole("ADMIN")).toBe("/admin");
  });
});
