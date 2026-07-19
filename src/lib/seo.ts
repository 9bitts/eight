import type { Metadata } from "next";
import { resolveSiteUrl } from "@/lib/site-url";

/** Metadata for public marketing pages (indexable). */
export function marketingMetadata(
  path: "" | `/${string}`,
  title: string,
  description?: string
): Metadata {
  const base = resolveSiteUrl();
  const url = path === "" ? base : `${base}${path}`;

  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: url },
    openGraph: {
      title,
      ...(description ? { description } : {}),
      url,
      siteName: "eight",
      locale: "pt_BR",
    },
    robots: { index: true, follow: true },
  };
}

/** Auth and private app surfaces must stay out of Google. */
export const noIndexMetadata: Metadata = {
  robots: { index: false, follow: false },
};
