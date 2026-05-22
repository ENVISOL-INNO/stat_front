import { NuxtAuthHandler } from '#auth'
import Auth0Provider from "next-auth/providers/auth0";

console.log("hello??", useRuntimeConfig().authSecret)

export default NuxtAuthHandler({
    // A secret string you define, to ensure correct encryption
    secret: useRuntimeConfig().authSecret,
    providers: [
        Auth0Provider.default({    // .default() is correct from the doc
            clientId: useRuntimeConfig().public.client_id,
            clientSecret: useRuntimeConfig().public.client_secret,
            issuer: useRuntimeConfig().public.issuer,    // this must be the full url (with https://)
            wellKnown: useRuntimeConfig().public.issuer + ".well-known/openid-configuration",   // this is necessary for some obscure reason https://github.com/nextauthjs/next-auth/issues/7591
            authorizationParams: {prompt: "login"}
        })
    ],
    // callbacks: {
    //     jwt({ token, account, profile }) {
    //       if (account) {
    //         token.sessionToken = account.session_token
    //       }
    //       return token
    //     },
    //     // async session({ session, token }) {
    //     //     // Token we injected into the JWT callback above.
    //     //     const token = token.sessionToken
    //     //     // Fetch data OR add previous data from the JWT callback.
    //     //     const additionalUserData = await $fetch(`/api/session/${token}`)
    //     //     // Return the modified session
    //     //     return {
    //     //       ...session,
    //     //       user: {
    //     //         name: additionalUserData.name,
    //     //         avatar: additionalUserData.avatar,
    //     //         role: additionalUserData.role
    //     //       }
    //     //     }
    //     //   },
    // }
})