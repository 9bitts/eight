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
      suspended?: boolean;
      doctor8Verified?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    handle?: string;
    verified?: boolean;
    verificationStatus?: VerificationStatus;
    isAdmin?: boolean;
    profileId?: string;
    sessionVersion?: number;
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
    suspended?: boolean;
    doctor8Verified?: boolean;
    doctor8Role?: string;
    sessionVersion?: number;
  }
}
