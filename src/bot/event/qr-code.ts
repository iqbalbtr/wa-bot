import * as qrcode from "qrcode-terminal";
import client from "..";

client.on('qr', e => {
    qrcode.generate(e, { small: true });
})
