import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// Ensure you have a callback URL for your Google provider set up in Google Cloud Console
export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      // You can set a specific authorization URL or other options if needed
      authorization: {
        params: {
          prompt: 'consent', // Ensure that Google prompts for consent
        },
      },
    }),
  ],
  // Optional: Callbacks for customizing the sign-in behavior
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token; // Store access token if needed
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken; // Attach access token to session
      return session;
    },
  },
  // Optional: Define pages for customizing the UI
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
    error: '/auth/error', // Error page for failed sign-ins
  },
  // Optional: Configure session strategy and expiration
  session: {
    strategy: 'jwt', // Use JWT for session handling
    maxAge: 30 * 24 * 60 * 60, // Session expiration (30 days)
  },
  // Optional: Events for tracking sign-in events
  events: {
    signIn(message) { /* Add logging or other actions here */ },
    signOut(message) { /* Add logging or other actions here */ },
  },
  // Optional: Enable debug mode for development
  debug: process.env.NODE_ENV === 'development', // Log debug information during development
});
