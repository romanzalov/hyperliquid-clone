export async function fetchWithRetry(
  input: RequestInfo,
  init: RequestInit = {},
  retryCount = 5,
  backoffMs = 500
): Promise<unknown> {
  for (let i = 0; i < retryCount; i++) {
    const res = await fetch(input, init);
    if (res.status !== 429) {
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return res.json();
    }
    const delay = backoffMs * 2 ** i;
    await new Promise((r) => setTimeout(r, delay));
  }
  throw new Error("Exceeded retry limit due to rate limiting.");
} 