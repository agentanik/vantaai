import path from 'path';

export class PathSafety {
  /**
   * Validates that the requested filename contains no directory traversal attempts.
   */
  public static isSafeFilename(filename: string): boolean {
    // Block null bytes, relative traversal tokens, and path separators
    if (filename.includes('\0') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return false;
    }
    
    // Only allow alphanumeric, dash, underscore, dot, and standard video/image extensions
    const safeRegex = /^[a-zA-Z0-9_\-\.]+\.(mp4|gif|png|jpg|jpeg|webp|json)$/;
    return safeRegex.test(filename);
  }

  /**
   * Resolves the safe path under the base output directory, throwing if traversal is detected.
   */
  public static resolveSafePath(baseDir: string, filename: string): string {
    if (!this.isSafeFilename(filename)) {
      throw new Error(`Directory traversal attempt detected or invalid file name: ${filename}`);
    }
    
    const resolvedPath = path.resolve(baseDir, filename);
    const resolvedBase = path.resolve(baseDir);
    
    if (!resolvedPath.startsWith(resolvedBase)) {
      throw new Error('Directory traversal resolved path outside output boundary');
    }
    
    return resolvedPath;
  }
}
