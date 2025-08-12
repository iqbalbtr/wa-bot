import { Hono } from "hono";
import * as os from "os"
import client from "../../bot";
import { successResponse } from "../lib/util";
import db from "../../database";
import { blockedUsers, schedules } from "../../database/schema";
import { count } from "drizzle-orm";

function getTimeFormat(from: number) {
    const uptimeMilliseconds = Date.now() - from;
    const uptimeSeconds = Math.floor(uptimeMilliseconds / 1000);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    const uptimeDays = Math.floor(uptimeHours / 24);
    const uptimeFormatted = `${uptimeDays} hari, ${uptimeHours % 24} jam, ${uptimeMinutes % 60} menit`;
    return uptimeFormatted
}


const dashboardHandler = new Hono()

dashboardHandler.get("/", async ctx => {

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = (usedMem / totalMem) * 100;

    const blockCount = await db.select({ count: count() }).from(blockedUsers)
    const schedulerCount = await db.select({ count: count() }).from(schedules)

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

    const data = {
        block: blockCount[0].count,
        scheduler: schedulerCount[0].count,
        is_active: client.startTime ? true : false,
        cpu: cpuUsagePercentage.toFixed(2),
        memory: ` ${memoryUsage.toFixed(2)}% (${(usedMem / 1024 / 1024).toFixed(2)} MB dari ${(totalMem / 1024 / 1024).toFixed(2)} MB)`,
        uptime: getTimeFormat(client.startTime || 0),
        process: client.requestLimiter.getActiveRequestCount() ?? 0,
        total_req: client.requestLimiter.getTotalRequestCount() ?? 0
    }

    return ctx.json(successResponse("sucess", data))
})

export default dashboardHandler