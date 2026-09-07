export interface TestConnectionInput {
  keyId: string;
  keySecret: string;
  mode?: 'test' | 'live';
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  accountName?: string;
  error?: string;
}

export interface CreateOrderParams {
  amountInPaisa: number; // e.g. 50000 for 500.00 INR
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
  transferDetails?: {
    accountId: string;
    amountInPaisa: number;
    currency: string;
  };
}

export interface PaymentOrderResult {
  providerOrderId: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  keyId: string;
}

export interface VerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface IPaymentProvider {
  providerName: string;
  testConnection(credentials: TestConnectionInput): Promise<TestConnectionResult>;
  createOrder(params: CreateOrderParams, credentials: { keyId: string; keySecret: string }): Promise<PaymentOrderResult>;
  verifyPaymentSignature(params: VerifySignatureParams, keySecret: string): boolean;
  fetchPayment(paymentId: string, credentials: { keyId: string; keySecret: string }): Promise<any>;
  capturePayment(paymentId: string, amountInPaisa: number, credentials: { keyId: string; keySecret: string }): Promise<any>;
  refundPayment(paymentId: string, amountInPaisa: number, credentials: { keyId: string; keySecret: string }, notes?: Record<string, string>): Promise<any>;
  verifyWebhookSignature(rawBody: string | Buffer, signature: string, webhookSecret: string): boolean;
}
