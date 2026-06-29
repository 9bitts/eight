"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";

const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";
const BLUE = "#176a88";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushNotificationSection({
  vapidPublicKey,
  pushSubscribed,
  notifyEmail,
  onEmailToggle,
}: {
  vapidPublicKey: string | null;
  pushSubscribed: boolean;
  notifyEmail: boolean;
  onEmailToggle: (next: boolean) => void;
}) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(pushSubscribed);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  const enablePush = () => {
    if (!vapidPublicKey) {
      setMsg("Push ainda não configurado no servidor.");
      return;
    }
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setMsg("Seu navegador não suporta notificações push.");
      return;
    }

    startTransition(async () => {
      setMsg("");
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setMsg("Permissão negada. Ative nas configurações do navegador.");
          return;
        }

        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });
        }

        const json = sub.toJSON();
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });
        if (!res.ok) throw new Error("Falha ao registrar push");
        setSubscribed(true);
        setMsg("Notificações push ativadas.");
        router.refresh();
      } catch {
        setMsg("Não foi possível ativar push neste dispositivo.");
      }
    });
  };

  const disablePush = () => {
    startTransition(async () => {
      setMsg("");
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setSubscribed(false);
        setMsg("Push desativado neste dispositivo.");
        router.refresh();
      } catch {
        setMsg("Erro ao desativar push.");
      }
    });
  };

  return (
    <section className="py-4 border-b" style={{ borderColor: LINE }}>
      <h2 className="px-4 pb-2" style={{ fontWeight: 700, fontSize: 16, color: INK }}>
        Alertas externos
      </h2>

      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderTop: `1px solid ${LINE}` }}
      >
        <div>
          <p style={{ fontSize: 15, color: INK }}>Notificações push (celular/PC)</p>
          <p style={{ fontSize: 13, color: MUTED }}>
            {subscribed ? "Ativo neste dispositivo" : "Receba alertas mesmo com o app fechado"}
          </p>
        </div>
        <button
          type="button"
          onClick={subscribed ? disablePush : enablePush}
          disabled={pending || !vapidPublicKey}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold"
          style={{
            fontSize: 13,
            border: `1px solid ${LINE}`,
            background: subscribed ? "var(--eight-nav-active)" : "var(--eight-card-bg)",
            color: BLUE,
            cursor: pending ? "wait" : "pointer",
          }}
        >
          {subscribed ? <BellOff size={16} /> : <Bell size={16} />}
          {pending ? "…" : subscribed ? "Desativar" : "Ativar"}
        </button>
      </div>

      <label
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        style={{ borderTop: `1px solid ${LINE}` }}
      >
        <div>
          <span style={{ fontSize: 15, color: INK }}>E-mail de atividade</span>
          <p style={{ fontSize: 13, color: MUTED }}>
            Resumo por e-mail (segue as preferências acima)
          </p>
        </div>
        <input
          type="checkbox"
          checked={notifyEmail}
          disabled={pending}
          onChange={() => onEmailToggle(!notifyEmail)}
          style={{ width: 18, height: 18, accentColor: BLUE }}
        />
      </label>

      {msg && (
        <p className="px-4 pt-2" style={{ fontSize: 13, color: MUTED }}>
          {msg}
        </p>
      )}
    </section>
  );
}
