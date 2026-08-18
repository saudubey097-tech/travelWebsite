import { describe, it, expect } from "vitest";
import { checkPasswordStrength } from "@/lib/auth/password";

describe("checkPasswordStrength", () => {
  it("rejects short passwords", () => {
    expect(checkPasswordStrength("Ab1!").ok).toBe(false);
  });

  it("rejects common passwords even if they meet length/variety rules", () => {
    expect(checkPasswordStrength("Password123").ok).toBe(false);
  });

  it("rejects passwords with too little character variety", () => {
    expect(checkPasswordStrength("aaaaaaaaaaaa").ok).toBe(false);
  });

  it("accepts a long, varied, non-common password", () => {
    const result = checkPasswordStrength("Tr4mpol!ne-Skies-99");
    expect(result.ok).toBe(true);
  });
});
