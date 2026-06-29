import type { DefaultSession } from "next-auth";
import type { VerificationStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      handle?: string;
      verified?: boolean;
      verificationStatus?: VerificationStatus;
      isAdmin?: boolean;
      profileId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    handle?: string;
    verified?: boolean;
    verificationStatus?: VerificationStatus;
    isAdmin?: boolean;
    profileId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    handle?: string;
    verified?: boolean;
    verificationStatus?: VerificationStatus;
    isAdmin?: boolean;
    profileId?: string;
  }
}
