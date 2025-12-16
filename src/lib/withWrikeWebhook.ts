// lib/withWrikeWebhook.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export type WrikeWebhookHandler<TBody> = (
    body: TBody,
    req: NextRequest
) => Promise<NextResponse>;

export function withWrikeWebhook<TBody>(handler: WrikeWebhookHandler<TBody>) {
    return async (req: NextRequest) => {
        const secret = process.env.WRIKE_WEBHOOK_SECRET!;
        const challenge = req.headers.get("x-hook-secret"); // can be null

        // === 1. HANDLE VERIFICATION REQUEST (handshake) ===
        try {
            const cloned = req.clone();
            const json = await cloned.json();
            if (json.requestType === "WebHook secret verification" && challenge) {
                const signature = crypto
                    .createHmac("sha256", secret)
                    .update(challenge)           // ← sign the challenge, NOT the body
                    .digest("base64");

                return new NextResponse("OK", {
                    status: 200,
                    headers: {
                        "Content-Type": "text/plain",
                        "X-Hook-Secret": signature,   // ← THIS IS REQUIRED
                    },
                });
            }
        } catch {
            // Not a JSON body → not a verification request
        }

        // === 2. NORMAL EVENT (after handshake succeeded) ===
        const bodyText = await req.text();

        if (challenge) {
            const expected = crypto
                .createHmac("sha256", secret)
                .update(bodyText)
                .digest("base64");   // ← base64, not hex

            if (challenge !== expected) {
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }

        let parsed: TBody;
        try {
            parsed = JSON.parse(bodyText) as TBody;
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        try {
            return await handler(parsed, req);
        } catch (err) {
            console.error("Wrike webhook handler failed:", err);
            return NextResponse.json({ error: "Internal error" }, { status: 500 });
        }
    };
}