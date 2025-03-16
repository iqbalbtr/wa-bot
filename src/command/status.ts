import { Message } from "whatsapp-web.js";
import { ClientType } from "../types/client";
import * as os from "os"

function getTimeFormat(from: number) {
    const uptimeMilliseconds = Date.now() - from;
    const uptimeSeconds = Math.floor(uptimeMilliseconds / 1000);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    const uptimeDays = Math.floor(uptimeHours / 24);
    const uptimeFormatted = `${uptimeDays} hari, ${uptimeHours % 24} jam, ${uptimeMinutes % 60} menit`;
    return uptimeFormatted
}

module.exports = {
    name: "status",
    description: "Menampilkan status bot, termasuk uptime dan penggunaan sumber daya.",
    execute: async (message: Message, client: ClientType) => {
        try {
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const memoryUsage = (usedMem / totalMem) * 100;

            const cpus = os.cpus();
            const cpuUsage = cpus.map(cpu => cpu.times).reduce((acc, times) => {
                acc.user += times.user;
                acc.nice += times.nice;
                acc.sys += times.sys;
                acc.idle += times.idle;
                acc.irq += times.irq;
                return acc;
            }, { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 });

            const totalCpuTime = Object.values(cpuUsage).reduce((acc, time) => acc + time, 0);
            const idleCpuTime = cpuUsage.idle;
            const cpuUsagePercentage = ((totalCpuTime - idleCpuTime) / totalCpuTime) * 100;

            let content = ""

            content += `- CPU Usage: ${cpuUsagePercentage.toFixed(2)}%`;
            content += `\n- Memory Usage: ${memoryUsage.toFixed(2)}% (${(usedMem / 1024 / 1024).toFixed(2)} MB dari ${(totalMem / 1024 / 1024).toFixed(2)} MB)`;
            content += `\n- Uptime bot: ${getTimeFormat(client.limiter.startTime)}`;
            content += `\n- Ongoing Process: ${client.limiter.users.size}`;
            content += `\n- Total Request: ${client.limiter.userTotal}`;

            message.reply(content);
        } catch (error) {

        }
    }
}