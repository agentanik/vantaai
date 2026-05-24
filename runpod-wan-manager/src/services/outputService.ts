import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { getComfyHistory, findOutputVideoFromHistory } from '../lib/comfyClient';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { ComfyUIError } from '../lib/errors';

export class OutputService {
  public async processJobOutput(
    comfyBaseUrl: string,
    promptId: string
  ): Promise<{ fileName: string; folderPath: string; localPath: string }> {
    logger.info(`Collecting generation outputs for ComfyUI Prompt ID: ${promptId}`);
    
    const history = await getComfyHistory(comfyBaseUrl, promptId);
    const fileName = findOutputVideoFromHistory(history, promptId);
    
    if (!fileName) {
      logger.error(`No output file matching gifs/images arrays found in history for prompt: ${promptId}`);
      throw new ComfyUIError(`Output video file not found in ComfyUI history for request: ${promptId}`);
    }
    
    const folderPath = path.resolve(env.outputDir);
    const sanitizedFileName = path.basename(fileName);
    const localPath = path.join(folderPath, sanitizedFileName);
    
    if (!path.resolve(localPath).startsWith(folderPath)) {
      logger.error(`Path traversal warning: output path ${localPath} escapes output directory ${folderPath}`);
      throw new ComfyUIError(`Invalid output filename retrieved: path traversal detected.`);
    }
    
    const downloadUrl = `${comfyBaseUrl}/view?filename=${encodeURIComponent(fileName)}&type=output`;
    
    logger.info(`Detected output file: ${fileName}. Commencing local download from ComfyUI: ${downloadUrl}`);
    
    // Ensure download folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    try {
      const response = await axios({
        method: 'GET',
        url: downloadUrl,
        responseType: 'stream',
        timeout: 60000 // 1 minute download timeout
      });

      const writer = fs.createWriteStream(localPath);
      response.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', (err) => reject(err));
      });

      logger.info(`Successfully stored output locally to: ${localPath}`);
    } catch (err: any) {
      logger.error(`Failed to download output locally from ComfyUI: ${err.message}`);
      throw new ComfyUIError(`Failed to transfer output file from pod: ${err.message}`);
    }
    
    return {
      fileName,
      folderPath,
      localPath
    };
  }
}

export const outputService = new OutputService();
