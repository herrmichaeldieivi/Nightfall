import { describe, expect, it } from "vitest";
import { shouldRedirectCompletedProfile, shouldResumePendingConsultantInterview } from "./consultantResume";

describe("Consultant account-unlock resume policy", () => {
  it("prioritizes a signed-in student's pending local interview over the generic dashboard", () => {
    expect(shouldResumePendingConsultantInterview(true, true)).toBe(true);
    expect(shouldResumePendingConsultantInterview(false, true)).toBe(false);
  });

  it("does not redirect an already-onboarded student away from a pending Consultant save", () => {
    expect(shouldRedirectCompletedProfile(true, true)).toBe(false);
    expect(shouldRedirectCompletedProfile(true, false)).toBe(true);
  });
});
