// Fixture: Unbounded HTTP request without timeout or AbortSignal
export async function fetchRemoteUserProfile(userId: string) {
  const response = await fetch(`https://api.partner.com/users/${userId}`);
  return await response.json();
}
