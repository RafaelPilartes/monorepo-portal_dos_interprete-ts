export function isCatalogMessage(code: string, message: string): boolean {
  return code.length > 0 && message.length > 0
}
export interface Shape { field: string | null; message: string }
