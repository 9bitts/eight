import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      handle?: string;
      verified?: boolean;
      profileId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    handle?: string;
    verified?: boolean;
    profileId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    handle?: string;
    verified?: boolean;
    profileId?: string;
  }
}
