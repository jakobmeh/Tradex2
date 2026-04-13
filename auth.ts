import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";

const providers: Array<
  ReturnType<typeof Credentials> | ReturnType<typeof Google>
> = [
  Credentials({
    name: "Credentials",
    credentials: {
      email: {},
      password: {},
    },
    authorize: async (credentials) => {
      const validatedFields = loginSchema.safeParse(credentials);

      if (!validatedFields.success) {
        return null;
      }

      const email = validatedFields.data.email.toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user?.password) {
        return null;
      }

      if (!user.emailVerified) {
        throw new Error("Please verify your email before signing in.");
      }

      const passwordMatches = await compare(
        validatedFields.data.password,
        user.password,
      );

      if (!passwordMatches) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export async function ensureWorkspace(userId: string, userName?: string | null) {
  const existing = await prisma.workspaceMember.findFirst({
    where: { userId },
    select: { workspaceId: true },
  });

  if (existing) return existing.workspaceId;

  const workspace = await prisma.workspace.create({
    data: {
      name: `${userName ?? "My"}'s Workspace`,
      icon: "🏠",
      members: {
        create: { userId, role: "owner" },
      },
      pages: {
        create: {
          title: "Getting Started",
          icon: "👋",
          order: 0,
          blocks: {
            create: {
              type: "text",
              content: JSON.stringify({
                text: "Welcome! Press / to insert blocks.",
              }),
              order: 0,
            },
          },
        },
      },
    },
  });

  return workspace.id;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers,
  callbacks: {
    async signIn({ user }) {
      if (!user?.id) return true;
      try {
        await ensureWorkspace(user.id, user.name);
      } catch (err) {
        console.error("Failed to create workspace:", err);
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "user";
      }

      // attach workspaceId to token so session has it without a DB call
      if (token.sub && !token.workspaceId) {
        const member = await prisma.workspaceMember.findFirst({
          where: { userId: token.sub },
          select: { workspaceId: true },
        });
        token.workspaceId = member?.workspaceId ?? null;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role =
          typeof token.role === "string" ? token.role : "user";
        session.user.workspaceId =
          typeof token.workspaceId === "string" ? token.workspaceId : "";
      }

      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
