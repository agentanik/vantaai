export class InputSanitizer {
  /**
   * Sanitizes prompt strings, stripping out HTML/XML tags and limiting length.
   */
  public static sanitizePrompt(prompt: string, maxLength: number = 2000): string {
    if (!prompt) return '';
    
    // Strip tags and dangerous characters
    let cleaned = prompt
      .replace(/<[^>]*>/g, '') // remove HTML/XML tags
      .replace(/[\r\n\t]+/g, ' ') // collapse whitespaces
      .trim();

    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength);
    }
    
    return cleaned;
  }
}
