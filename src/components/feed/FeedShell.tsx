"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  Search,
  Bell,
  Mail,
  User,
  Settings,
  Sparkles,
  LogOut,
  LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import type { SessionUser } from "@/lib/types";

const BLUE = "#176a88";
const ORANGE = "#e05930";
const INK = "#0c2b36";
const BG = "#f7f9fa";
const LINE = "#e4ebee";

function LogoMark() {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <svg width="30" height="30" viewBox="0 0 40 40">
        <circle cx="20" cy="12.5" r="8.5" fill="none" stroke={BLUE} strokeWidth="3.6" />
        <circle cx="20" cy="27.5" r="8.5" fill="none" stroke={ORANGE} strokeWidth="3.6" />
      </svg>
      <span style={{ fontWeight: 800, fontSize: 21, color: INK, letterSpacing: "-0.03em" }}>
        eight
      </span>
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  badge,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
}) {
  const pathname = usePathname();
  const active =
    href === "/feed" ? pathname === "/feed" : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className="flex items-center gap-4 px-4 py-3 rounded-full w-full transition-colors relative"
      style={{
        color: active ? INK : "#516b75",
        fontWeight: active ? 700 : 500,
        background: active ? "#eaf1f4" : "transparent",
        fontSize: 17,
        textDecoration: "none",
      }}
    >
      <Icon size={23} strokeWidth={active ? 2.4 : 2} />
      <span className="hidden xl:inline">{label}</span>
      {badge != null && badge > 0 && (
        <span
          className="absolute xl:static xl:ml-auto"
          style={{
            right: 12,
            top: 10,
            background: ORANGE,
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 99,
            padding: "2px 7px",
            minWidth: 20,
            textAlign: "center",
          }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export function FeedShell({
  user,
  notificationCount,
  children,
  rightRail,
}: {
  user: SessionUser;
  notificationCount: number;
  children: React.ReactNode;
  rightRail?: React.ReactNode;
}) {
  const shortName =
    user.displayName.length > 16
      ? user.displayName.split(" ")[0]
      : user.displayName;

  return (
    <div style={{ background: BG, minHeight: "100vh", color: INK }}>
      <div className="mx-auto flex" style={{ maxWidth: 1280 }}>
        <aside
          className="hidden sm:flex flex-col sticky top-0 h-screen px-2 py-2"
          style={{ width: 88, borderRight: `1px solid ${LINE}`, background: BG }}
        >
          <div className="xl:w-64 flex flex-col h-full">
            <Link href="/feed">
              <LogoMark />
            </Link>
            <nav className="flex flex-col gap-1 mt-2">
              <NavLink href="/feed" icon={Home} label="Início" />
              <NavLink href="/explore" icon={Search} label="Explorar" />
              <NavLink href="/notifications" icon={Bell} label="Notificações" badge={notificationCount} />
              <NavLink href="/messages" icon={Mail} label="Mensagens" />
              <NavLink href="/cases" icon={Sparkles} label="Casos clínicos" />
              <NavLink href={`/${user.handle}`} icon={User} label="Perfil" />
              <NavLink href="/settings" icon={Settings} label="Configurações" />
            </nav>
            <button
              type="button"
              onClick={() => document.getElementById("composer")?.focus()}
              className="mt-4 rounded-full py-3 px-4 font-bold transition-transform hover:-translate-y-0.5"
              style={{
                background: ORANGE,
                color: "#fff",
                fontSize: 16,
                boxShadow: "0 8px 20px -8px rgba(224,89,48,.6)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span className="hidden xl:inline">Publicar</span>
              <span className="xl:hidden">+</span>
            </button>
            <div className="mt-auto flex items-center gap-2 p-2 rounded-full">
              <Link href={`/${user.handle}`}>
                <Avatar name={user.displayName} size={38} />
              </Link>
              <div className="hidden xl:block leading-tight flex-1 min-w-0">
                <Link
                  href={`/${user.handle}`}
                  style={{ fontWeight: 700, fontSize: 14, color: INK, textDecoration: "none" }}
                  className="block truncate"
                >
                  {shortName}
                </Link>
                <div style={{ color: "#7a8f97", fontSize: 13 }}>@{user.handle}</div>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sair"
                className="hidden xl:flex p-2 rounded-full"
                style={{ color: "#7a8f97", background: "transparent", border: "none", cursor: "pointer" }}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        {children}

        {rightRail && (
          <aside className="hidden lg:block px-5 py-4 sticky top-0 h-screen overflow-y-auto" style={{ width: 340 }}>
            {rightRail}
          </aside>
        )}
      </div>
    </div>
  );
}
