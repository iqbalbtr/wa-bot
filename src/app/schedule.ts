import db from "../database";
import { schedules as scheduleTable } from "../database/schema";
import { CronJob } from "cron";
import client from "./bot";

let activeSchedules: CronJob[] = [];

async function loadAndStartSchedules() {
    const scheduleData = await db.select().from(scheduleTable);
    console.log(`[Scheduler] Starting with ${scheduleData.length} tasks`);

    const newSchedules: CronJob[] = [];


    for (const schedule of scheduleData) {
        
        const job = new CronJob(schedule.scheduled_time, async () => {

            if (client.isLoggedIn) {
                for(const target of schedule.contact_ids){
                    client.sendMessage(target, schedule.message)
                }
            }

        });

        job.start();
        newSchedules.push(job);
    }

    activeSchedules = newSchedules;
}


const dailyRefreshJob = new CronJob("0 0 * * *", async () => {
    console.log("[Scheduler] Refreshing schedules...");

    stopAllSchedules();
    await loadAndStartSchedules();
});

export async function refreshSchedules() {
    console.log("[Scheduler] Manual refresh triggered");

    dailyRefreshJob.stop();
    stopAllSchedules();

    await loadAndStartSchedules();
    dailyRefreshJob.start();
}


export default async function initializeSchedules() {
    await loadAndStartSchedules();
    dailyRefreshJob.start();
}

function stopAllSchedules() {
    for (const job of activeSchedules) {
        job.stop();
    }
}
