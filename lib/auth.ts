import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// IMPORTANT: Prisma is imported dynamically inside authorize() only.
// This prevents the Prisma client (Node-only) from being bundled into Edge Runtime middleware.
async function getPrisma() {
  const { prisma } = await import("./prisma");
  return prisma;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const prisma = await getPrisma();
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orcid: user.orcid,
          // Do NOT return avatar here — base64 images are too large for JWT cookies
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.orcid = (user as any).orcid;
        // avatar is intentionally not stored in the JWT (too large)
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).orcid = token.orcid as string | undefined;
        // avatar is loaded from the database on the client side (not from JWT)
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});