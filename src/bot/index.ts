import 'dotenv/config'
import { WhatsappClient } from './core/whatsaap';
import { blockUserMiddleware } from './middleware/block-user';

const client = new WhatsappClient();

client.requestLimiter.setConcurrencyLimit(10)
client.requestLimiter.setRequestTimeout(30000);

client.commandManager.addMiddleware(blockUserMiddleware);

export default client;