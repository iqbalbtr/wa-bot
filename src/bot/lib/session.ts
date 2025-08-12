import client from "..";
import { CommandType } from "../type/client";


export function generateSessionFooterContent(...names: string[]) {

    let session: CommandType | undefined = undefined

    for (const name of names) {
        if (!session) {
            session = client.commandManager.getCommand(name);
        } else {
            session = session.commands?.find((fo) => fo.name == name);
        }
    }

    if (!session?.commands) {
        return ''
    }

    let content = 'Gunakan command berikut'
    if (session.commands) {
        session.commands.forEach((text) => {
            content += `\n- ` + "*`" + `${text.name}` + "`*" + ` ${text.description}`
        })
    }

    if (names.length > 1) {
        content += "\n- *`/back`* untuk kembali"
    }

    content += "\n- *`/exit`* untuk keluar"

    return content
}