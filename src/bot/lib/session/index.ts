import { proto } from "@whiskeysockets/baileys";
import client from "../..";
import { prefix } from "../../../shared/constant/env";
import { Client, CommandSessionContentType, SessionUserType } from "../../type/client";
import { extractContactId } from "../util";

// export function sessionHandler(msg: proto.IWebMessageInfo, session: SessionUserType, client: Client) {

//     const clientSession = client.getSession();
//     const command = msg.message?.conversation?.split(" ")[0]
//     const commands = session.session.commands || []

//     if (command?.toLowerCase() !== '/exit' && !commands.map(fo => fo.name).includes(command || "")) {

//         const content = generateSessionFooterContent(session.session.name)

//         clientSession?.sendMessage((msg.key.remoteJid || ""), {
//             text: content
//         }, {
//             quoted: msg
//         });
//         return false
//     }

//     if (command && command.toLowerCase() == '/exit') {
//         client.userActiveSession.removeUserSession(extractContactId(msg.key.remoteJid || ""));
//         clientSession?.sendMessage((msg.key.remoteJid || ""), {
//             text: `Sesi ${session.session.name} telah diakhiri.`
//         }, {
//             quoted: msg
//         });
//         return false
//     }

//     return true
// }

// export function createSessionUser(message: proto.IWebMessageInfo, sessionName: string, data?: object) {

//     const clientSession = client.getSession();

//     const user = extractContactId(message.key.remoteJid || "");

//     const session = client.command.getCommand(sessionName);

//     if (!session)
//         return clientSession?.sendMessage(message.key.remoteJid || "" , {
//             text: "Maaf terjadi kesalahan tidak dikenali"
//         }, {
//             quoted: message
//         });

//     return client.userActiveSession.addUserSession(user, {
//         session,
//         data: data || {}
//     })
// }

// export function deleteSessionUser(message: proto.IWebMessageInfo) {

//     const user = extractUserNumber(message);

//     const session = client.session.users.get(user);

//     if (!session)
//         return message.reply("Maaf terjadi kesalah tidak dikenali")

//     return client.session.users.delete(user)
// }

export function generateSessionFooterContent(name: string) {
    const session = client.command.getCommand(name);

    if (!session?.commands) {
        return ''
    }

    let content = '\nGunakan command berikut'
    session.commands.forEach((text) => {
        content += `\n- ` + "*`" + `${text.name}` + "`*" + ` ${text.description}`
    })

    content += "\n- *`/exit`* untuk keluar"

    return content
}

export function handleSessionCommand(command: string, sessions: CommandSessionContentType[]) {

    const commandIsExist = sessions.find((fo) => fo.name == command);

    if (commandIsExist) return commandIsExist

}