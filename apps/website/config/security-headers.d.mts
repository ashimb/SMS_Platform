export interface HeaderOptions {
  isDev?: boolean;
  mediaHosts?: readonly string[];
}

export function buildCsp(options?: HeaderOptions): string;
export function securityHeaders(options?: HeaderOptions): { key: string; value: string }[];
export function parseMediaHosts(raw: string | undefined): string[];
