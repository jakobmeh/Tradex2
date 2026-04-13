import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      workspaceId: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    workspaceId?: string | null;
  }
}
