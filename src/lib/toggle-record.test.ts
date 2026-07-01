import { describe, expect, it, vi } from "vitest";
import { toggleUniqueRecord } from "@/lib/toggle-record";
import { Prisma } from "@prisma/client";

describe("toggleUniqueRecord", () => {
  it("remove registro existente sem criar", async () => {
    const add = vi.fn();
    const added = await toggleUniqueRecord(
      async () => ({ count: 1 }),
      add
    );
    expect(added).toBe(false);
    expect(add).not.toHaveBeenCalled();
  });

  it("cria quando não havia registro", async () => {
    const added = await toggleUniqueRecord(
      async () => ({ count: 0 }),
      async () => undefined
    );
    expect(added).toBe(true);
  });

  it("ignora violação de unique em corrida", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("unique", {
      code: "P2002",
      clientVersion: "test",
    });
    const added = await toggleUniqueRecord(
      async () => ({ count: 0 }),
      async () => {
        throw error;
      }
    );
    expect(added).toBe(false);
  });
});
