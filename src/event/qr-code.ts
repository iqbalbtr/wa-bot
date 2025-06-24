import client from "../app/bot";
import * as qrcode from "qrcode-terminal";

client.on('qr', e => {
    qrcode.generate(e, { small: true });
})
