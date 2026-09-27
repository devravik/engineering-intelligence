class StripePaymentProcessor {
  charge() {
    return true;
  }
}

export class PaymentProcessorFactory {
  static createProcessor() {
    return new StripePaymentProcessor();
  }
}
