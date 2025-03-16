# Documentation

## Getting Started

### 1. Install Dependencies
Pastikan Anda telah menginstal semua dependensi yang diperlukan dengan menjalankan perintah berikut:
```sh
npm install
```

### 2. Configure Environment Variables
Buat file `.env` di root direktori dan konfigurasi sesuai kebutuhan. Anda bisa melihat konfigurasi contoh di [sini](/.env).

### 3. Build and Run the Project
Untuk menjalankan proyek dalam mode pengembangan, gunakan perintah berikut:
```sh
npm run dev
```
Untuk mode produksi, lakukan build proyek dan jalankan aplikasinya:
```sh
npm run build
npm run start
```

### 4. Scan Barcode
Setelah menjalankan proyek, ikuti instruksi di terminal untuk memindai QR Code guna melakukan autentikasi bot WhatsApp.

---

## Folder Structure

Struktur direktori proyek:
```
src
│   main.ts        # Titik masuk utama aplikasi
│
├───bot
│       bot.ts     # Konfigurasi bot WhatsApp
│
├───command        # Tambahkan perintah baru di sini menggunakan CommandType
│       help.ts
│       remove-bg.ts
│       status.ts
│       sticker.ts
│
├───event          # Handler event WhatsApp Web.js
│       message.ts
│       qr-code.ts
│       ready.ts
│
├───lib
│       util.ts    # Fungsi utilitas yang sering digunakan
│
├───middleware     # Middleware seperti rate limiter
│       limiter.ts
│
└───types          # Definisi tipe TypeScript
        client.d.ts
```

---

## How to Create a New Command

### 1. Create a New File
Tambahkan file baru di direktori `src/command`. Bisa dibuat secara manual atau langsung akses [di sini](/src/command/).

### 2. Command Code Structure
Berikut adalah contoh struktur kode untuk sebuah command:

```typescript
import { CommandType } from "../types/client";
import { createSessionUser, generateSessionFooterContent, deleteSessionUser } from "../lib/session";

module.exports = {
  // Nama perintah yang digunakan untuk pemanggilan
  // Nama akan selalu di awali prefix contoh : {prefix}name
  name: "name",
  description: "Deskripsi perintah",
  
  // Fungsi utama yang dieksekusi saat perintah dipanggil
  execute: (message, client) => {
    // Membuat sesi baru untuk perintah ini
    createSessionUser('name', message, { parse: 'tutorial' })
    
    // gunakan fungsi ini untuk membuat daftar sub-command yang tersedia secara dinamis
    let content = generateSessionFooterContent('name');
    message.reply(content);
  },
  
  // Sub-command yang hanya bisa diakses dalam sesi
  // Jika sesi sudah di buat fungsi utama command tidak akan di panggil dan hanya memanggil sub command yang berada disini
  commands: [
    {
      name: "/tutorial",
      description: "Deskripsi sub-command tutorial",
      execute: (message, client, data) => {
        console.log(data); // Output: { parse: "tutorial" }
        
        // Memperbarui data sesi untuk percakapan berikutnya
        createSessionUser('name', message, { parse: 'tutorial2' });

        // Gunakan fungsi ini jika ingin menghapus sesi
        deleteSessionUser(message);
      }
    }
  ]
} as CommandType;
```

### 3. Understanding Sessions
- `createSessionUser(name, message, data)`: Membuat sesi berdasarkan perintah yang dipanggil.
- `generateSessionFooterContent(name)`: Menampilkan daftar sub-command yang tersedia.
- `deleteSessionUser(message)`: Menghapus sesi ketika sudah tidak diperlukan.

---

## Types and Interfaces

### Command Types
```typescript
export type CommandSessionContentType = {
    name: string;
    description: string;
    execute: (message: Message, client: ClientType, data: object | any) => void;
};

export type CommandType = {
    name: string;
    description: string;
    usage?: string;
    execute: (message: Message, client: ClientType) => void;
    commands?: CommandSessionContentType[];
};

export type SessionUserType = {
    session: CommandType;
    data: object | any;
};
```

### Client Type
```typescript
export interface ClientType extends Client {
    commands: Map<string, CommandType>;
    limiter: {
        max: number;
        users: Map<string, number>;
        userTotal: number;
        startTime: number;
    };
    session: {
        users: Map<string, SessionUserType>;
    };
}
```

---

## Best Practices
✅ **Gunakan sesi dengan bijak**: Jangan simpan terlalu banyak data di dalam sesi untuk menghindari memory leak.
✅ **Pisahkan fungsi utama dan utilitas**: Simpan helper functions dalam `lib/` agar kode lebih modular.
✅ **Gunakan TypeScript dengan baik**: Pastikan semua fungsi memiliki tipe data yang sesuai agar lebih aman dan maintainable.
✅ **Log setiap error**: Pastikan setiap catch block memiliki `console.log(error)` agar memudahkan debugging.
✅ **Bersihkan sesi setelah digunakan**: Gunakan `deleteSessionUser(message)` setelah sesi tidak dibutuhkan.

---

Dokumentasi ini telah diperbarui agar lebih detail dan mudah dipahami. Jika ada bagian yang masih kurang jelas atau perlu diperbaiki, silakan beri masukan! 🚀

