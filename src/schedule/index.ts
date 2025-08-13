import client from "../bot";
import { ScheduleManager } from "./core/cron";

const scheduleManager = new ScheduleManager(client);

export default scheduleManager;