"use client";

import { Doctor8LoginButton } from "@/components/auth/Doctor8LoginButton";

export function AuthEntry() {
  return <Doctor8LoginButton callbackUrl="/feed" />;
}
