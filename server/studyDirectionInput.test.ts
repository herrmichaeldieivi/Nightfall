import { describe, expect, it } from "vitest";
import { EXPLORING_STUDY_DIRECTION } from "@shared/studyDirection";
import { studentFitProfileInput } from "./routers";

const baseline = { hasSponsor: false, consent: true };

describe("student fit-profile study direction contract", () => {
  it("rejects keyboard noise at the protected procedure boundary", () => {
    expect(studentFitProfileInput.safeParse({ ...baseline, studyDirection: "hapafisjfafa" }).success).toBe(false);
  });

  it("accepts a supported Arabic subject and the explicit exploration choice", () => {
    expect(studentFitProfileInput.safeParse({ ...baseline, studyDirection: "علوم حاسوب" }).success).toBe(true);
    expect(studentFitProfileInput.safeParse({ ...baseline, studyDirection: EXPLORING_STUDY_DIRECTION }).success).toBe(true);
  });
});
