import { eq } from "drizzle-orm";
import db from "../../database";
import { groupSettings } from "../../database/schema";
import { CommandType } from "../type/client";
import { proto } from "@whiskeysockets/baileys";
import client from "..";
import { generateSessionFooterContent } from "../lib/util";

export enum groupEnumSetting {
    ALLOW_COMMAND = "allow-command",
    GREETING_NEW_MEMBER = "greeting-new-member",
}

const groupDefaultSetting = [
    { key: groupEnumSetting.ALLOW_COMMAND, value: true },
    { key: groupEnumSetting.GREETING_NEW_MEMBER, value: false },
];

function generateSettingList(value: Array<{ key: string, value: boolean }>) {
    let content = "";
    value.forEach((setting, i) => {
        content += `${i + 1}. ${setting.key}: (${setting.value ? "on" : "off"})\n`;
    });
    return content;
}

function extractGroupValueSetting(text: string) {
    
    const key = +text.split(":")[0].trim().replace(/\(\)/g, "");
    const valueStr = text.split(":")[1]?.trim().replace(/\(\)/g, "");

    const value = valueStr === "on";

    if (typeof key !== "number" || typeof value !== "boolean" && groupDefaultSetting.length <= key)
        return null;
    return { key, value };
}

function isGroupMessageAndAdminMessage(message: proto.IWebMessageInfo): boolean {
    const isGroup = message.key.remoteJid?.endsWith("@g.us") || false;
    const groupMetadata = client.groupCache.get(message.key.remoteJid!);
    if (!groupMetadata) return false;
    const isAdmin = !!groupMetadata.participants.find(p => p.id === message.key.participant && p.admin);
    return isGroup && isAdmin;
}

