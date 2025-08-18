# Whatsapp Bot System

## Instalasi

1. Clone proyek dari github
   
   ```
   git clone git@github.com:iqbalbtr/wa-bot-system.git
   cd wa-bot-system
   ```
2. Install Dependensi
   
   ```
   npm install
   ```

   >[!NOTE]
   > Kalian bisa menggunakan `pnpm` namun ada beberapa package yang tidak berjalan
   > Hal ini dikarenakan ada fitur dari command bot menggunakan package dari 
   > luar dan tidak berjalan secara native dengan nodejs. Penggunana runtime `bun` dan lainnya masih belum di coba.
   > Kalian bebas jika ingin menggunakan runtime lainnya.

### Package Tambahan

Berikut adalah beberapa package eksternal yang perlu diinstal agar fitur tertentu pada bot dapat berjalan dengan baik:

- **ffmpeg**  
    - [Panduan Unduh/Instalasi](https://ffmpeg.org/download.html)  
    - Digunakan oleh: [`downloader/yt-video`](/src/bot/command/downloader.ts), [`sticker`](/src/bot/command/sticker.ts)

- **yt-dlp**  
    - [Panduan Unduh/Instalasi](https://github.com/yt-dlp/yt-dlp#installation)  
    - Digunakan oleh: [`downloader/yt-video`](/src/bot/command/downloader.ts)

- **pdf2docx**  
    - [Panduan Unduh/Instalasi](https://pypi.org/project/pdf2docx/)  
    - Digunakan oleh: [`converter/pdf2docx`](/src/bot/command/converter.ts)

> [!NOTE]
> Instalasi package di atas bersifat opsional, namun beberapa command tidak akan berjalan tanpa package terkait. Jika tidak ingin menggunakan fitur tertentu, Anda dapat menghapus atau menonaktifkan command yang membutuhkan package tersebut.


### Menjalankan proyek
   
1. Membuat environemt
   
   Salin isi dari `.env.example` lalu paste didalam file `.env`, pastikan letak file didalam root proyek. Didalam dapat melakukan configurasi port, prefix bot, dll.
   
2. Membuat migrasi

    ```
    npm run db:generate
    ```
   
3. Menjalankan migrasi

    ```
    npm run db:migrate
    ```
4. Menajalankan proyek 

    a. Dev Mode

    Kalian bisa menjalankan proyek di mode dev dengan perintah cmd berikut.
    
    ```
    npm run dev
    ```

    b. Prod Mode

    Sebelum menjalankan prod pastikan untuk melakukan build proyek terlebih dahulu
    
    ```
    # Melakukan proses build
    npm run build

    # Menjalankan proyek hasil dari build
    npm run start
    ```

    Setelah menjalankan akan muncul `qrcode`. Kalian dapat melakukan scan terlebih dahulu untuk menghubungkan akun whatsapp kalian pada bot. Proses ini dilakukan sekali, namun jika ada kendala kalian bisa melakukan reset dengan menghapus folder `/.wa-auth` terletak di root proyek.

    >[!NOTE]
    > Hasil dari proses build akan disimpan di folder root `/dist`, jika kalian ingin merubah
    > bisa menlakukan update di `tsconfig`

## Struktur Proyek

Proyek ini dibagi menjadi 3 bagian utama yaitu `API` `BOT` `SCHEDULER` tiap bagian memiliki proses tersendiri dan saling berkaitan. Berikut merupakan pembagian fungsi dari tiap tiap bagian :

1. **BOT**

    Bagian ini bertugas untuk menjalankan fungsi dan proses dari bot whatsapp mulai mengelola command, pesan masuk, atau bahkan middleware dari command. Ada beberaoa fungsi dari bot ini yang digunakan pada bagian `API` dan `SCHEDULER` utamanya adalah **pengiriman pesan.** Pastikan untuk bot dalam keadaan login agar fungsi tersebut dapat berjalan.

2. **API**
   
   Bagian ini sebagai jembatan antara sistem dari luar dengan bot. Kalian bisa melakukan integrasi dengan sistem dari luar proyek ini melalui **API** yang disediakan. kalian bisa membaca dokumentasi terkait API di [sini](/docs/api/).

3. **SCHEDULER**
   
   Bagian ini digunakan untuk menjalankan beberapa fungsi dari jadwal, hal ini dilakukan untuk menajaga sesi bot agar tetap bersih dan meminimalisir dari overload sesi yang tidak dibersihkan. Bagian ini juga mengatur fitur tambahan seperti `pesan terjadwal` dari bot.

## Command Manager

### Alur command

Sebelum command dijalankan ada beberapa proses yang perlu dilalui. Saat user berinteraksi dengan bot melalui command. 

1. Proses pertaman akan melalui middleware command terlebih dahulu kalian bisa melihat di bagian [sini](#menambahkan-middleware).
2. Setelah sudah di proses pesan di cek apakah pengirim yang mengirim pesan ada sesi yang terkait.
   
   a. Proses sesi : Jika ada sesi terkait maka sistem akan memproses sesi terkait. Perlu diketahui jika sesi ini adalah sesi **parent** biasanya hanya akan membuat list sub command pada parent command. Namun jika tidak biasanya pesan kan di proses sesuai konteks command. Namun sistem jiga sudah otomatis membuat kan list sub command jika pesan tidak dikenali, hal ini dikareanakn proses pembuatan footer sebelumnya hanya dijalankan jika pesan sesuai command.
   
   b. Proses tanpa sesi 
   Sistem hanya akan mengirim default respon pesan

### Menambahkan middleware command

Jika ada proses yang memerlukan middleware bisa menambahkanya secara mandiri. Perlu diketahui jika hanya command utama atau parent yang akan dideteksi. Jadi kalian tidak bisa membuat middleware untuk sub command 

1. Buat file di [sini](/src/bot/middleware/)
   
```js
import ..;

export function miscMiddleware(context: ClientContextType, next: () => void) {

    /**
     * Memanggil data yang diperlukan
     */
    const { client, message, payload } = context;

    /**
     * Jika lolos panggil fungsi next
     */
    next()

    /**
     * Gunakan return untuk mematikan proses. Jika kalian melempar error pastikan 
     * untuk menangkapnya dan balikan retrun
     */
}
```

2. Regsitrasi middleware di [sini](/src/bot/index.ts)

```js
...;

const client = new WhatsappClient();

/**
 * untuk seluruh pesan yang masuk
 */
client.commandManager.addMiddleware("*", miscMiddleware);

/**
 * Hanya di command tersebut. Parameter pertama juga dapat 
 * dimasukan array yang berisi parent command ["command","command-2"]
 */
client.commandManager.addMiddleware("command", commandMiddleware);

...;
```

### Membuat command

```js
import ...;

export default {
    name: "nama",
    description: "deskripsi command",
    usage: `${prefix}nama`,
    execute: (message, client) => {

        /**
         * Lakukan untuk menyimpan sesi dengan menggunakan method berikut
         * pastikan nama sesi pada param kedua sesuai nama command yaitu "nama"
         * Kalian bisa juga menyimpan data sesi tambahan pada param ke 3 yang
         * yang bertipe object
         */
        client.sessionManager.startOrAdvanceSession(message, 'nama', { opsional: "ini data" });

        /**
         * Fungsi bantuan untuk membuat text list sub command
         * jika kalian ingin membuat pada sub command di dalam sub command kalian 
         * bisa mengirim menjadi generateSessionFooterContent("nama", "/sub-1-2", /"sub-2-1")
         * maka sub 2 yang akan di generate
         */
        const reply = generateSessionFooterContent("nama");

        /**
         * Kirim response balik
         */
        client.messageClient.sendMessage(message.key.remoteJid!, { text: reply });
    },
    commands: [
        {
            name: "/sub-1-1",
            description: "deskripsi",
            execute: async (message, client, payload) => {
             
                /**
                 * Kalian bisa langsung memproses pesan yang masuk di command ini
                 */

                /**
                 * Untuk mengahapus sesi bisa memangil method berikut
                 */
                client.sessionManager.endSessionForUser(msg)

            }
        },
        {
            name: "/sub-1-2",
            description: "deskripsi",
            execute: async (message, client) => {

                /**
                * Dalam mengelola sesi pastikan berurutan dari parent kalian tidak bisa
                * langsung menyiman sesi langsun ccommad di lebih rendah misal /sub-2-1
                */
                client.sessionManager.startOrAdvanceSession(message, '/sub-1-2', { opsional: "ini data sub" });

                const reply = generateSessionFooterContent("nama");

                client.messageClient.sendMessage(message.key.remoteJid!, { text: reply });
            },
            commands: [
                {
                    name: "/sub-2-1",
                    description: "deskripsi",
                    execute: async (message, client, payload, data) => {
                        /**
                         * Lakukan pemrosesan disini
                         */
                    }
                },
                {
                    name: "/sub-2-1",
                    description: "deskripsi",
                    execute: async (message, client, payload, data) => {
                        /**
                         * Lakukan pemrosesan disini
                         */

                    }
                },
            ]
        }
    ]
} as CommandType;
```

### Membuat Event

Jika kalian perlu menambahkan logika baru di event kalian bisa menambahkan nya di [sini](/src/bot/event/). Inti bot menggunakan bailyes kalian bisa memcaba docs mengenai event yang tersedia di [sini]()

```js
import ...;

export default {
    event: "nama.event",
    listener: async (event, client) => {
       /**
        * Atur proses di sini. Pastikan gunatan type ClientEvent untuk mengetahui 
        * type yang tersedia
        */
    }
} as ClientEvent;
```

## Type

### Payload

```js
export type PayloadMessage = {
  // Belum  dinormalisasi contoh 62xxx
  from: string;
  // belum dinormalisasi
  groupId?: string;
  command: string;
  // ekstarsu text tanpa command
  text: string;
  // original text dengan command
  originalText: string;
  timestamp: number;
  // pesan yang sudah dinormalisasi tanpa ephermalMessage, dan documentWithCaption
  message: proto.IMessage;
  isGroup: boolean;
  // berisi id contact dan belum dinormalisasi
  mentionedIds: string[];
  isMentioned: boolean
}
```

### Client

```js
export type Client = WhatsappClient
```

### Command 

```js
export type CommandType = {
  name: string;
  description: string;
  usage?: string;
  execute: (
    message: proto.IWebMessageInfo,
    client: Client,
    payload: PayloadMessage,
    data?: object | any
  ) => void,
  commands?: CommandType[]
}
```

### User session

```js
export type SessionUserType = {
  // Daftar command yang berada di user misal ["command", "/sub-1", "/sub-2"]
  current: string[]
  session: CommandType;
  data: object | any,
}
```

### Event

```js

export type ClientEvent = {
  [K in keyof BaileysEventMap]: {
    event: K;
    listener: (payload: BaileysEventMap[K], session: Client) => void;
  };
}[keyof BaileysEventMap];
```
### Middleware 

```js
export type ClientContextType = {
  client: Client,
  message: proto.IWebMessageInfo,
  payload: PayloadMessage
}
export type ClientMiddlewareType = (context: ClientContextType, next: () => void) => any
```

## Fungsi pembantu

### ScheduleManager (src/schedule/core/cron.ts)
- **initialize()**: Inisialisasi manajer jadwal, memuat dan menjalankan semua jadwal dari database.
- **setNewSchedule(body)**: Menambahkan jadwal baru dan langsung menjalankannya.
- **stopAllSchedules() / startAllSchedules()**: Menghentikan/menjalankan semua jadwal aktif.
- **loadScheduleMessages()**: Memuat ulang semua jadwal dari database dan mengatur pengiriman pesan terjadwal.

### CommandManager (src/bot/core/command-manager.ts)
- **addCommand(command)**: Mendaftarkan command baru ke sistem.
- **getCommand(name)**: Mengambil command berdasarkan nama.
- **getAllCommands()**: Mengambil semua command yang terdaftar.
- **addMiddleware(command, middleware)**: Menambahkan middleware ke command tertentu atau global.
- **processIncomingMessage(data)**: Titik masuk utama pemrosesan pesan masuk.
- **buildHelpMessage(command, isSubSession)**: Membuat pesan bantuan/menu dinamis.

### ContactManager (src/bot/core/contact-manager.ts)
- **initialize()**: Membuat direktori dan memuat kontak dari file.
- **getAllContacts()**: Mengambil semua kontak grup yang tersimpan.
- **setContacts(newContacts)**: Menyimpan dan memperbarui daftar kontak grup.
- **filterValidGroups(contacts)**: Memfilter hanya grup yang valid dari daftar kontak.

### WhatsappClient (src/bot/core/whatsaap.ts)
- **createSession() / destroySession()**: Membuat/menghancurkan sesi WhatsApp.
- **getSession() / getPrefix() / getInfoClient()**: Mengambil sesi aktif, prefix, dan info user bot.
- **defaultMessageReply(message, payload)**: Mengirim balasan default jika command tidak ditemukan.

### SessionManager (src/bot/core/session-manager.ts)
- **startOrAdvanceSession(msg, commandName, data?)**: Memulai atau melanjutkan sesi interaktif user.
- **updateSessionData(msg, data)**: Memperbarui data sesi user.
- **goBackInSession(msg, steps?)**: Kembali ke langkah sebelumnya dalam sesi.
- **getUserSession(userId)**: Mengambil data sesi aktif user.
- **endSessionForUser(msg)**: Mengakhiri sesi user.

### RequestLimiter (src/bot/core/request-limiter.ts)
- **startRequest(userId) / endRequest(userId)**: Menandai permintaan baru/sudah selesai.
- **isLimitReached()**: Mengecek apakah limit permintaan sudah tercapai.
- **cleanupStaleRequests()**: Membersihkan permintaan yang sudah usang.

### MessageClient (src/bot/core/message-client.ts)
- **sendMessage(recipientJid, content, options?)**: Mengirim pesan ke WhatsApp, otomatis antri jika sesi belum siap.
- **getPendingMessageCount()**: Mendapat jumlah pesan yang tertunda.
- **getMessageText(message)**: Mengekstrak teks dari berbagai format pesan.
- **normalizeMessage(msg)**: Normalisasi struktur pesan agar konsisten.
- **handleAttachmentMessage(filePath, text)**: Membuat konten pesan dengan attachment (gambar, video, dokumen, dll).
