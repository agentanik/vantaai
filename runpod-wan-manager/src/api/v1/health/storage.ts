import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { config } from '../../../lib/config';

export const getStorageHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const outputDir = config.outputDir;
    const workspacePath = config.runpodVolumeMountPath || '/workspace';
    
    // Standard ComfyUI Wan2.2 paths inside workspace
    const modelPaths = {
      checkpoints: path.join(workspacePath, 'ComfyUI', 'models', 'checkpoints'),
      unet: path.join(workspacePath, 'ComfyUI', 'models', 'unet'),
      vae: path.join(workspacePath, 'ComfyUI', 'models', 'vae'),
      clip: path.join(workspacePath, 'ComfyUI', 'models', 'clip')
    };

    const outputDirExists = fs.existsSync(outputDir);
    const workspaceExists = fs.existsSync(workspacePath);

    res.status(200).json({
      success: true,
      outputPath: outputDir,
      workspaceMount: workspacePath,
      modelPaths,
      localCheck: {
        outputDirExists,
        workspaceExists
      }
    });
  } catch (error) {
    next(error);
  }
};
