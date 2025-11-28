import { NextAuthOptions } from "next-auth";


export const mainAuthConfig: NextAuthOptions = {
    providers: [
        {
            id: "wrike",
            name: "Wrike",
            type: "oauth",
            clientId: process.env.WRIKE_CLIENT_ID,
            clientSecret: process.env.WRIKE_CLIENT_SECRET,
            authorization: {
                url: "https://login.wrike.com/oauth2/authorize/v4",
                params: { response_type: "code", scope: "wsReadOnly" },
            },
            token: {
                async request(context) {
                    const redirectUri = "http://localhost:3000/api/auth/callback/wrike";

                    const params = new URLSearchParams({
                        grant_type: "authorization_code",
                        code: context.params.code as string,
                        redirect_uri: redirectUri,
                        client_id: process.env.WRIKE_CLIENT_ID!,
                        client_secret: process.env.WRIKE_CLIENT_SECRET!,
                    });

                    const response = await fetch("https://login.wrike.com/oauth2/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: params,
                    });

                    const data = await response.json();
                    console.log("🔍 Wrike token exchange response:", data);

                    if (!response.ok || !data.access_token) {
                        throw new Error(data.error_description || "Failed to fetch access token");
                    }

                    return { tokens: data };
                },
            },
            userinfo: {
                url: "https://www.wrike.com/api/v4/contacts?me=true",
                async request({ tokens }) {
                    console.log("🔍 Wrike token prefetch:", tokens)
                    const res = await fetch("https://www.wrike.com/api/v4/contacts?me=true", {
                        headers: {
                            Authorization: `Bearer ${tokens.access_token}`,
                        },
                    })
                    const data = await res.json()
                    console.log("🔍 Wrike userinfo response:", data);
                    const user = data.data?.[0] ?? {}
                    return {
                        id: user.id,
                        name: `${user.firstName} ${user.lastName}`,
                        email: user.primaryEmail,
                        image: user.avatarUrl,
                    }
                },
            },
            profile(profile) {
                // this will be called if you don't define userinfo.request()
                return {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    image: profile.image,
                }
            },
        },
    ],
    callbacks: {
        async jwt({ token, account }) {
            // 🔹 First login: store tokens from provider
            if (account) {
                // These rely on your provider actually returning these!
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.accessTokenExpires =
                    Date.now() + (account.expires_in ?? 3600) * 1000;
            }

            // 🔹 (Optional) Refresh logic here if you added it
            // if (Date.now() > (token.accessTokenExpires as number)) { ... }

            return token;
        },

        async session({ session, token }) {
            // For server-only token, you DON'T need to expose it:
            // (session.user as any).accessToken = token.accessToken;
            return session;
        },
    }
};
