import { IPaymentProvider } from './payment.provider.interface';
import { razorpayProvider } from './razorpay.provider';

export class PaymentProviderFactory {
  private static providers: Map<string, IPaymentProvider> = new Map([
    ['razorpay', razorpayProvider]
  ]);

  static getProvider(providerName: string = 'razorpay'): IPaymentProvider {
    const normalized = providerName.toLowerCase().trim();
    const provider = this.providers.get(normalized);
    if (!provider) {
      throw new Error(`Payment provider '${providerName}' is not supported.`);
    }
    return provider;
  }

  static registerProvider(provider: IPaymentProvider) {
    this.providers.set(provider.providerName.toLowerCase().trim(), provider);
  }
}
