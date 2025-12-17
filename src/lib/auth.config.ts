import { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";

async function refreshWrikeAccessToken(token: JWT): Promise<JWT> {
    try {
        const params = new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: token.refreshToken as string,
            client_id: process.env.WRIKE_CLIENT_ID!,
            client_secret: process.env.WRIKE_CLIENT_SECRET!,
            scope: "wsReadOnly,amReadOnlyUser,amReadOnlyGroup"
        });
        const response = await fetch("https://login.wrike.com/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params,
        });

        const refreshedTokens = await response.json();

        if (!response.ok) {
            throw refreshedTokens;
        }

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        };
    } catch (error) {
        console.log("Error refreshing Wrike access token:", error);
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}

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
                params: { response_type: "code", scope: "wsReadOnly,amReadOnlyUser,amReadOnlyGroup" },
            },
            token: {
                async request(context) {
                    const redirectUri = "https://wrike.tmcarobotics.com/api/auth/callback/wrike";

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
                    // console.log("🔍 Wrike token exchange response:", data);

                    if (!response.ok || !data.access_token) {
                        throw new Error(data.error_description || "Failed to fetch access token");
                    }

                    return { tokens: data };
                },
            },
            userinfo: {
                url: "https://www.wrike.com/api/v4/contacts?me=true",
                async request({ tokens }) {
                    // console.log("🔍 Wrike token prefetch:", tokens)
                    const res = await fetch("https://www.wrike.com/api/v4/contacts?me=true", {
                        headers: {
                            Authorization: `Bearer ${tokens.access_token}`,
                        },
                    })
                    const data = await res.json()
                    // console.log("🔍 Wrike userinfo response:", data);
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
        async jwt({ token, account, user }): Promise<JWT> {
            if (account) {
                // These rely on your provider actually returning these!
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000;
                token.wrikeUserId = user.id
            }

            const expires = token.accessTokenExpires as number;
            if (Date.now() > expires - 60 * 1000) { // Refresh 1 minute before expiry
                return refreshWrikeAccessToken(token);
            }

            return token;
        },

        async session({ session, token }) {
            if (token.error) {
                session.error = token.error
            }

            if (token.wrikeUserId) {
                session.user.id = token.wrikeUserId as string;
            }

            return session;
        },
    }
};
