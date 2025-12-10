import { NextResponse } from "next/server";
import { withWrikeWebhook } from "@/lib/withWrikeWebhook";
import { CustomFieldChangedPayload} from "../types";

async function handler(body: CustomFieldChangedPayload) {
    // 1. use task id to fetch created task from wrike
    // 2. get task parendid
    // 3. try to load parent from db 
    // 4. map task to parent
    console.log('Received event from wrike!')
    console.log(body);

    return NextResponse.json({ ok: true });
}

export const POST = withWrikeWebhook<CustomFieldChangedPayload>(handler);