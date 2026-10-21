const MAX_THUMBNAIL_LENGTH = 2048;
const MAX_SIGNED_URL_TTL_SECONDS = 7 * 24 * 60 * 60;

function signedUrlExpiry(url: URL): number | null | undefined {
  const dateText = url.searchParams.get("X-Amz-Date");
  const expiresText = url.searchParams.get("X-Amz-Expires");
  if (dateText === null && expiresText === null) return undefined;
  if (dateText === null || expiresText === null || !/^\d{1,6}$/.test(expiresText)) return null;

  const match = dateText.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  const ttlSeconds = Number(expiresText);
  if (!match || !Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0 || ttlSeconds > MAX_SIGNED_URL_TTL_SECONDS) {
    return null;
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute ||
    date.getUTCSeconds() !== second
  ) {
    return null;
  }
  return date.getTime() + ttlSeconds * 1000;
}

/** Extract only the checkout-time snapshot, never current mutable product media. */
export function getOrderSnapshotThumbnail(productData: unknown, now = Date.now()): string | null {
  if (!productData || typeof productData !== 'object' || Array.isArray(productData) || !('thumbnail' in productData)) return null;
  return getReusableOrderThumbnail(productData.thumbnail, now);
}

/** Reuse a stored thumbnail without probing its destination from the server. */
export function getReusableOrderThumbnail(value: unknown, now = Date.now()): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_THUMBNAIL_LENGTH) {
    return null;
  }
  if (value.startsWith("//")) return null;
  if (value.startsWith("/")) return value;

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(value);
  if (!hasScheme) return value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;

  const expiresAt = signedUrlExpiry(url);
  if (expiresAt === null || (expiresAt !== undefined && expiresAt <= now)) return null;
  return value;
}
