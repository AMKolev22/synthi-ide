
// import { handlers } from '@/app/auth';

// export const { GET, POST } = handlers;


import NextAuth, { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';

export const authConfig = {
  session: {
    strategy: 'jwt',
  },
  
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],

  pages: {
    signIn: '/login'
  },

  secret: process.env.AUTH_SECRET

};

export const GET = NextAuth(authConfig);
export const POST = NextAuth(authConfig);

