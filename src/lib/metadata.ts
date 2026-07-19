import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { isReservedHandle } from "@/lib/reserved-handles";

const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://doctor8.com.br";

export async function buildPostMetadata(postId: string): Promise<Metadata> {
  const post = await prisma.post.findFirst({
    where: { id: postId, hidden: false },
    include: {
      author: { select: { displayName: true, handle: true } },
    },
  });

  if (!post) {
    return { title: "Publicação · eight", robots: { index: false, follow: false } };
  }

  const title = `${post.author.displayName} na eight`;
  const description = post.body.slice(0, 160) || "Publicação na rede eight.";
  const image = post.images[0] ?? post.linkImage ?? undefined;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE}/post/${post.id}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export async function buildProfileMetadata(handle: string): Promise<Metadata> {
  const normalized = handle.toLowerCase();
  if (isReservedHandle(normalized)) {
    return { title: "eight", robots: { index: false, follow: false } };
  }

  const profile = await prisma.profile.findUnique({
    where: { handle: normalized },
    select: {
      displayName: true,
      handle: true,
      bio: true,
      avatarUrl: true,
      specialty: true,
      verified: true,
      suspended: true,
    },
  });

  if (!profile || profile.suspended) {
    return { title: "Perfil · eight", robots: { index: false, follow: false } };
  }

  const title = `${profile.displayName} (@${profile.handle}) · eight`;
  const description =
    profile.bio?.slice(0, 160) ||
    `${profile.displayName}${profile.specialty ? ` · ${profile.specialty}` : ""} na rede profissional eight.`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: profile.displayName,
      description,
      type: "profile",
      url: `${SITE}/${profile.handle}`,
      images: profile.avatarUrl ? [{ url: profile.avatarUrl }] : undefined,
    },
    twitter: {
      card: profile.avatarUrl ? "summary" : "summary",
      title: profile.displayName,
      description,
      images: profile.avatarUrl ? [profile.avatarUrl] : undefined,
    },
  };
}
