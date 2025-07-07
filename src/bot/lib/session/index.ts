import { Message } from "whatsapp-web.js";
import client from "../..";
import { prefix } from "../../../shared/constant/env";
import { ClientType, CommandSessionContentType, SessionUserType } from "../../type/client";
import { extractUserNumber } from "../util";

export function sessionHandler(msg: Message, session: SessionUserType, client: ClientType) {

    const command  = msg.body.split(" ")[0]
    const commands = session.session.commands || []

    if (command.toLowerCase() !== '/exit' && !commands.map(fo => fo.name).includes(command)) {

        const content = generateSessionFooterContent(session.session.name)

        msg.reply(content)

        return false
    }

    if (command.toLowerCase() == '/exit') {
        client.session.users.delete(extractUserNumber(msg));
        msg.reply(`Anda keluar dari sesi gunakan *\`${prefix}help\`* untuk melihat daftar perintah`)
        return false
    }

    return true
}

export function createSessionUser(message: Message, sessionName: string, data?: object) {

    const user = extractUserNumber(message);

    const session = client.commands.get(sessionName);

    if (!session)
        return message.reply("Maaf terjadi kesalah tidak dikenali")

    return client.session.users.set(user, {
        session,
        data: data || {}
    })
}

export function deleteSessionUser(message: Message) {

    const user = extractUserNumber(message);

    const session = client.session.users.get(user);

    if (!session)
        return message.reply("Maaf terjadi kesalah tidak dikenali")

    return client.session.users.delete(user)
}

export function generateSessionFooterContent(name: string) {
    const session = client.commands.get(name);

    if(!session?.commands){
        return ''
    }

    let content = '\nGunakan command berikut'
    session.commands.forEach((text) => {
        content += `\n- ` + "*`" + `${text.name}` + "`*" + ` ${text.description}`
    })

    content += "\n- *`/exit`* untuk keluar"

    return content
}

export function handleSessionCommand(command: string, sessions: CommandSessionContentType[]){
    
    const commandIsExist = sessions.find((fo) =>  fo.name == command);

    if(commandIsExist) return commandIsExist

}