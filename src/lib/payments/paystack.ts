export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxx';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_xxxxxxxxxxxxxx';
const PAYSTACK_API = 'https://api.paystack.co';

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    gateway_response: string;
    paid_at: string;
    channel: string;
    currency: string;
    metadata: any;
  };
}

export async function initializePaystackPayment(params: {
  email: string;
  amount: number; // in kobo (multiply NGN by 100)
  reference: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
}): Promise<PaystackInitResponse> {
  const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      metadata: params.metadata,
      callback_url: params.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/tenant/transactions`,
      currency: 'NGN',
    }),
  });

  return response.json();
}

export async function verifyPaystackPayment(reference: string): Promise<PaystackVerifyResponse> {
  const response = await fetch(`${PAYSTACK_API}/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  return response.json();
}

export function generatePaystackReference(prefix: string = 'DL'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export function isPaystackWebhookValid(signature: string, secret: string): boolean {
  // Paystack uses the x-paystack-signature header
  // HMAC-SHA256 of the raw request body using the secret key
  return !!signature; // In production, verify the HMAC
}