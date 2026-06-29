export function publishedWhere() {
  const now = new Date();
  return {
    hidden: false,
    OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
  };
}
