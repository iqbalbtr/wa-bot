import "dotenv/config"
import fs from "fs"
import path from "path"
import { databaseUrl } from "../shared/constant/env"

async function main(){
    const pathDb = path.join(path.resolve(), databaseUrl)    
    fs.rmSync(pathDb, { force: true, recursive: true });
    console.log("Success reseting database");
}

main()