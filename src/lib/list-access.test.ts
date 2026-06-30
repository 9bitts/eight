import { describe, expect, it } from "vitest";
import { canAccessList, canFollowList } from "@/lib/list-access";

describe("canAccessList", () => {
  const list = { isPublic: false, ownerId: "owner-1" };

  it("permite dono em lista privada", () => {
    expect(canAccessList(list, "owner-1")).toBe(true);
  });

  it("nega visitante em lista privada", () => {
    expect(canAccessList(list, "viewer-1")).toBe(false);
    expect(canAccessList(list)).toBe(false);
  });

  it("permite qualquer um em lista pública", () => {
    const pub = { ...list, isPublic: true };
    expect(canAccessList(pub)).toBe(true);
    expect(canAccessList(pub, "viewer-1")).toBe(true);
  });
});

describe("canFollowList", () => {
  const pub = { isPublic: true, ownerId: "owner-1" };

  it("permite seguir lista pública de outro", () => {
    expect(canFollowList(pub, "viewer-1")).toBe(true);
  });

  it("nega seguir própria lista", () => {
    expect(canFollowList(pub, "owner-1")).toBe(false);
  });

  it("nega seguir lista privada", () => {
    expect(canFollowList({ isPublic: false, ownerId: "owner-2" }, "viewer-1")).toBe(false);
  });
});
