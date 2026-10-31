const SYNTHETIC_DOMAIN = "ashasarthi.app";

export function normalizeAshaId(ashaId: string): string {
  return ashaId.trim().toUpperCase();
}

export function ashaIdToEmail(ashaId: string): string {
  return `${normalizeAshaId(ashaId).toLowerCase()}@${SYNTHETIC_DOMAIN}`;
}

export function isValidAshaId(ashaId: string): boolean {
  return /^[A-Za-z0-9]{4,20}$/.test(ashaId.trim());
}