"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Home, Search, Bell, Mail, User, Settings, Sparkles,
  Heart, MessageCircle, Repeat2, Share, BadgeCheck,
  Image as ImageIcon, Globe, TrendingUp, MoreHorizontal,
} from "lucide-react";
import { SEED_POSTS, SUGGESTIONS, TRENDS, type FeedPost } from "@/lib/data";

const BLUE = "#176a88";
const ORANGE = "#e05930";
const INK = "#0c2b36";
const BG = "#f7f9fa";
const LINE = "#e4ebee";

const AV = ["#176a88", "#e05930", "#3a8fa8", "#c8492a", "#1f7a96", "#0f4d63"];
function avatarColor(name: string) {
  let s = 0;
  for (let i = 0; i < name.length; i++) s += name.charCodeAt(i);
  return AV[s % AV.length];
}
function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: avatarColor(name), color: "#fff", fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36,
    }}>
      {initials(name)}
    </div>
  );
}

function LogoMark() {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <svg width="30" height="30" viewBox="0 0 40 40">
        <circle cx="20" cy="12.5" r="8.5" fill="none" stroke={BLUE} strokeWidth="3.6" />
        <circle cx="20" cy="27.5" r="8.5" fill="none" stroke={ORANGE} strokeWidth="3.6" />
      </svg>
      <span style={{ fontWeight: 800, fontSize: 21, color: INK, letterSpacing: "-0.03em" }}>eight</span>
    </div>
  );
}

