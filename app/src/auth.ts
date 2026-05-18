import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ldapAuthenticate } from "@/lib/ldap";
import {
  configureLoginLockout,
  isLockedOut,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/login-lockout";
import { getSiteSecurity, isEmailDomainAllowed } from "@/lib/site-security";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      source: "LOCAL" | "LDAP";
    } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
    source?: "LOCAL" | "LDAP";
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string;
    role?: Role;
    source?: "LOCAL" | "LDAP";
  }
}

// Constant-time-ish minimum work even on bad credentials, so the
// timing of a "no such user" vs "wrong password" path is hard to distinguish.
const DUMMY_HASH = "$2a$10$1234567890abcdefghijkuJZUUwIH3rITV7m0w7BNwoxhsr5Cf4Sve";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const identifier = String(creds?.identifier ?? "").trim().toLowerCase();
        const password = String(creds?.password ?? "");
        if (!identifier || !password) return null;

        const sec = await getSiteSecurity();
        configureLoginLockout({
          maxFailures: sec.loginMaxFailures,
          cooldownMinutes: sec.loginCooldownMinutes,
        });
        if (isLockedOut(identifier)) return null;

        // 1. Local user lookup (always run the hash compare, even if the user
        //    doesn't exist, to keep timing uniform).
        const local = await prisma.user.findFirst({
          where: { OR: [{ email: identifier }, { username: identifier }] },
        });

        const hashToCheck = local?.passwordHash ?? DUMMY_HASH;
        const passwordOk = await bcrypt.compare(password, hashToCheck);

        if (local && local.isActive && local.passwordHash && passwordOk) {
          recordLoginSuccess(identifier);
          await prisma.user.update({
            where: { id: local.id },
            data: { lastLoginAt: new Date() },
          });
          return {
            id: local.id,
            name: local.name,
            email: local.email,
            role: local.role,
            source: local.source,
          };
        }

        // 2. LDAP fallback if configured & enabled
        const cfg = await prisma.ldapConfig.findUnique({ where: { id: 1 } });
        if (cfg?.enabled) {
          const u = identifier.includes("@") ? identifier.split("@")[0] : identifier;
          const ldapUser = await ldapAuthenticate(cfg, u, password);
          if (ldapUser) {
            if (!isEmailDomainAllowed(ldapUser.email.toLowerCase(), sec)) {
              recordLoginFailure(identifier);
              return null;
            }
            const user = await prisma.user.upsert({
              where: { email: ldapUser.email.toLowerCase() },
              update: {
                name: ldapUser.name,
                username: ldapUser.username,
                department: ldapUser.department,
                jobTitle: ldapUser.jobTitle,
                source: "LDAP",
                isActive: true,
                lastLoginAt: new Date(),
              },
              create: {
                email: ldapUser.email.toLowerCase(),
                username: ldapUser.username,
                name: ldapUser.name,
                department: ldapUser.department,
                jobTitle: ldapUser.jobTitle,
                source: "LDAP",
                role: cfg.defaultRole,
                lastLoginAt: new Date(),
              },
            });
            recordLoginSuccess(identifier);
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              source: user.source,
            };
          }
        }

        recordLoginFailure(identifier);
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id as string;
        token.role = user.role;
        token.source = user.source;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.uid as string | undefined) ?? "";
        session.user.role = ((token.role as Role | undefined) ?? "USER") as Role;
        session.user.source = ((token.source as "LOCAL" | "LDAP" | undefined) ?? "LOCAL");
      }
      return session;
    },
  },
});
