import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function verifyWrikeSignature(req: NextRequest, bodyText: string) {
    const signature = req.headers.get("X-Hook-Secret");
    const secret = process.env.WRIKE_WEBHOOK_SECRET!;
    const expected = crypto
        .createHmac("sha256", secret)
        .update(bodyText)
        .digest("hex");

    return signature === expected;
}

export type WrikeWebhookHandler<TBody> = (
    body: TBody,
    req: NextRequest
) => Promise<NextResponse>;

export function withWrikeWebhook<TBody>(
    handler: WrikeWebhookHandler<TBody>
) {
    return async (req: NextRequest) => {
        const bodyText = await req.text();

        if (!verifyWrikeSignature(req, bodyText)) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const parsed = JSON.parse(bodyText) as TBody;

        try {
            return await handler(parsed, req);
        } catch (err) {
            console.error("Wrike webhook failed:", err);
            return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        }
    };
}
