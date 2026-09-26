// Fixture: Floating unawaited promises inside async handler
export async function updateUserEmail(prisma: any, userId: string, newEmail: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { email: newEmail }
  });

  // Floating unawaited database log creation
  prisma.auditLog.create({
    data: { action: 'EMAIL_CHANGED', userId }
  });

  return user;
}
