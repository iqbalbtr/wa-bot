import db from "../database";
import { schedules as scheduleTable } from "../database/schema";
import { CronJob } from "cron";
import { MessageMedia } from "whatsapp-web.js";
import client from "../bot";

let activeSchedules: CronJob[] = [];

async function loadAndStartSchedules() {
    const scheduleData = await db.select().from(scheduleTable);
    console.log(`[Scheduler] Starting with ${scheduleData.length} tasks`);

    const newSchedules: CronJob[] = [];

    for (const schedule of scheduleData) {

        // const dateCron = parseCronTime(schedule.scheduled_time);

        // if (dateCron.month >= now.getMonth() + 1)
        //     continue;

        try {
            const job = new CronJob(schedule.scheduled_time, async () => {

                if (client.isLoggedIn) {
                    for (const target of schedule.contact_ids) {
                        try {

                            const media = schedule.attachment ? MessageMedia.fromFilePath(schedule.attachment) : undefined;

                            await client.sendMessage(target, media ? media : schedule.message, media && { caption: schedule.message })
                            
                        } catch (error) {
                            console.error(`[Scheduler] Failed to send message to ${target}:`, error);

                        }
                    }
                }

            }, null, false, 'Asia/Jakarta')

            job.start();
            newSchedules.push(job);
        } catch (error: any) {
            console.error("Schedule error =>", error.message);

        }
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

export async function activeSchduleCurrent(data: {
    message: string,
    contact_ids: string[],
    scheduled_time: string,
    attachment?: string | null | undefined
}) {
    try {

        console.log("activing new schedule");

        const job = new CronJob(data.scheduled_time, async () => {
            if (client.isLoggedIn) {
                for (const target of data.contact_ids) {
                    try {

                        const media = data.attachment ? MessageMedia.fromFilePath(data.attachment) : undefined;

                        await client.sendMessage(target, media ? media : data.message, media && { caption: data.message })
                    } catch (error) {
                        console.error(`[Scheduler] Failed to send message to ${target}:`, error);

                    }
                }
            }
        }, null, false, 'Asia/Jakarta')

        job.start()

        activeSchedules.push(job)

    } catch (error: any) {
        console.error("Schedule error =>", error.message);

    }
}