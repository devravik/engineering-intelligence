// Fixture: Server route mutating module-level in-memory state across concurrent requests
const activeSessions = new Map<string, any>();
let requestCounter = 0;

export async function POST(req: Request) {
  requestCounter++;
  const data = await req.json();
  activeSessions.set(data.sessionId, data.user);
  return Response.json({ success: true, count: requestCounter });
}
