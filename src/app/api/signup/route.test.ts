import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { inviteRequired } from "@/lib/invites";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    clientIp: vi.fn(() => "203.0.113.1"),
    rateLimit: vi.fn(),
  };
});

vi.mock("@/lib/invites", () => ({
  inviteRequired: vi.fn(() => false),
  validateInvite: vi.fn(),
  createUserWithInvite: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async () => "hashed-password"),
  },
}));

const validBody = {
  displayName: "Ana Silva",
  email: "ana.nova@demo.eight",
  password: "senha-segura",
  handle: "anasilva",
  specialty: "Cardiologia",
  registrationType: "CRM",
  registrationNumber: "123456",
  registrationCountry: "BR",
  location: "São Paulo",
};

function signupRequest(body: Record<string, unknown> = validBody) {
  return new Request("http://localhost/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
    vi.mocked(inviteRequired).mockReturnValue(false);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "user-1",
      profile: { handle: "anasilva" },
    } as never);
  });

  it("cria conta com dados validos", async () => {
    const res = await POST(signupRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true, userId: "user-1", handle: "anasilva" });
    expect(prisma.user.create).toHaveBeenCalledOnce();
  });

  it("rejeita e-mail duplicado", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "existing" } as never);

    const res = await POST(signupRequest());
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toContain("e-mail já está em uso");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejeita handle duplicado", async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({ id: "p1" } as never);

    const res = await POST(signupRequest());
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toContain("@nome já está em uso");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejeita senha fraca", async () => {
    const res = await POST(signupRequest({ ...validBody, password: "123" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("8 caracteres");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("retorna 429 quando rate limit estoura", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 45 });

    const res = await POST(signupRequest());
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error).toContain("Aguarde 45s");
    expect(res.headers.get("Retry-After")).toBe("45");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
