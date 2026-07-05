import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPost, editPost } from "@/lib/actions";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return { ...actual, rateLimit: vi.fn(async () => ({ ok: true })) };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    post: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    postEdit: { create: vi.fn() },
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
const VALID_SHORT = "Mesmo achado aqui";
const VALID_LONG =
  "Adulto de 45 anos, sexo masculino, com evolução favorável e conduta mantida.";
const CPF_SNIPPET = "Verificar documento 123.456.789-00 na alta.";

function mockSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { profileId: PROFILE_ID },
  } as never);
  vi.mocked(prisma.profile.findUnique).mockResolvedValue({
    suspended: false,
  } as never);
}

function mockThreadLookup() {
  vi.mocked(prisma.post.findUnique).mockImplementation(async ({ where, select }) => {
    const id = where.id as string;
    const chain: Record<string, { isClinicalCase: boolean; parentId: string | null }> = {
      "case-1": { isClinicalCase: true, parentId: null },
      "reply-1": { isClinicalCase: false, parentId: "case-1" },
      "reply-2": { isClinicalCase: false, parentId: "reply-1" },
      "normal-1": { isClinicalCase: false, parentId: null },
    };
    const row = chain[id];
    if (!row) return null;

    if (select && "authorId" in select) {
      return { ...row, authorId: PROFILE_ID, body: "antes", createdAt: new Date() } as never;
    }
    return row as never;
  });
}

describe("editPost — casos clínicos vs posts comuns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession();
    vi.mocked(prisma.post.update).mockResolvedValue({} as never);
    vi.mocked(prisma.postEdit.create).mockResolvedValue({} as never);
  });

  it("rejeita edição de caso clínico com CPF", async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue({
      id: "case-1",
      authorId: PROFILE_ID,
      isClinicalCase: true,
      body: VALID_LONG,
      createdAt: new Date(),
    } as never);

    await expect(editPost("case-1", CPF_SNIPPET)).rejects.toThrow("CPF");
    expect(prisma.post.update).not.toHaveBeenCalled();
  });

  it("aceita edição de caso clínico com conteúdo válido", async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue({
      id: "case-1",
      authorId: PROFILE_ID,
      isClinicalCase: true,
      body: VALID_LONG,
      createdAt: new Date(),
    } as never);

    await editPost("case-1", VALID_LONG);
    expect(prisma.post.update).toHaveBeenCalled();
  });

  it("post comum continua usando detectPII (mesmo padrão, sem regra extra de tamanho)", async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue({
      id: "normal-1",
      authorId: PROFILE_ID,
      isClinicalCase: false,
      body: "texto anterior ok",
      createdAt: new Date(),
    } as never);

    await expect(editPost("normal-1", CPF_SNIPPET)).rejects.toThrow("CPF");
    expect(prisma.post.update).not.toHaveBeenCalled();

    await editPost("normal-1", VALID_SHORT);
    expect(prisma.post.update).toHaveBeenCalled();
  });
});

describe("createPost — respostas em thread de caso clínico", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession();
    mockThreadLookup();
    vi.mocked(prisma.post.create).mockResolvedValue({
      id: "new-reply",
      parent: { authorId: "other-profile" },
    } as never);
  });

  it("rejeita resposta direta ao caso com CPF", async () => {
    await expect(createPost({ body: CPF_SNIPPET, parentId: "case-1" })).rejects.toThrow("CPF");
    expect(prisma.post.create).not.toHaveBeenCalled();
  });

  it("rejeita resposta nível 2+ na thread com telefone", async () => {
    await expect(
      createPost({ body: "Ligar (11) 98765-4321 após alta.", parentId: "reply-2" })
    ).rejects.toThrow("telefones");
    expect(prisma.post.create).not.toHaveBeenCalled();
  });

  it("aceita resposta curta legítima na thread de caso", async () => {
    await createPost({ body: VALID_SHORT, parentId: "case-1" });
    expect(prisma.post.create).toHaveBeenCalled();
  });

  it("não aplica regras de caso em resposta a post comum", async () => {
    await createPost({ body: VALID_SHORT, parentId: "normal-1" });
    expect(prisma.post.create).toHaveBeenCalled();
  });

  it("aceita post raiz comum sem parentId (composer principal)", async () => {
    await createPost({ body: "Texto simples no feed principal, sem resposta." });
    expect(prisma.post.create).toHaveBeenCalled();
  });
});
