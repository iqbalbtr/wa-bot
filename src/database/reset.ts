import "dotenv/config"
import fs from "fs"
import path from "path"
import { databaseUrl } from "../shared/constant/env"
import logger from "../shared/lib/logger"

async function main(){
    const pathDb = path.join(path.resolve(), databaseUrl)    
    fs.rmSync(pathDb, { force: true, recursive: true });
    logger.info("Success reseting database");
}

main()