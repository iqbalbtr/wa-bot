import client from "../bot/bot";
import * as qrcode from "qrcode-terminal";

client.on('qr', e => {
    qrcode.generate(e, { small: true });
})
