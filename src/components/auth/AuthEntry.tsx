"use client";

import { Doctor8LoginButton } from "@/components/auth/Doctor8LoginButton";

export function AuthEntry() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 360 }}>
      <Doctor8LoginButton callbackUrl="/feed" fullWidth />
    </div>
  );
}
