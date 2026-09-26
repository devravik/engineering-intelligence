// Fixture: Raw SQL injection via direct string interpolation
export async function getUserByInput(db: any, userInput: string) {
  const query = `SELECT * FROM users WHERE username = '${userInput}'`;
  return await db.query(query);
}
