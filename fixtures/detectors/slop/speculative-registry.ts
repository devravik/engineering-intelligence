export class PaymentGatewayRegistry {
  private static gateways: any[] = [];

  static register(gateway: any) {
    this.gateways.push(gateway);
  }
}

// Single hardcoded registration across whole codebase
PaymentGatewayRegistry.register({ name: 'stripe' });
