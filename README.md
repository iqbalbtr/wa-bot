# Whatsapp Bot System

## Instalasi

1. Clone proyek dari github
   
   ```
   git clone 
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

### Membuat Command



### Membuat Event
### Menambahkan middleware
### Menyimpan sesi commnad
### Menyimpan data sesi commnad