// import { } from './syncApp'
import { syncWrikeData } from "./jobs/wrikeSync";


export function register() {
  (async () => {
    console.log('Running init code')
    await syncWrikeData();
    console.log("Initial sync complete. Cron job scheduled every 15 minutes.");
  })();
}