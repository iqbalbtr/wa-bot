
import db from "../../database";
import { schedules as scheduleTable } from "../../database/schema";
import { CronJob } from "cron";
import { WhatsappClient } from "../../bot/core/whatsaap";
import { MessageClient } from "../../bot/core/message-client";
import logger from "../../shared/lib/logger";


export class ScheduleManager {

    private readonly logger = logger
    private activeSchedules: CronJob[] = [];
    constructor(private client: WhatsappClient) { }

    async initialize() {
        this.logger.info("Inisialisasi manajer jadwal...");
        this.stopAllSchedules();
        await this.loadScheduleMessages();
        this.startAllSchedules();
        this.dailyRefresh().start();
    }

    private dailyRefresh() {
        return new CronJob("0 0 0 * * *", async () => {
            this.logger.info("Menyegarkan jadwal...");
            this.stopAllSchedules();
            await this.loadScheduleMessages();
            this.startAllSchedules();
            this.client.requestLimiter.cleanupStaleRequests();
        });
    }

    private async loadScheduleMessages() {
        this.stopAllSchedules();
        this.activeSchedules = [];
        const scheduleData = await db.select().from(scheduleTable);
        this.logger.info(`Memulai dengan ${scheduleData.length} jadwal tugas`);
        for (const schedule of scheduleData) {
            try {
                let contactIds: string[] = [];
                try {
                    contactIds = JSON.parse(schedule.contact_ids);
                } catch (err) {
                    this.logger.error(`Gagal parse contact_ids pada jadwal:`, err);
                    continue;
                }
                const job = new CronJob(schedule.scheduled_time, async () => {
                    for (const target of contactIds) {
                        try {
                            if (typeof schedule.attachment === 'string' && schedule.attachment) {
                                const content = MessageClient.handleAttachmentMessage(schedule.attachment, schedule.message);
                                if (content) {
                                    await this.client.messageClient.sendMessage(target, content);
                                } else {
                                    await this.client.messageClient.sendMessage(target, { text: schedule.message });
                                }
                            } else {
                                await this.client.messageClient.sendMessage(target, { text: schedule.message });
                            }
                        } catch (error) {
                            this.logger.error(`Gagal mengirim pesan ke ${target}:`, error);
                        }
                    }
                }, null, false, 'Asia/Jakarta');
                this.activeSchedules.push(job);
            } catch (error: any) {
                this.logger.error("Error jadwal =>", error.message);
            }
        }
    }

    public async setNewSchedule(body: {
        message: string;
        contact_ids: string[];
        scheduled_time: string;
        attachment?: string | null | undefined;
    }) {
        // Cek duplikasi jadwal
        const isDuplicate = this.activeSchedules.some(j => j.cronTime.source === body.scheduled_time);
        if (isDuplicate) {
            this.logger.warn(`Jadwal duplikat ditemukan untuk waktu: ${body.scheduled_time}, dilewati.`);
            return;
        }
        const job = new CronJob(body.scheduled_time, async () => {
            for (const target of body.contact_ids) {
                try {
                    if (typeof body.attachment === 'string' && body.attachment) {
                        const content = MessageClient.handleAttachmentMessage(body.attachment, body.message);
                        if (content) {
                            await this.client.messageClient.sendMessage(target, content);
                        } else {
                            await this.client.messageClient.sendMessage(target, { text: body.message });
                        }
                    } else {
                        await this.client.messageClient.sendMessage(target, { text: body.message });
                    }
                } catch (error) {
                    this.logger.error(`[Scheduler] Gagal mengirim pesan ke ${target}:`, error);
                }
            }
        }, null, false, 'Asia/Jakarta');
        job.start();
        this.activeSchedules.push(job);
    }

    public stopAllSchedules() {
        for (const job of this.activeSchedules) {
            job.stop();
        }
    }

    public startAllSchedules() {
        for (const job of this.activeSchedules) {
            job.start();
        }
    }
}