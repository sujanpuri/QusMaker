import NextAuth, { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import clientPromise from "@/lib/mongodb"

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60, // 1 year (effectively no expiration)
  },
  callbacks: {
    async signIn({ user, account }) {
      try {
        const client = await clientPromise
        const db = client.db("QusMaker") // Database name
        const usersCollection = db.collection("users")

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email: user.email })

        if (!existingUser) {
          // Save new user to database
          await usersCollection.insertOne({
            name: user.name,
            email: user.email,
            image: user.image,
            googleId: account?.providerAccountId,
            provider: account?.provider,
            createdAt: new Date(),
            lastLogin: new Date(),
          })
          console.log("New user saved to database")
        } else {
          // Update existing user
          await usersCollection.updateOne(
            { email: user.email },
            { 
              $set: { 
                lastLogin: new Date(),
                name: user.name,
                image: user.image,
              } 
            }
          )
          console.log("Existing user updated")
        }

        return true // Allow sign in
      } catch (error) {
        console.error("Error saving user to database:", error)
        return false // Reject sign in on error
      }
    },
    
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    
    async session({ session, token }) {
      // Add user info to session from token
      if (session.user) {
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    },
  },
  pages: {
    signIn: '/signin',  // Your custom sign-in page
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }