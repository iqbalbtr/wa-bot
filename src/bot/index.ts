import 'dotenv/config'
import { WhatsappClient } from './core/whatsaap';
import { blockUserMiddleware } from './middleware/block-user';
import { settingGroupMiddleware } from './middleware/setting-group';

const client = new WhatsappClient();

client.requestLimiter.setConcurrencyLimit(10)
client.requestLimiter.setRequestTimeout(30000);

client.commandManager.addMiddleware(blockUserMiddleware);
client.commandManager.addMiddleware(settingGroupMiddleware);

export default client;