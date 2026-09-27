export class OrderManager {
  async cancelOrder(id: string) {
    return true;
  }
  async refundOrder(id: string) {
    return true;
  }
  async getOrderStatus(id: string) {
    return 'cancelled';
  }
}

export class OrderService {
  async cancelOrder(id: string) {
    return true;
  }
  async refundOrder(id: string) {
    return true;
  }
  async getOrderStatus(id: string) {
    return 'cancelled';
  }
}
