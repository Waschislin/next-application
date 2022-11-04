import { query as q } from "faunadb";
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { fauna } from "../../../services/fauna";

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn(user) {
      const { user: email } = user;
      try {
        await fauna.query(
          q.If(
            q.Not(
              q.Exists(
                q.Match(q.Index("user_by_email"), q.Casefold(email.email))
              )
            ),
            q.Create(q.Collection("users"), { data: { email: email.email } }),
            q.Get(q.Match(q.Index("user_by_email"), q.Casefold(email.email)))
          )
        );
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
  },
});
