import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPost } from "@/lib/actions";
import { updateProfile } from "@/lib/actions/profile";
import { buildPublicUploadUrl } from "@/lib/media-url";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return { ...actual, rateLimit: vi.fn(async () => ({ ok: true })) };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn(), update: vi.fn() },
    post: { create: vi.fn(), findUnique: vi.fn() },
    poll: { create: vi.fn() },
  },
}));

vi.mock("@/lib/post-server", () => ({
  syncHashtags: vi.fn(),
  notifyMentions: vi.fn(),
}));

vi.mock("@/lib/link-preview", () => ({
  fetchLinkPreview: vi.fn(),
}));

vi.mock("@/lib/notifications-server", () => ({
  createNotificationIfAllowed: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const PROFILE_ID = "profile-1";

describe("mídia em posts e perfil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.S3_PUBLIC_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://doctor8.com.br";

    vi.mocked(auth).mockResolvedValue({
      user: { profileId: PROFILE_ID },
    } as never);
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      suspended: false,
    } as never);
    vi.mocked(prisma.post.create).mockResolvedValue({
      id: "post-1",
      parent: null,
    } as never);
    vi.mocked(prisma.profile.update).mockResolvedValue({} as never);
  });

  it("aceita post com URL do storage da plataforma", async () => {
    const imageUrl = buildPublicUploadUrl("legit.jpg");

    await createPost({
      body: "Foto do achado",
      images: [imageUrl],
    });

    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          images: [imageUrl],
        }),
      })
    );
  });

  it("rejeita post com imagem externa", async () => {
    await expect(
      createPost({
        body: "Post malicioso",
        images: ["https://evil.example/track.gif"],
      })
    ).rejects.toThrow("Use apenas imagens enviadas pela plataforma.");
    expect(prisma.post.create).not.toHaveBeenCalled();
  });

  it("aceita perfil com avatar do storage; rejeita externo", async () => {
    const avatarUrl = "/uploads/avatar.webp";

    await updateProfile({
      displayName: "Dr. Teste",
      avatarUrl,
    });

    expect(prisma.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ avatarUrl }),
      })
    );

    await expect(
      updateProfile({
        displayName: "Dr. Teste",
        avatarUrl: "https://evil.example/a.jpg",
      })
    ).rejects.toThrow("Use apenas imagens enviadas pela plataforma.");
  });
});
