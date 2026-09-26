export async function getCustomerOrderSummaries(orders: Array<{ id: string }>, db: any) {
  const results = [];
  for (const order of orders) {
    const items = await db.orderItem.findMany({ where: { orderId: order.id } });
    results.push({ order, items });
  }
  return results;
}
