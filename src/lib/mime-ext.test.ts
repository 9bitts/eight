import { describe, expect, it } from "vitest";
import { extensionForMime } from "@/lib/mime-ext";

describe("extensionForMime", () => {
  it("mapeia content-type para extensão segura", () => {
    expect(extensionForMime("image/png")).toBe("png");
    expect(extensionForMime("image/jpeg")).toBe("jpg");
    expect(extensionForMime("video/mp4")).toBe("mp4");
    expect(extensionForMime("application/pdf")).toBe("pdf");
  });

  it("ignora extensão do nome do arquivo", () => {
    expect(extensionForMime("text/html")).toBe("bin");
  });
});
