import "dotenv/config";
import { syncWrikeData } from "./jobs/wrikeSync";
import prisma from "./lib/db";

// cron.schedule("0 */3 * * *", async () => {
//     try {
//         await syncWrikeData();
//     } catch (err) {
//         console.error("❌ Error running cron job:", err);
//     }
// });

(async () => {
    await syncWrikeData();
    console.log("Initial sync complete. Cron job scheduled every 15 minutes.");
})();

process.on("SIGINT", async () => {
    console.log("Closing DB connection...");
    await prisma.$disconnect();
    process.exit(0);
});
