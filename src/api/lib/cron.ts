export const parseCronTime = (time: string) => {
    const parts = time.split(' ').filter(part => Boolean(part.trim()));
    
    if (parts.length !== 6) {
        throw new Error("Invalid cron time format. Expected format: 'minute hour dayOfMonth month dayOfWeek'");
    }
    
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    return {
        minute: parseInt(minute, 10),
        hour: parseInt(hour, 10),
        dayOfMonth: dayOfMonth.split(",").map(e => parseInt(e, 10)) ?? parseInt(dayOfMonth, 10),
        month: parseInt(month, 10) - 1,
        dayOfWeek: parseInt(dayOfWeek, 10)
    };
}