import { afterEach, describe, expect, it } from "vitest";
import { marketingMetadata, noIndexMetadata } from "@/lib/seo";

describe("seo", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("marketingMetadata defines canonical and indexable robots", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://doctor8.com.br";
    const meta = marketingMetadata("/sobre", "Sobre — eight");

    expect(meta.alternates?.canonical).toBe("https://doctor8.com.br/sobre");
    expect(meta.openGraph?.url).toBe("https://doctor8.com.br/sobre");
    expect(meta.robots).toEqual({ index: true, follow: true });
  });

  it("marketingMetadata home uses bare site URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://doctor8.com.br/";
    const meta = marketingMetadata("", "eight");

    expect(meta.alternates?.canonical).toBe("https://doctor8.com.br");
  });

  it("noIndexMetadata blocks indexing", () => {
    expect(noIndexMetadata.robots).toEqual({ index: false, follow: false });
  });
});
