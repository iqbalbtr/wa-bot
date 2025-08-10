import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import logger from '../shared/lib/logger';


export function convertPdfToDocx(pdfPath: string, docxPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(pdfPath)) {
            return reject(new Error(`Input PDF file not found at: ${pdfPath}`));
        }

        const command = `pdf2docx convert "${pdfPath}" "${docxPath}"`;

        exec(command, (error: Error | null, stdout: string, stderr: string) => {

            if (error) {
                logger.error(`[ERROR] Failed to execute command: ${error.message}`);
                return reject(new Error(`Execution failed. Is 'pdf2docx' installed and in your PATH? Error: ${stderr || error.message}`));
            }

            if (stderr) {
                logger.warn(`[WARN] Stderr: ${stderr}`);
            }

            resolve(`Successfully converted ${path.basename(pdfPath)} to ${path.basename(docxPath)}`);
        });
    });
}
