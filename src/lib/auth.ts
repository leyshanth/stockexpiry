import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import pool from "@/lib/db";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [credentials.email]
          );

          const user = result.rows[0];

          if (!user) {
            console.log("No user found with this email");
            return null;
          }

          const passwordMatch = await compare(credentials.password, user.password);

          if (!passwordMatch) {
            console.log("Password does not match");
            return null;
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name
          };
        } catch (error) {
          console.error("Error in authorize function:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  debug: process.env.NODE_ENV === "development",
}; 