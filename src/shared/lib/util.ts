import { spawn } from "child_process"

export async function childProcessCallback(cmd: string, ...args: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const process = spawn(cmd, args);

        let output: string[] = [];

        process.stdout.on('data', data => {
            output.push(data.toString());
        });

        process.stderr.on("data", (data) => {
            console.log(`stderr: ${data}`);
        });

        process.on('exit', code => {
            console.log(`Process ended with ${code}`);
            resolve(output);
        });

        process.on('error', (error) => {
            console.error(`Error: ${error}`);
            reject(error);
        });
    });
}