import { describe, expect, it, vi } from "vitest";
import { assertSafeFetchUrl } from "./safe-url-fetch";

vi.mock("dns/promises", () => ({
  lookup: vi.fn(),
}));

import { lookup } from "dns/promises";

describe("assertSafeFetchUrl", () => {
  it("rejeita esquemas não-http", async () => {
    expect(await assertSafeFetchUrl("file:///etc/passwd")).toBeNull();
    expect(await assertSafeFetchUrl("ftp://example.com")).toBeNull();
  });

  it("rejeita IPs privados e metadata", async () => {
    expect(await assertSafeFetchUrl("http://127.0.0.1/")).toBeNull();
    expect(await assertSafeFetchUrl("http://169.254.169.254/latest/meta-data")).toBeNull();
    expect(await assertSafeFetchUrl("http://192.168.1.1/")).toBeNull();
    expect(await assertSafeFetchUrl("http://localhost:6379")).toBeNull();
  });

  it("rejeita quando DNS resolve para IP privado", async () => {
    vi.mocked(lookup).mockResolvedValue([{ address: "10.0.0.5", family: 4 }]);
    expect(await assertSafeFetchUrl("http://evil.example.com/")).toBeNull();
  });

  it("aceita URL pública com DNS público", async () => {
    vi.mocked(lookup).mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    const url = await assertSafeFetchUrl("https://example.com/page");
    expect(url?.hostname).toBe("example.com");
  });
});
