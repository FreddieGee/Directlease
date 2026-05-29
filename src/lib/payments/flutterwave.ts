export const FLUTTERWAVE_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-xxxxxxxxxxxxxx';
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK_TEST-xxxxxxxxxxxxxx';
const FLUTTERWAVE_ENCRYPTION_KEY = process.env.FLUTTERWAVE_ENCRYPTION_KEY || 'FLWSECK_TEST-xxxxxxxxxxxxxx';
const FLUTTERWAVE_API = 'https://api.flutterwave.com/v3';

export interface FlutterwaveInitResponse {
  status: string;
  message: string;
  data: {
    link: string;
    id: number;
    tx_ref: string;
  };
}

export interface FlutterwaveVerifyResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    status: string;
    processor_response: string;
    created_at: string;
    meta: any;
  };
}

export async function initializeFlutterwavePayment(params: {
  email: string;
  amount: number;
  txRef: string;
  name?: string;
  phone?: string;
  meta?: Record<string, any>;
  redirectUrl?: string;
}): Promise<FlutterwaveInitResponse> {
  const response = await fetch(`${FLUTTERWAVE_API}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: params.txRef,
      amount: params.amount,
      currency: 'NGN',
      redirect_url: params.redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/tenant/transactions`,
      meta: params.meta,
      customer: {
        email: params.email,
        name: params.name || 'DirectLease User',
        phonenumber: params.phone || '',
      },
      customizations: {
        title: 'DirectLease Payment',
        description: 'Property Transaction Payment',
        logo: 'https://directlease.com/logo.png',
      },
    }),
  });

  return response.json();
}

export async function verifyFlutterwavePayment(transactionId: number): Promise<FlutterwaveVerifyResponse> {
  const response = await fetch(`${FLUTTERWAVE_API}/transactions/${transactionId}/verify`, {
    headers: {
      Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
    },
  });

  return response.json();
}

export function generateFlutterwaveTxRef(prefix: string = 'DL-FW'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}