// False-Positive Trap Fixture: Non-secret placeholders and benign numeric SQL interpolation
export const config = {
  apiKey: 'YOUR_API_KEY_HERE',
  dummySecret: 'test-secret',
  placeholderToken: 'changeme'
};

export async function getUsersWithPaging(db: any, limit: number) {
  // Benign numeric configuration interpolation in SQL query
  const query = `SELECT * FROM users ORDER BY id ASC LIMIT ${10}`;
  return await db.query(query);
}
