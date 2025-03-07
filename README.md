## Getting start

#### 1. Instal dependensi
```cmd
$ npm install
```

#### 2. Konfigurasi env
>Create .env file at root folder,
>config [here](/.env)

#### 3. Build or dev
for development
```cmd
$ npm run dev
```
for production
```cmd
$ npm run build
$ npm run start
```
#### 4. Scan barcode

## Folder Structure

```
  src
   │   main.ts 👈 this is entry point
   │
   ├───bot
   │       bot.ts 👈 you can config bot here
   │
   ├───command 👈 add new comand here, use CommandType
   │       help.ts
   │       remove-bg.ts
   │       status.ts
   │       sticker.ts
   │
   ├───event  👈 add new event here
   │       message.ts
   │       qr-code.ts
   │       ready.ts
   │
   ├───lib
   │       util.ts
   │
   ├───middleware 👈 add middleware here
   │       limiter.ts
   │
   └───types
           client.d.ts
```