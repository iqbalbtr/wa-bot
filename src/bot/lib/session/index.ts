import { proto } from "@whiskeysockets/baileys";
import client from "../..";
import { prefix } from "../../../shared/constant/env";
import { Client, CommandSessionContentType, SessionUserType } from "../../type/client";
import { extractContactId } from "../util";

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