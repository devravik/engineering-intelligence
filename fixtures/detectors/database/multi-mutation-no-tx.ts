// Fixture: Multi-table sequential database mutations without atomic transaction
export async function processOrderCheckout(prisma: any, orderData: any, inventoryData: any) {
  // First mutation on orders
  const order = await prisma.order.create({
    data: orderData
  });

  // Second mutation on inventory without atomic transaction boundary
  const updatedInventory = await prisma.inventory.update({
    where: { itemId: inventoryData.itemId },
    data: { stock: { decrement: orderData.quantity } }
  });

  return { order, updatedInventory };
}