export default {
    name: "setting",
    description: "Mengatur pengaturan bot",
    execute: async (message, client) => {
        if (!message.key.remoteJid) return;

    const content = generateSessionFooterContent("setting")
    client.sessionManager.startOrAdvanceSession(message, "setting")
    client.messageClient.sendMessage(message.key.remoteJid!, { text: content })
    },
    commands: [
        {
            name: "/group",
            description: "Mengatur pengaturan grup, hanya *admin* yang memiliki akses",
            execute: async (message, client) => {

                if (!message.key.remoteJid) return;

                let content = generateSessionFooterContent("setting", "/group")
                let setting = ""

                const isExist = await db.select().from(groupSettings).where(eq(groupSettings.group_id, message.key.remoteJid));

                if (isExist.length <= 0) {
                    setting += "Grup belum diatur, silakan inisialisasi dengan perintah `/init`"
                } else {
                    setting += "Grup sudah diatur. Gunakan /get untuk melihat pengaturan.\n"
                    setting += generateSettingList(isExist[0].settings);
                }

                client.sessionManager.startOrAdvanceSession(message, "/group")
                client.messageClient.sendMessage(message.key.remoteJid!, { text: content })
                client.messageClient.sendMessage(message.key.remoteJid!, { text: setting })
            },
            commands: [
                {
                    name: "/init",
                    description: "Lakukan inisialisasi jika pengaturan grup belum diatur.",
                    execute: async (message, client) => {

                        if (!message.key.remoteJid) return;

                        const isAllow = isGroupMessageAndAdminMessage(message);

                        if (!isAllow) {
                            client.messageClient.sendMessage(message.key.remoteJid!, { text: "Hanya admin grup yang dapat melakukan aksi ini." });
                            return
                        }

                        const isExist = await db.select().from(groupSettings).where(eq(groupSettings.group_id, message.key.remoteJid));

                        if (isExist.length > 0) {
                            client.messageClient.sendMessage(message.key.remoteJid!, { text: "Pengaturan grup sudah diinisialisasi." });
                            return;
                        }

                        await db.insert(groupSettings).values({
                            group_id: message.key.remoteJid,
                            settings: groupDefaultSetting
                        })

                        let content = "Grup berhasil didaftarkan:\n";
                        content += generateSettingList(groupDefaultSetting);
                        content += "\nGunakan `/set` (key) (aktif/mati)"

                        client.messageClient.sendMessage(message.key.remoteJid!, { text: content });
                    }
                },
                {
                    name: "/set",
                    description: "Atur pengaturan grup dengan format: /set (urutan):(on/off)",
                    execute: async (message, client, payload) => {

                        const isAllow = isGroupMessageAndAdminMessage(message);

                        if (!isAllow) {
                            client.messageClient.sendMessage(message.key.remoteJid!, { text: "Hanya admin grup yang dapat melakukan aksi ini." });
                            return
                        }

                        const isExist = await db.select().from(groupSettings).where(eq(groupSettings.group_id, message.key.remoteJid!));

                        if (isExist.length <= 0) {
                            client.messageClient.sendMessage(message.key.remoteJid!, { text: "Pengaturan grup belum diinisialisasi." });
                            return;
                        }

                        console.log(payload.text);
                        

                        const newValue = extractGroupValueSetting(payload.text)

                        console.log(newValue);
                        

                        if (!newValue) {
                            client.messageClient.sendMessage(message.key.remoteJid!, { text: "Format pengaturan tidak valid. Gunakan: /set (urutan):(on/off)" });
                            return;
                        }

                        const newSetting = isExist[0].settings.map((item, i) => (i + 1) === newValue.key ? { ...item, value: newValue.value } : item);

                        await db.update(groupSettings).set({ settings: newSetting }).where(eq(groupSettings.group_id, message.key.remoteJid!));

                        let content = "Pengaturan grup berhasil diperbarui:\n";
                        content += generateSettingList(newSetting);

                        client.messageClient.sendMessage(message.key.remoteJid!, { text: content });
                    },
                },
                {
                    name: "/get",
                    description: "Lihat pengaturan grup",
                    execute: async (message, client, payload) => {
                        if (!message.key.remoteJid) return;

                        const isAllow = isGroupMessageAndAdminMessage(message);

                        if (!isAllow) {
                            client.messageClient.sendMessage(message.key.remoteJid!, { text: "Hanya admin grup yang dapat melakukan aksi ini." });
                            return
                        }

                        const isExist = await db.select().from(groupSettings).where(eq(groupSettings.group_id, message.key.remoteJid)).limit(1);

                        if (isExist.length <= 0) {
                            client.messageClient.sendMessage(message.key.remoteJid!, { text: "Pengaturan grup belum diinisialisasi." });
                            return;
                        }

                        let content = "Pengaturan grup saat ini:\n";
                        content += generateSettingList(isExist[0].settings);

                        client.messageClient.sendMessage(message.key.remoteJid!, { text: content });
                    }
                },
                {
                    name: "/reset",
                    description: "Reset pengaturan grup ke default",
                    execute: async (message, client, payload, data) => {

                        const isAllow = isGroupMessageAndAdminMessage(message);

                        if (!isAllow) {
                            client.messageClient.sendMessage(message.key.remoteJid!, { text: "Hanya admin grup yang dapat melakukan aksi ini." });
                            return
                        }

                        const isExist = await db.select().from(groupSettings).where(eq(groupSettings.group_id, message.key.remoteJid!));

                        if (isExist.length <= 0) {
                            client.messageClient.sendMessage(message.key.remoteJid!, { text: "Pengaturan grup belum diinisialisasi." });
                            return;
                        }

                        await db.update(groupSettings).set({ settings: groupDefaultSetting }).where(eq(groupSettings.group_id, message.key.remoteJid!));

                        let content = "Pengaturan grup berhasil direset ke default:\n";
                        content += generateSettingList(groupDefaultSetting);

                        client.messageClient.sendMessage(message.key.remoteJid!, { text: content });
                    },
                }
            ]
        }
    ]
} as CommandType