import db from "../database";
import { schedules as scheduleTable } from "../database/schema";
import { CronJob } from "cron";
import client from "../bot";
import logger from "../shared/lib/logger";
import fs from "fs";
import mime from "mime-types";

let activeSchedules: CronJob[] = [];

async function loadAndStartSchedules() {
    const scheduleData = await db.select().from(scheduleTable);
    logger.info(`[Scheduler] Starting with ${scheduleData.length} tasks`);
    const session = client.getSession();

    const newSchedules: CronJob[] = [];

    for (const schedule of scheduleData) {
        try {
            const job = new CronJob(schedule.scheduled_time, async () => {
                if (session) {
                    for (const target of JSON.parse(schedule.contact_ids)) {
                        try {
                            if (schedule.attachment) {
                                if (fs.existsSync(schedule.attachment)) {
                                    const buffer = fs.readFileSync(schedule.attachment);
                                    const mimeType = mime.lookup(schedule.attachment) || "application/octet-stream";
                                    const fileName = schedule.attachment.split(/[\\/]/).pop() || "file";
                                    let messageContent: any = {};
                                    if (mimeType.startsWith("image/")) {
                                        messageContent = {
                                            image: buffer,
                                            caption: schedule.message
                                        };
                                    } else if (mimeType.startsWith("video/")) {
                                        messageContent = {
                                            video: buffer,
                                            caption: schedule.message
                                        };
                                    } else if (mimeType.startsWith("audio/")) {
                                        messageContent = {
                                            audio: buffer,
                                            mimetype: mimeType
                                        };
                                    } else {
                                        messageContent = {
                                            document: buffer,
                                            mimetype: mimeType,
                                            fileName: fileName,
                                            caption: schedule.message
                                        };
                                    }
                                    await session.sendMessage(target, messageContent);
                                } else {
                                    logger.error(`[Scheduler] Attachment file not found: ${schedule.attachment}`);
                                }
                            } else {
                                await session.sendMessage(target, { text: schedule.message });
                            }
                        } catch (error) {
                            logger.error(`[Scheduler] Failed to send message to ${target}:`, error);
                        }
                    }
                }
            }, null, false, 'Asia/Jakarta');

            job.start();
            newSchedules.push(job);
        } catch (error: any) {
            logger.error("Schedule error =>", error.message);
        }
    }

    activeSchedules = newSchedules;
}

function activateNewSchedule(body: {
    message: string;
    contact_ids: string[];
    scheduled_time: string;
    attachment?: string | null | undefined;
}) {

    const job = new CronJob(body.scheduled_time, async () => {
        const session = client.getSession();

        if (session) {
            for (const target of body.contact_ids) {
                try {
                    if (body.attachment) {
                        if (fs.existsSync(body.attachment)) {
                            const buffer = fs.readFileSync(body.attachment);
                            const mimeType = mime.lookup(body.attachment) || "application/octet-stream";
                            const fileName = body.attachment.split(/[\\/]/).pop() || "file";
                            let messageContent: any = {};
                            if (mimeType.startsWith("image/")) {
                                messageContent = {
                                    image: buffer,
                                    caption: body.message
                                };
                            } else if (mimeType.startsWith("video/")) {
                                messageContent = {
                                    video: buffer,
                                    caption: body.message
                                };
                            } else if (mimeType.startsWith("audio/")) {
                                messageContent = {
                                    audio: buffer,
                                    mimetype: mimeType
                                };
                            } else {
                                messageContent = {
                                    document: buffer,
                                    mimetype: mimeType,
                                    fileName: fileName,
                                    caption: body.message
                                };
                            }
                            await session.sendMessage(target, messageContent);
                        } else {
                            logger.error(`[Scheduler] Attachment file not found: ${body.attachment}`);
                        }
                    } else {
                        await session.sendMessage(target, { text: body.message });
                    }
                } catch (error) {
                    logger.error(`[Scheduler] Failed to send message to ${target}:`, error);
                }
            }
        }
    }, null, false, 'Asia/Jakarta');

    job.start();
    activeSchedules.push(job);
}

function stopAllSchedules() {
    for (const job of activeSchedules) {
        job.stop();
    }
    activeSchedules = [];
}

const dailyRefreshJob = new CronJob("0 0 0 * * *", async () => {
    console.log("[Scheduler] Refreshing schedules...");
    stopAllSchedules();
    await loadAndStartSchedules();
});

export { loadAndStartSchedules, stopAllSchedules, dailyRefreshJob, activateNewSchedule };