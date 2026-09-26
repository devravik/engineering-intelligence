// False-Positive Trap Fixture: Synchronous helper calls and safely handled .catch() promises
export async function updateUserProfile(prisma: any, logger: any, metrics: any, cache: any) {
  // Synchronous method calls that do not return promises
  logger.info('Updating user profile');
  metrics.increment('profile.updates');
  cache.set('key', 'value');

  // Asynchronous promise safely handled with .catch() without await
  prisma.auditLog.create({
    data: { event: 'PROFILE_UPDATED' }
  }).catch((err: any) => {
    logger.error('Failed to write audit log', err);
  });

  return { success: true };
}
