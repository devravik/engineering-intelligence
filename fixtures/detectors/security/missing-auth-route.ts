// src/api/routes/users/delete.ts
export async function DELETE(req: any, db: any) {
  // Directly deletes user account without verifying caller authorization
  await db.user.delete({ where: { id: req.params.id } });
  return { success: true };
}
