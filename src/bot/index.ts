import 'dotenv/config'
import { WhatsappClient } from './core/whatsaap';
import { blockUserMiddleware } from './middleware/block-user';
import { groupMiddleware } from './middleware/group';

const client = new WhatsappClient();

client.requestLimiter.setConcurrencyLimit(10)
client.requestLimiter.setRequestTimeout(30000);

client.commandManager.addMiddleware("*", blockUserMiddleware);
client.commandManager.addMiddleware("group", groupMiddleware);

export default client;