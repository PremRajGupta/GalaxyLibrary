declare module '@cashfreepayments/cashfree-js' {
  interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: string;
  }

  interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<unknown>;
  }

  export function load(options: { mode: 'sandbox' | 'production' }): Promise<CashfreeInstance>;
}
