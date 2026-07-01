import { describe, expect, it } from "vitest";
import { notificationDedupeKey } from "@/lib/notifications-server";

describe("notificationDedupeKey", () => {
  it("gera chave única por evento", () => {
    const a = notificationDedupeKey("r1", "a1", "LIKE", "p1");
    const b = notificationDedupeKey("r1", "a1", "LIKE", "p2");
    const c = notificationDedupeKey("r1", "a1", "FOLLOW");
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(a).toBe("r1:a1:LIKE:p1:");
  });
});
