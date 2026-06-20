export function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

export function regexError(pattern: string): string {
  try {
    new RegExp(pattern);
    return '';
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}
