import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma, connectDB, disconnectDB, checkDBConnection } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { generateTwoFactorCode } from '@/lib/2fa';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Ensure database connection
          await connectDB();
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            throw new Error("No user found with this email");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          throw error;
        } finally {
          // Don't disconnect here as it might affect other operations
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google') {
        // Validate email domain
        if (!profile.email.endsWith('@rub.edu.bt')) {
          return false;
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email }
        });

        if (!existingUser) {
          // Create new user from Google profile
          const studentId = profile.email.split('@')[0];
          await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name,
              studentId,
              password: '', // Will be set on first login
              department: '', // To be updated by user
              yearOfStudy: 1, // Default value
              gender: 'Male', // Default value
              role: 'STUDENT',
              emailVerified: new Date(),
            }
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// Add health check endpoint
export async function GET(req) {
  if (req.nextUrl.pathname === '/api/auth/health') {
    const isHealthy = await checkDBConnection();
    return new Response(JSON.stringify({ status: isHealthy ? 'healthy' : 'unhealthy' }), {
      status: isHealthy ? 200 : 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return handler(req);
}

export { handler as POST };