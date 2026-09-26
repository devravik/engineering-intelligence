// False-Positive Trap Fixture: Legitimate module-level memoization cache, telemetry metrics, and init flags
const responseCache = new Map<string, any>();
const telemetryMetrics = new Map<string, number>();
let isInitialized = false;

export async function GET(req: Request) {
  if (!isInitialized) {
    isInitialized = true;
  }

  const cacheKey = 'global_data';
  if (responseCache.has(cacheKey)) {
    return Response.json(responseCache.get(cacheKey));
  }

  const data = { status: 'healthy', timestamp: Date.now() };
  responseCache.set(cacheKey, data);
  telemetryMetrics.set('hits', (telemetryMetrics.get('hits') || 0) + 1);

  return Response.json(data);
}
