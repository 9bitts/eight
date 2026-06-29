import { prisma } from "@/lib/prisma";
import { formatSpec } from "@/lib/format";
import { getBlockedProfileIds } from "@/lib/relationships";
import type { ConnectionProfile } from "@/lib/types";

export const COUNTRY_LABELS: Record<string, string> = {
  BR: "Brasil",
  PT: "Portugal",
  US: "Estados Unidos",
  OUTRO: "Outro país",
};

export const CURATED_SPECIALTIES = [
  "Cardiologia",
  "Medicina Geral",
  "Enfermagem",
  "Psiquiatria",
  "Pediatria",
  "Dermatologia",
  "Ginecologia",
  "Ortopedia",
  "Neurologia",
  "Psicologia",
  "Nutrição",
  "Fisioterapia",
  "Odontologia",
];

export type BrowseItem = {
  slug: string;
  label: string;
  count: number;
};

export type DiscoverProfile = {
  id: string;
  displayName: string;
  handle: string;
  specialty: string | null;
  registrationType: string | null;
  registrationNumber: string | null;
  verified: boolean;
  location: string | null;
  registrationCountry: string | null;
};

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function labelFromSlug(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function mapDiscoverProfiles(
  profiles: DiscoverProfile[],
  viewerProfileId: string
): Promise<ConnectionProfile[]> {
  if (profiles.length === 0) return [];

  const ids = profiles.map((p) => p.id);
  const [following, followers] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: viewerProfileId, followingId: { in: ids } },
      select: { followingId: true },
    }),
    prisma.follow.findMany({
      where: { followerId: { in: ids }, followingId: viewerProfileId },
      select: { followerId: true },
    }),
  ]);

  const followingSet = new Set(following.map((f) => f.followingId));
  const followersSet = new Set(followers.map((f) => f.followerId));

  return profiles.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    handle: p.handle,
    spec: formatSpec(p.specialty, p.registrationType, p.registrationNumber),
    verified: p.verified,
    following: followingSet.has(p.id),
    followsYou: followersSet.has(p.id),
  }));
}

const profileSelect = {
  id: true,
  displayName: true,
  handle: true,
  specialty: true,
  registrationType: true,
  registrationNumber: true,
  verified: true,
  location: true,
  registrationCountry: true,
} as const;

export async function getTopSpecialties(limit = 12): Promise<BrowseItem[]> {
  const rows = await prisma.profile.groupBy({
    by: ["specialty"],
    where: { specialty: { not: null } },
    _count: { specialty: true },
    orderBy: { _count: { specialty: "desc" } },
    take: limit,
  });

  const fromDb = rows
    .filter((r) => r.specialty)
    .map((r) => ({
      slug: toSlug(r.specialty!),
      label: r.specialty!,
      count: r._count.specialty,
    }));

  const seen = new Set(fromDb.map((s) => s.slug));
  for (const label of CURATED_SPECIALTIES) {
    const slug = toSlug(label);
    if (!seen.has(slug)) {
      fromDb.push({ slug, label, count: 0 });
      seen.add(slug);
    }
  }

  return fromDb.slice(0, limit);
}

export async function getTopCountries(limit = 6): Promise<BrowseItem[]> {
  const rows = await prisma.profile.groupBy({
    by: ["registrationCountry"],
    where: { registrationCountry: { not: null } },
    _count: { registrationCountry: true },
    orderBy: { _count: { registrationCountry: "desc" } },
    take: limit,
  });

  return rows
    .filter((r) => r.registrationCountry)
    .map((r) => ({
      slug: r.registrationCountry!,
      label: COUNTRY_LABELS[r.registrationCountry!] ?? r.registrationCountry!,
      count: r._count.registrationCountry,
    }));
}

export async function getProfilesBySpecialty(
  slug: string,
  viewerProfileId: string,
  limit = 50
): Promise<ConnectionProfile[]> {
  const label = labelFromSlug(slug);
  const blockedIds = await getBlockedProfileIds(viewerProfileId);

  const profiles = await prisma.profile.findMany({
    where: {
      specialty: { equals: label, mode: "insensitive" },
      ...(blockedIds.length ? { id: { notIn: blockedIds } } : {}),
    },
    orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: profileSelect,
  });

  return mapDiscoverProfiles(profiles, viewerProfileId);
}

export async function getProfilesByCountry(
  code: string,
  viewerProfileId: string,
  limit = 50
): Promise<ConnectionProfile[]> {
  const country = code.toUpperCase();
  const blockedIds = await getBlockedProfileIds(viewerProfileId);

  const profiles = await prisma.profile.findMany({
    where: {
      registrationCountry: country,
      ...(blockedIds.length ? { id: { notIn: blockedIds } } : {}),
    },
    orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: profileSelect,
  });

  return mapDiscoverProfiles(profiles, viewerProfileId);
}

export async function getSpecialtyCount(slug: string): Promise<number> {
  const label = labelFromSlug(slug);
  return prisma.profile.count({
    where: { specialty: { equals: label, mode: "insensitive" } },
  });
}

export async function getCountryCount(code: string): Promise<number> {
  return prisma.profile.count({
    where: { registrationCountry: code.toUpperCase() },
  });
}