function NavItem({ icon: Icon, label, active }: { icon: any; label: string; active?: boolean }) {
  return (
    <button
      className="flex items-center gap-4 px-4 py-3 rounded-full w-full text-left transition-colors"
      style={{
        color: active ? INK : "#516b75",
        fontWeight: active ? 700 : 500,
        background: active ? "#eaf1f4" : "transparent",
        fontSize: 17,
      }}
    >
      <Icon size={23} strokeWidth={active ? 2.4 : 2} />
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

function ActionBtn({ icon: Icon, count, color, active, onClick, fill }:
  { icon: any; count: number; color: string; active?: boolean; onClick?: () => void; fill?: boolean }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 transition-colors"
      style={{ color: active ? color : "#6b818b", fontSize: 13.5 }}>
      <span className="p-1.5 rounded-full">
        <Icon size={18} strokeWidth={2} fill={active && fill ? color : "none"} />
      </span>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}

function PostCard({ post, onLike, onRepost }:
  { post: FeedPost; onLike: (id: number) => void; onRepost: (id: number) => void }) {
  return (
    <article className="flex gap-3 px-4 py-4 border-b" style={{ borderColor: LINE }}>
      <Avatar name={post.name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span style={{ fontWeight: 700, color: INK }}>{post.name}</span>
          <BadgeCheck size={17} style={{ color: BLUE }} fill={BLUE} stroke="#fff" />
          <span style={{ color: "#7a8f97", fontSize: 14 }}>@{post.handle} · {post.time}</span>
          <span className="ml-auto" style={{ color: "#9fb0b6" }}><MoreHorizontal size={17} /></span>
        </div>
        <div className="flex items-center gap-1 mt-0.5 mb-1.5" style={{ fontSize: 12.5, color: ORANGE, fontWeight: 600 }}>
          <span style={{ background: "#fbe5dd", padding: "1px 8px", borderRadius: 99 }}>{post.spec}</span>
          <span style={{ color: "#9fb0b6", display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 4 }}>
            <Globe size={12} /> {post.loc}
          </span>
        </div>
        <p style={{ color: "#1b3a45", fontSize: 15.5, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{post.body}</p>
        <div className="flex items-center justify-between mt-3" style={{ maxWidth: 360 }}>
          <ActionBtn icon={MessageCircle} count={post.replies} color={BLUE} />
          <ActionBtn icon={Repeat2} count={post.reposts} color="#1a9c5b" active={post.reposted} onClick={() => onRepost(post.id)} />
          <ActionBtn icon={Heart} count={post.likes} color={ORANGE} active={post.liked} fill onClick={() => onLike(post.id)} />
          <ActionBtn icon={Share} count={0} color={BLUE} />
        </div>
      </div>
    </article>
  );
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>(SEED_POSTS);
  const [draft, setDraft] = useState("");
  const [following, setFollowing] = useState<Record<string, boolean>>({});

  const publish = () => {
    if (!draft.trim()) return;
    const newPost: FeedPost = {
      id: Date.now(), name: "Dr. Diego Albuquerque", handle: "diego",
      spec: "Fundador · eight", loc: "Global", time: "agora",
      liked: false, likes: 0, reposts: 0, replies: 0, body: draft.trim(),
    };
    setPosts([newPost, ...posts]);
    setDraft("");
  };
  const onLike = (id: number) => setPosts(posts.map((p) =>
    p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p));
  const onRepost = (id: number) => setPosts(posts.map((p) =>
    p.id === id ? { ...p, reposted: !p.reposted, reposts: p.reposts + (p.reposted ? -1 : 1) } : p));

  return (
    <div style={{ background: BG, minHeight: "100vh", color: INK }}>
      <div className="mx-auto flex" style={{ maxWidth: 1280 }}>

        {/* LEFT NAV */}
        <aside className="hidden sm:flex flex-col sticky top-0 h-screen px-2 py-2"
          style={{ width: 88, borderRight: `1px solid ${LINE}`, background: BG }}>
          <div className="xl:w-64 flex flex-col h-full">
            <Link href="/"><LogoMark /></Link>
            <nav className="flex flex-col gap-1 mt-2">
              <NavItem icon={Home} label="Início" active />
              <NavItem icon={Search} label="Explorar" />
              <NavItem icon={Bell} label="Notificações" />
              <NavItem icon={Mail} label="Mensagens" />
              <NavItem icon={Sparkles} label="Casos clínicos" />
              <NavItem icon={User} label="Perfil" />
              <NavItem icon={Settings} label="Configurações" />
            </nav>
            <button onClick={() => document.getElementById("composer")?.focus()}
              className="mt-4 rounded-full py-3 px-4 font-bold transition-transform hover:-translate-y-0.5"
              style={{ background: ORANGE, color: "#fff", fontSize: 16, boxShadow: "0 8px 20px -8px rgba(224,89,48,.6)" }}>
              <span className="hidden xl:inline">Publicar</span>
              <span className="xl:hidden">+</span>
            </button>
            <div className="mt-auto flex items-center gap-2 p-2 rounded-full">
              <Avatar name="Diego Albuquerque" size={38} />
              <div className="hidden xl:block leading-tight">
                <div style={{ fontWeight: 700, fontSize: 14 }}>Dr. Diego A.</div>
                <div style={{ color: "#7a8f97", fontSize: 13 }}>@diego</div>
              </div>
            </div>
          </div>
        </aside>

        {/* FEED */}
        <main className="flex-1 min-w-0" style={{ borderRight: `1px solid ${LINE}`, maxWidth: 620, background: "#fff" }}>
          <div className="sticky top-0 z-10 px-4 py-3" style={{ background: "rgba(255,255,255,.9)", borderBottom: `1px solid ${LINE}` }}>
            <h1 style={{ fontWeight: 800, fontSize: 20 }}>Início</h1>
            <p style={{ color: "#7a8f97", fontSize: 13 }}>A rede dos profissionais de saúde</p>
          </div>

          <div className="flex gap-3 px-4 py-4 border-b" style={{ borderColor: LINE }}>
            <Avatar name="Diego Albuquerque" />
            <div className="flex-1">
              <textarea id="composer" value={draft} onChange={(e) => setDraft(e.target.value)}
                placeholder="O que você está acompanhando na sua prática?" rows={2}
                className="w-full resize-none outline-none"
                style={{ fontSize: 17, color: INK, background: "transparent", lineHeight: 1.4 }} />
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1" style={{ color: BLUE }}>
                  <ImageIcon size={20} /><Sparkles size={20} /><Globe size={20} />
                </div>
                <button onClick={publish} disabled={!draft.trim()}
                  className="rounded-full px-5 py-2 font-bold"
                  style={{ background: BLUE, color: "#fff", fontSize: 14.5, opacity: draft.trim() ? 1 : 0.4 }}>
                  Publicar
                </button>
              </div>
            </div>
          </div>

          {posts.map((p) => <PostCard key={p.id} post={p} onLike={onLike} onRepost={onRepost} />)}
        </main>

        {/* RIGHT RAIL */}
        <aside className="hidden lg:block px-5 py-4 sticky top-0 h-screen" style={{ width: 340 }}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ background: "#eef3f5", color: "#7a8f97" }}>
            <Search size={18} /><span style={{ fontSize: 14 }}>Buscar profissionais, temas…</span>
          </div>

          <div className="rounded-2xl p-4 mb-4" style={{ background: "#eaf1f4" }}>
            <div className="flex items-center gap-2 mb-1">
              <BadgeCheck size={20} style={{ color: BLUE }} fill={BLUE} stroke="#fff" />
              <span style={{ fontWeight: 700, fontSize: 15 }}>Selo verificado</span>
            </div>
            <p style={{ fontSize: 13.5, color: "#516b75", lineHeight: 1.5 }}>
              Todo perfil com selo teve o registro profissional confirmado. Aqui você sabe com quem está falando.
            </p>
          </div>

          <div className="rounded-2xl mb-4" style={{ background: "#f4f7f8" }}>
            <div className="flex items-center gap-2 px-4 pt-3 pb-1">
              <TrendingUp size={18} style={{ color: ORANGE }} />
              <h3 style={{ fontWeight: 800, fontSize: 16 }}>Em alta na saúde</h3>
            </div>
            {TRENDS.map((t) => (
              <div key={t.tag} className="px-4 py-2.5">
                <div style={{ fontWeight: 700, fontSize: 14.5, color: INK }}>{t.tag}</div>
                <div style={{ fontSize: 12.5, color: "#7a8f97" }}>{t.posts}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl" style={{ background: "#f4f7f8" }}>
            <h3 className="px-4 pt-3 pb-1" style={{ fontWeight: 800, fontSize: 16 }}>Quem seguir</h3>
            {SUGGESTIONS.map((s) => {
              const isF = following[s.handle];
              return (
                <div key={s.handle} className="flex items-center gap-2.5 px-4 py-2.5">
                  <Avatar name={s.name} size={40} />
                  <div className="flex-1 min-w-0 leading-tight">
                    <div className="flex items-center gap-1">
                      <span style={{ fontWeight: 700, fontSize: 14 }} className="truncate">{s.name}</span>
                      <BadgeCheck size={14} style={{ color: BLUE }} fill={BLUE} stroke="#fff" />
                    </div>
                    <div style={{ fontSize: 13, color: "#7a8f97" }}>{s.spec}</div>
                  </div>
                  <button onClick={() => setFollowing({ ...following, [s.handle]: !isF })}
                    className="rounded-full px-4 py-1.5 font-bold"
                    style={{ fontSize: 13.5, background: isF ? "transparent" : INK, color: isF ? INK : "#fff", border: isF ? `1px solid ${LINE}` : "none" }}>
                    {isF ? "Seguindo" : "Seguir"}
                  </button>
                </div>
              );
            })}
            <div className="px-4 py-3" style={{ color: BLUE, fontSize: 14, fontWeight: 600 }}>Mostrar mais</div>
          </div>

          <p className="px-4 mt-4" style={{ fontSize: 12, color: "#9fb0b6", lineHeight: 1.5 }}>
            eight · Rede de profissionais de saúde · pt · en · es
          </p>
        </aside>
      </div>
    </div>
  );
}
