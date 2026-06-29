"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { CURATED_SPECIALTIES } from "@/lib/discovery";
import { updateProfile } from "@/lib/actions/profile";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";
const CARD = "var(--eight-card-bg)";
const BLUE = "#176a88";

export type ProfileEditData = {
  displayName: string;
  bio: string | null;
  specialty: string | null;
  location: string | null;
  teleconsultUrl: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  handle: string;
};

export function EditProfileSection({ profile }: { profile: ProfileEditData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    displayName: profile.displayName,
    bio: profile.bio ?? "",
    specialty: profile.specialty ?? "",
    location: profile.location ?? "",
    teleconsultUrl: profile.teleconsultUrl ?? "",
    avatarUrl: profile.avatarUrl,
    bannerUrl: profile.bannerUrl,
  });

  const upload = async (file: File, field: "avatarUrl" | "bannerUrl") => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Falha no upload");
    setForm((f) => ({ ...f, [field]: data.url }));
  };

  const onSave = () => {
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await updateProfile({
          displayName: form.displayName,
          bio: form.bio,
          specialty: form.specialty,
          location: form.location,
          teleconsultUrl: form.teleconsultUrl,
          avatarUrl: form.avatarUrl,
          bannerUrl: form.bannerUrl,
        });
        setSaved(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar.");
      }
    });
  };

  return (
    <section className="py-4 border-b" style={{ borderColor: LINE }}>
      <h2 className="px-4 pb-2" style={{ fontWeight: 700, fontSize: 16, color: INK }}>
        Editar perfil
      </h2>
      <div className="px-4 space-y-3">
        <div
          className="relative rounded-xl overflow-hidden"
          style={{ height: 100, background: form.bannerUrl ? `url(${form.bannerUrl}) center/cover` : `linear-gradient(135deg, ${BLUE}, #0c2b36)` }}
        >
          <label
            className="absolute bottom-2 right-2 rounded-full px-3 py-1 text-xs font-bold cursor-pointer"
            style={{ background: "rgba(0,0,0,.5)", color: "#fff" }}
          >
            Banner
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) startTransition(() => upload(f, "bannerUrl").catch((err) => setError(String(err))));
              }}
            />
          </label>
        </div>

        <div className="flex items-end gap-3 -mt-8 relative z-10">
          <div style={{ border: `3px solid ${CARD}`, borderRadius: "50%" }}>
            <Avatar name={form.displayName} size={72} imageUrl={form.avatarUrl} />
          </div>
          <label
            className="rounded-full px-3 py-1.5 text-xs font-bold cursor-pointer mb-1"
            style={{ border: `1px solid ${LINE}`, background: CARD, color: INK }}
          >
            Foto
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) startTransition(() => upload(f, "avatarUrl").catch((err) => setError(String(err))));
              }}
            />
          </label>
        </div>

        <div>
          <label className="signup-label">Nome</label>
          <input
            className="field w-full"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            maxLength={50}
          />
        </div>
        <div>
          <label className="signup-label">@{profile.handle}</label>
          <p style={{ fontSize: 12, color: MUTED }}>O @handle não pode ser alterado aqui.</p>
        </div>
        <div>
          <label className="signup-label">Bio</label>
          <textarea
            className="field w-full"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            maxLength={160}
          />
        </div>
        <div>
          <label className="signup-label">Especialidade</label>
          <select
            className="field w-full"
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
          >
            <option value="">—</option>
            {CURATED_SPECIALTIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="signup-label">Localização</label>
          <input
            className="field w-full"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="São Paulo, BR"
          />
        </div>
        <div>
          <label className="signup-label">Link teleconsulta Doctor8</label>
          <input
            className="field w-full"
            value={form.teleconsultUrl}
            onChange={(e) => setForm({ ...form, teleconsultUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>

        {error && <p style={{ color: "#e05930", fontSize: 13 }}>{error}</p>}
        {saved && <p style={{ color: "#1a9c5b", fontSize: 13 }}>Perfil salvo.</p>}

        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="rounded-full px-5 py-2 font-bold text-white"
          style={{ background: BLUE, border: "none", cursor: "pointer", opacity: pending ? 0.6 : 1 }}
        >
          {pending ? "Salvando…" : "Salvar perfil"}
        </button>
      </div>
    </section>
  );
}
