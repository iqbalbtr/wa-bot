import didyoumean from "didyoumean";
import path from "path";
import fs from "fs"
import client from "../../bot";
import { ClientContextType, ClientMiddlewareType } from "../type/client";
import { proto } from "@whiskeysockets/baileys";

export function extractMessageFromCommand(body: string) {
    return body.split(" ")[1]
}

export function extractContactId(message: string): string {
    return message.split("@")[0].replace(/[^0-9]/g, "");
}

export function extractLid(message: string): string {
    return message.split(":")[0]
}

export async function middlewareApplier(
    context: ClientContextType<any>,
    middlewares: ClientMiddlewareType<any>[],
    finalFn: () => void
) {

    let index = -1;

    async function next(i: number) {

        if (i <= index)
            throw new Error("next() called multiple times");

        index = i;

        if (i == middlewares.length) {
            return finalFn()
        }

        const middleware = middlewares[i];

        if (middleware) {
            await middleware(context, () => next(i + 1));
        }
    }

    await next(0);
}

export function extractCommandFromPrefix(body: string) {
    
    const prefix = client.getPrefix();

    if(body.trim().startsWith("/")) {
        return body.trim().split(" ")[0];
    }

    if (body.trim().startsWith(prefix)) {
        return body.trim().split(prefix)[1].split(" ")[0].toLowerCase();
    }
    return null;
}

export function extractMessageFromGroupMessage(text: string) {

    let res = ""

    text.split(" ").forEach((word, index) => {
        if(!word.startsWith("@")) {
            res += word + " ";
        }
    })

    return res.trim();
}