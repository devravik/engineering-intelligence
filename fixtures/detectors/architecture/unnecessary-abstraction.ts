export interface IOrderService {
  processOrder(id: string): Promise<boolean>;
}

export class OrderService implements IOrderService {
  async processOrder(id: string): Promise<boolean> {
    return true;
  }
}
