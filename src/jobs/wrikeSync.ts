import { buildWrikeItemContext, buildWrikeUserContext } from './dbBuilder';

export async function syncWrikeData() {
    console.log(`[${new Date().toISOString()}] Starting Wrike sync...`);
    // await buildWrikeUserContext();
    // await buildWrikeItemContext();
    console.log(`[${new Date().toISOString()}] ✅ Sync finished.`);
}

